import { Dialog, DialogContext, PromptRecognizerResult } from "botbuilder-dialogs";
import { ActionTypes, Activity, ActivityTypes, CardFactory, MessageFactory, OAuthCard, StatusCodes, TeamsChannelAccount, TeamsInfo, TokenExchangeInvokeRequest, TokenExchangeResource, TurnContext, tokenExchangeOperationName, verifyStateOperationName } from "botbuilder";
import { v4 as uuidv4 } from "uuid";
import jwt_decode from "jwt-decode";
import { SsoPromptSettings } from "./SsoPromptSettings";
import { OnBehalfOfUserCredential } from "@microsoft/teamsfx";

const invokeResponseType = "invokeResponse";

class TokenExchangeInvokeResponse {
  /**
   * Response id
   */
  id: string;

  /**
   * Detailed error message
   */
  failureDetail: string;

  constructor(id: string, failureDetail: string) {
    this.id = id;
    this.failureDetail = failureDetail;
  }
}

export class SsoPrompt extends Dialog {
  private initiateLoginEndpoint: string;
  private settings: SsoPromptSettings;
  
  constructor(
    dialogId: string,
    settings: SsoPromptSettings,
    initiateLoginEndpoint: string,
  ) {
    super(dialogId);
    this.settings = settings;
    this.initiateLoginEndpoint = initiateLoginEndpoint;

    this.validateScopesType(settings.scopes);
  }

  public async beginDialog(dc: any, options: any): Promise<any> {
    const default_timeout = 900000;
    let timeout: number = default_timeout;
    if (this.settings.timeout) {
      if (typeof this.settings.timeout != "number") {
        const errorMsg = "type of timeout property in teamsBotSsoPromptSettings should be number.";
        throw new Error(errorMsg);
      }
      if (this.settings.timeout <= 0) {
        const errorMsg =
          "value of timeout property in teamsBotSsoPromptSettings should be positive.";
        throw new Error(errorMsg);
      }
      timeout = this.settings.timeout;
    }

    if (this.settings.endOnInvalidMessage === undefined) {
      this.settings.endOnInvalidMessage = true;
    }
    const state = dc.activeDialog?.state;
    state.state = {};
    state.options = {};
    state.expires = new Date().getTime() + timeout;

    // Send OAuth card to get SSO token
    await dc.context.sendActivity(`send oauth card.`);
    await this.sendOAuthCardAsync(dc.context);
    await dc.context.sendActivity(`sent oauth card.`);
    return Dialog.EndOfTurn;
  }

  public async continueDialog(dc: any): Promise<any> {
    const state = dc.activeDialog?.state;
    const isMessage: boolean = dc.context.activity.type === ActivityTypes.Message;
    const isTimeoutActivityType: boolean =
      isMessage ||
      this.isTeamsVerificationInvoke(dc.context) ||
      this.isTokenExchangeRequestInvoke(dc.context);

    const hasTimedOut: boolean = isTimeoutActivityType && new Date().getTime() > state.expires;
    if (hasTimedOut) {
      return await dc.endDialog(undefined);
    } else {
      if (
        this.isTeamsVerificationInvoke(dc.context) ||
        this.isTokenExchangeRequestInvoke(dc.context)
      ) {
        const recognized: PromptRecognizerResult<any> =
          await this.recognizeToken(dc);

        if (recognized.succeeded) {
          return await dc.endDialog(recognized.value);
        }
      } else if (isMessage && this.settings.endOnInvalidMessage) {
        return await dc.endDialog(undefined);
      }

      return Dialog.EndOfTurn;
    }
  }

  private async recognizeToken(
    dc: DialogContext
  ): Promise<PromptRecognizerResult<any>> {
    const context = dc.context;
    let tokenResponse: any | undefined;

    if (this.isTokenExchangeRequestInvoke(context)) {
      // Received activity is not a token exchange request
      if (!(context.activity.value && this.isTokenExchangeRequest(context.activity.value))) {
        const warningMsg =
          "The bot received an InvokeActivity that is missing a TokenExchangeInvokeRequest value. This is required to be sent with the InvokeActivity.";

        await context.sendActivity(
          this.getTokenExchangeInvokeResponse(StatusCodes.BAD_REQUEST, warningMsg)
        );
      } else {
        const ssoToken = context.activity.value.token;
        const credential = new OnBehalfOfUserCredential(ssoToken, this.settings.appCredentials);
        let exchangedToken: any | null;
        try {
          exchangedToken = await credential.getToken(this.settings.scopes);

          if (exchangedToken) {
            await context.sendActivity(
              this.getTokenExchangeInvokeResponse(StatusCodes.OK, "", context.activity.value.id)
            );

            const ssoTokenExpiration = this.parseJwt(ssoToken).exp;
            tokenResponse = {
              ssoToken: ssoToken,
              ssoTokenExpiration: new Date(ssoTokenExpiration * 1000).toISOString(),
              connectionName: "",
              token: exchangedToken.token,
              expiration: exchangedToken.expiresOnTimestamp.toString(),
            };
          }
        } catch (error) {
          const warningMsg = "The bot is unable to exchange token. Ask for user consent.";
          await context.sendActivity(
            this.getTokenExchangeInvokeResponse(
              StatusCodes.PRECONDITION_FAILED,
              warningMsg,
              context.activity.value.id
            )
          );
        }
      }
    } else if (this.isTeamsVerificationInvoke(context)) {
      await this.sendOAuthCardAsync(dc.context);
      await context.sendActivity({ type: invokeResponseType, value: { status: StatusCodes.OK } });
    }

    return tokenResponse !== undefined
      ? { succeeded: true, value: tokenResponse }
      : { succeeded: false };
  }

  private getTokenExchangeInvokeResponse(
    status: number,
    failureDetail: string,
    id?: string
  ): Activity {
    const invokeResponse: Partial<Activity> = {
      type: invokeResponseType,
      value: { status, body: new TokenExchangeInvokeResponse(id as string, failureDetail) },
    };
    return invokeResponse as Activity;
  }

  private async sendOAuthCardAsync(context: TurnContext): Promise<void> {
    const account: TeamsChannelAccount = await TeamsInfo.getMember(
      context,
      context.activity.from.id
    );

    const loginHint: string = account.userPrincipalName ? account.userPrincipalName : "";
    const signInResource = this.getSignInResource(loginHint);
    const card = CardFactory.oauthCard(
      "",
      "Teams SSO Sign In",
      "Sign In",
      signInResource.signInLink,
      signInResource.tokenExchangeResource
    );
    (card.content as OAuthCard).buttons[0].type = ActionTypes.Signin;
    const msg: Partial<Activity> = MessageFactory.attachment(card);

    // Send prompt
    await context.sendActivity(msg);
  }

  private getSignInResource(loginHint: string) {
    const signInLink = `${this.initiateLoginEndpoint}?scope=${encodeURI(
      this.settings.scopes.join(" ")
    )}&clientId=${this.settings.appCredentials.clientId}&tenantId=${
      this.settings.appCredentials.tenantId
    }&loginHint=${loginHint}`;

    const tokenExchangeResource: TokenExchangeResource = {
      id: uuidv4(),
    };

    return {
      signInLink: signInLink,
      tokenExchangeResource: tokenExchangeResource,
    };
  }

  private validateScopesType(value: any): void {
    // string
    if (typeof value === "string" || value instanceof String) {
      return;
    }
  
    // empty array
    if (Array.isArray(value) && value.length === 0) {
      return;
    }
  
    // string array
    if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string")) {
      return;
    }
  
    const errorMsg = "The type of scopes is not valid, it must be string or string array";
    throw new Error(errorMsg);
  }

  private isTeamsVerificationInvoke(context: TurnContext): boolean {
    const activity: Activity = context.activity;

    return activity.type === ActivityTypes.Invoke && activity.name === verifyStateOperationName;
  }

  private isTokenExchangeRequestInvoke(context: TurnContext): boolean {
    const activity: Activity = context.activity;

    return activity.type === ActivityTypes.Invoke && activity.name === tokenExchangeOperationName;
  }

  private isTokenExchangeRequest(obj: any): obj is TokenExchangeInvokeRequest {
    return obj.hasOwnProperty("token");
  }

  private parseJwt(token: string): any {
    try {
      const tokenObj = jwt_decode(token) as any;
      if (!tokenObj || !tokenObj.exp) {
        throw new Error(
          "Decoded token is null or exp claim does not exists."
        );
      }
  
      return tokenObj;
    } catch (err: any) {
      const errorMsg = "Parse jwt token failed in node env with error: " + err.message;
      throw new Error(errorMsg);
    }
  }
}