// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TokenResponse, TurnContext } from "botbuilder-core";
import { AdaptiveCardAuthenticationBase, AdaptiveCardLoginRequest } from "./AdaptiveCardAuthenticationBase";
import { AuthError, OAuthSettings } from "./Authentication";
import * as UserTokenAccess from './UserTokenAccess';

export class OAuthPromptAdaptiveCardAuthentication extends AdaptiveCardAuthenticationBase {
    public constructor(private readonly settings: OAuthSettings) {
        super();
    }

    public async handleSsoTokenExchange(
        context: TurnContext
    ): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, this.settings, tokenExchangeRequest);
    }
    
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return await UserTokenAccess.getUserToken(context, this.settings, magicCode);
    }

    public async getLoginRequest(context: TurnContext): Promise<AdaptiveCardLoginRequest> {
        const signInResource = await UserTokenAccess.getSignInResource(context, this.settings);
        const signInLink = signInResource.signInLink;

        if (!signInLink) {
            throw new AuthError('OAuthPrompt Authentication failed. No signin link found.');
        }

        const response: AdaptiveCardLoginRequest = {
            statusCode: 401,
            type: 'application/vnd.microsoft.activity.loginRequest',
            value: {
                text: this.settings.title,
                connectionName: this.settings.connectionName,
                buttons: [
                    {
                        title: 'Sign-In',
                        text: 'Sign-In',
                        type: 'signin',
                        value: signInLink
                    }
                ]
            }
        };

        if (this.settings.tokenExchangeUri) {
            const botId = context.activity.recipient.id;
            response.value.tokenExchangeResource = {
                id: botId,
                uri: this.settings.tokenExchangeUri
            };
        }

        return response;
    }
}