/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Dialog } from "../dialog";
import { TurnContext, TeamsChannelAccount, TeamsInfo, CardFactory, TokenExchangeResource, OAuthCard, ActionTypes, MessageFactory, Activity, ActivityTypes, verifyStateOperationName, tokenExchangeOperationName, TokenExchangeInvokeRequest, StatusCodes } from '@microsoft/teams-core';
import { v4 as uuidv4 } from 'uuid';
import { PromptRecognizerResult } from "./prompt";
import { DialogContext } from "../dialogContext";
import jwt_decode from "jwt-decode";
import { ConfidentialClientApplication, NodeAuthOptions } from "@azure/msal-node";

const invokeResponseType = "invokeResponse";

/**
 * Authentication configuration for TeamsBotSsoPrompt
 */
type TeamsBotSsoPromptAuthConfig = {
  /**
   * Hostname of AAD authority.
   */
  authorityHost: string;

  /**
   * The client (application) ID of an App Registration in the tenant
   */
  clientId: string;

  /**
   * AAD tenant id
   *
   * @readonly
   */
  tenantId: string;
} & (
    | {
      /**
       * Secret string that the application uses when requesting a token. Only used in confidential client applications. Can be created in the Azure app registration portal.
       */
      clientSecret: string;
      certificateContent?: never;
    }
    | {
      clientSecret?: never;
      /**
       * The content of a PEM-encoded public/private key certificate.
       *
       * @readonly
       */
      certificateContent: string;
    }
);

/**
 * Settings used to configure an TeamsBotSsoPrompt instance.
 */
export interface TeamsBotSsoPromptSettings {
  /**
   * The array of strings that declare the desired permissions and the resources requested.
   */
  scopes: string[];

  /**
   * (Optional) number of milliseconds the prompt will wait for the user to authenticate.
   * Defaults to a value `900,000` (15 minutes.)
   */
  timeout?: number;

  /**
   * (Optional) value indicating whether the TeamsBotSsoPrompt should end upon receiving an
   * invalid message.  Generally the TeamsBotSsoPrompt will end the auth flow when receives user
   * message not related to the auth flow. Setting the flag to false ignores the user's message instead.
   * Defaults to value `true`
   */
  endOnInvalidMessage?: boolean;
}

/**
 * Response body returned for a token exchange invoke activity.
 */
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

/**
 * Creates a new prompt that leverage Teams Single Sign On (SSO) support for bot to automatically sign in user and
 * help receive oauth token, asks the user to consent if needed.
 * 
 * @summary
 * The prompt will attempt to retrieve the users current token of the desired scopes and store it in
 * the token store.
 * 
 * User will be automatically signed in leveraging Teams support of Bot Single Sign On(SSO):
 * https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/auth-aad-sso-bots
 * 
 * > [!NOTE]
 * > You should avoid persisting the access token with your bots other state. The Bot Frameworks
 * > SSO service will securely store the token on your behalf. If you store it in your bots state
 * > it could expire or be revoked in between turns.
 * >
 * > When calling the prompt from within a waterfall step you should use the token within the step
 * > following the prompt and then let the token go out of scope at the end of your function.
 * 
 * @example
 * When used with your bots `DialogSet` you can simply add a new instance of the prompt as a named
 * dialog using `DialogSet.add()`. You can then start the prompt from a waterfall step using either
 * `DialogContext.beginDialog()` or `DialogContext.prompt()`. The user will be prompted to sign in as
 * needed and their access token will be passed as an argument to the callers next waterfall step:
 *
 * ```JavaScript
 * const { ConversationState, MemoryStorage } = require('botbuilder');
 * const { DialogSet, WaterfallDialog, TeamsBotSsoPrompt } = require('botbuilder-dialogs');
 *
 * const convoState = new ConversationState(new MemoryStorage());
 * const dialogState = convoState.createProperty('dialogState');
 * const dialogs = new DialogSet(dialogState);
 *
 * dialogs.add(new TeamsBotSsoPrompt('TeamsBotSsoPrompt', {
 *    scopes: ["User.Read"],
 * }));
 *
 * dialogs.add(new WaterfallDialog('taskNeedingLogin', [
 *      async (step) => {
 *          return await step.beginDialog('TeamsBotSsoPrompt');
 *      },
 *      async (step) => {
 *          const token = step.result;
 *          if (token) {
 *
 *              // ... continue with task needing access token ...
 *
 *          } else {
 *              await step.context.sendActivity(`Sorry... We couldn't log you in. Try again later.`);
 *              return await step.endDialog();
 *          }
 *      }
 * ]));
 * ```
 */
export class TeamsBotSsoPrompt extends Dialog {
  private initiateLoginEndpoint: string;
  private settings: TeamsBotSsoPromptSettings;
  private authConfig: TeamsBotSsoPromptAuthConfig;

  constructor(
    authConfig: TeamsBotSsoPromptAuthConfig,
    initiateLoginEndpoint: string,
    dialogId: string,
    settings: TeamsBotSsoPromptSettings,
  ) {
    super(dialogId);
    this.authConfig = authConfig;
    this.settings = settings;
    this.initiateLoginEndpoint = initiateLoginEndpoint;

    this.validateScopesType(settings.scopes);
  }

  /**
   * Called when a prompt dialog is pushed onto the dialog stack and is being activated.
   * @summary
   * If the task is successful, the result indicates whether the prompt is still
   * active after the turn has been processed by the prompt.
   *
   * @param dc The DialogContext for the current turn of the conversation.
   *
   * @returns A `Promise` representing the asynchronous operation.
   */
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
    await this.sendOAuthCardAsync(dc.context);
    return Dialog.EndOfTurn;
  }

  /**
   * Called when a prompt dialog is the active dialog and the user replied with a new activity.
   *
   * @summary
   * If the task is successful, the result indicates whether the dialog is still
   * active after the turn has been processed by the dialog.
   * The prompt generally continues to receive the user's replies until it accepts the
   * user's reply as valid input for the prompt.
   *
   * @param dc The DialogContext for the current turn of the conversation.
   *
   * @returns A `Promise` representing the asynchronous operation.
   */
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
        const recognized: PromptRecognizerResult<any> = await this.recognizeToken(dc);

        if (recognized.succeeded) {
          return await dc.endDialog(recognized.value);
        }
      } else if (isMessage && this.settings.endOnInvalidMessage) {
        return await dc.endDialog(undefined);
      }

      return Dialog.EndOfTurn;
    }
  }

  /**
   * @private
   */
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

  /**
   * @private
   */
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

  /**
   * @private
   */
  private getSignInResource(loginHint: string) {
    const signInLink = `${this.initiateLoginEndpoint}?scope=${encodeURI(
      this.settings.scopes.join(" ")
    )}&clientId=${this.authConfig.clientId}&tenantId=${this.authConfig.tenantId
      }&loginHint=${loginHint}`;

    const tokenExchangeResource: TokenExchangeResource = {
      id: uuidv4(),
    };

    return {
      signInLink: signInLink,
      tokenExchangeResource: tokenExchangeResource,
    };
  }

  /**
   * @private
   */
  private isTeamsVerificationInvoke(context: TurnContext): boolean {
    const activity: Activity = context.activity;

    return activity.type === ActivityTypes.Invoke && activity.name === verifyStateOperationName;
  }

  /**
   * @private
   */
  private isTokenExchangeRequestInvoke(context: TurnContext): boolean {
    const activity: Activity = context.activity;

    return activity.type === ActivityTypes.Invoke && activity.name === tokenExchangeOperationName;
  }

  /**
   * @private
   */
  private isTokenExchangeRequest(obj: any): obj is TokenExchangeInvokeRequest {
    return obj.hasOwnProperty("token");
  }

  /**
   * @private
   */
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

        const auth: NodeAuthOptions = {
          clientId: this.authConfig.clientId!,
          authority: this.authConfig.authorityHost.replace(/\/+$/g, "") + "/" + this.authConfig.tenantId,
        };
        auth.clientSecret = this.authConfig.clientSecret;
        const msalClient = new ConfidentialClientApplication({
          auth
        });
        let exchangedToken: any | null;
        try {
          let acqureTokenRes = await msalClient.acquireTokenOnBehalfOf({
            oboAssertion: ssoToken,
            scopes: this.getScopesArray(this.settings.scopes),
          });

          if (!acqureTokenRes) {
            const errorMsg = "Access token is null";
            throw new Error(
              `failed to acquire token on behalf of user: ${errorMsg}`,
            );
          }

          exchangedToken = {
            token: acqureTokenRes.accessToken,
            expiresOnTimestamp: acqureTokenRes.expiresOn!.getTime(),
          };

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

  /**
   * @private
   */
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

  /**
   * @private
   */
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

  /**
   * @private
   */
  private getScopesArray(scopes: string | string[]): string[] {
    const scopesArray: string[] = typeof scopes === "string" ? scopes.split(" ") : scopes;
    return scopesArray.filter((x) => x !== null && x !== "");
  }
}