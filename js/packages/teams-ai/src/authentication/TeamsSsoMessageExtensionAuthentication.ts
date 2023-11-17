// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder-core";
import { TokenResponse } from "botframework-schema";
import { MessageExtensionAuthenticationBase } from "./MessageExtensionAuthenticationBase";
import { TeamsSsoSettings } from "./TeamsBotSsoPrompt";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { MessageExtensionsInvokeNames } from '../MessageExtensions';

export class TeamsSsoMessageExtensionAuthentication extends MessageExtensionAuthenticationBase {

    public constructor(private readonly settings: TeamsSsoSettings, private readonly msal: ConfidentialClientApplication) {
        super();
    }

    public override isValidActivity(context: TurnContext): boolean {
        // Currently only search based message extensions has SSO
        return super.isValidActivity(context) && context.activity.name == MessageExtensionsInvokeNames.QUERY_INVOKE;
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

        const signInLink = `${this.settings.signInLink}?scope=${scope}&clientId=${clientId}&tenantId=${tenantId}`;

        return signInLink;
    }

}