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

type TeamsBotSsoPromptAppCredentials = {
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

export interface TeamsBotSsoPromptSettings {
  scopes: string[];
  timeout?: number;
  endOnInvalidMessage?: boolean;
  appCredentials: TeamsBotSsoPromptAppCredentials;
  initialLoginEndpoint: string;
}

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

export class TeamsBotSsoPrompt extends Dialog {
  private initiateLoginEndpoint: string;
  private settings: TeamsBotSsoPromptSettings;

  constructor(
    dialogId: string,
    settings: TeamsBotSsoPromptSettings,
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
    await this.sendOAuthCardAsync(dc.context);
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
    )}&clientId=${this.settings.appCredentials.clientId}&tenantId=${this.settings.appCredentials.tenantId
      }&loginHint=${loginHint}`;

    const tokenExchangeResource: TokenExchangeResource = {
      id: uuidv4(),
    };

    return {
      signInLink: signInLink,
      tokenExchangeResource: tokenExchangeResource,
    };
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
          clientId: this.settings.appCredentials.clientId!,
          authority: this.settings.appCredentials.authorityHost.replace(/\/+$/g, "") + "/" + this.settings.appCredentials.tenantId,
        };
        auth.clientSecret = this.settings.appCredentials.clientSecret;
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

  private getScopesArray(scopes: string | string[]): string[] {
    const scopesArray: string[] = typeof scopes === "string" ? scopes.split(" ") : scopes;
    return scopesArray.filter((x) => x !== null && x !== "");
  }
}