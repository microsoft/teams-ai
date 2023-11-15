// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder-core";
import { TeamsChannelAccount, TokenResponse } from "botframework-schema";
import { MessagingExtensionAuthenticationBase } from "./MessagingExtensionAuthenticationBase";
import { TeamsSsoPromptSettings } from "./TeamsBotSsoPrompt";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { TeamsInfo } from "botbuilder";
import { MessagingExtensionsInvokeNames } from '../MessageExtensions';

export class TeamsSsoMessagingExtensionAuthentication extends MessagingExtensionAuthenticationBase {

    public constructor(private readonly settings: TeamsSsoPromptSettings, private readonly msal: ConfidentialClientApplication) {
        super();
    }

    public override isValidActivity(context: TurnContext): boolean {
        // Currently only search based messaging extensions has SSO
        return super.isValidActivity(context) && context.activity.name == MessagingExtensionsInvokeNames.QUERY_INVOKE;
    }

    public async handleSsoTokenExchange(context: TurnContext): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        const result = await this.msal.acquireTokenOnBehalfOf({
            oboAssertion: tokenExchangeRequest.token!, // The parent class ensures that this is not undefined
            scopes: this.settings.scopes
        });
        if (result) {
            return {
                connectionName: "",
                token: result.accessToken,
                expiration: result.expiresOn?.toISOString() ?? ""
            }
        }
        return undefined;
    }

    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return undefined; // Let parent class trigger silentAuth again
    }

    public async getSignInLink(context: TurnContext): Promise<string | undefined> {
        const clientId = this.settings.msalConfig.auth.clientId;
        const scope = encodeURI(this.settings.scopes.join(" "));
        const authority = this.settings.msalConfig.auth.authority ?? "https://login.microsoftonline.com/common/";
        const tenantId = authority.match(/https:\/\/[^\/]+\/([^\/]+)\/?/)?.[1];
        const loginHint = await this.getLoginHint(context);

        const signInLink = `${this.settings.signInLink}?scope=${scope}&clientId=${clientId}&tenantId=${tenantId}&loginHint=${loginHint}`;

        return signInLink;
    }

    private async getLoginHint(context: TurnContext): Promise<string | undefined> {
        const account: TeamsChannelAccount = await TeamsInfo.getMember(
            context,
            context.activity.from.id
        );
        return account.userPrincipalName;
    }
}