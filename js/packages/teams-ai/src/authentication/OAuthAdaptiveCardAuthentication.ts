// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TokenResponse, TurnContext } from 'botbuilder-core';
import { AdaptiveCardAuthenticationBase, AdaptiveCardLoginRequest } from './AdaptiveCardAuthenticationBase';
import { AuthError, OAuthSettings } from './Authentication';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * @internal
 *
 * Handles authentication for Adaptive Cards in Teams.
 */
export class OAuthAdaptiveCardAuthentication extends AdaptiveCardAuthenticationBase {
    /**
     * Creates a new instance of OAuthAdaptiveCardAuthentication.
     * @param {OAuthSettings} settings The OAuthSettings.
     */
    public constructor(private readonly settings: OAuthSettings) {
        super();
    }

    /**
     * Handles the SSO token exchange.
     * @param {TurnContext} context The turn context.
     * @returns {Promise<TokenResponse | undefined>} A promise that resolves to the token response or undefined if token exchange failed.
     */
    public async handleSsoTokenExchange(context: TurnContext): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, this.settings, tokenExchangeRequest);
    }

    /**
     * Handles the signin/verifyState activity.
     * @param {TurnContext} context The turn context.
     * @param {string} magicCode The magic code from sign-in.
     * @returns {Promise<TokenResponse | undefined>} A promise that resolves to undefined. The parent class will trigger silentAuth again.
     */
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return await UserTokenAccess.getUserToken(context, this.settings, magicCode);
    }

    /**
     * Gets the sign-in link for the user.
     * @param {TurnContext} context The turn context.
     * @returns {Promise<TokenResponse | undefined>} A promise that resolves to the sign-in link or undefined if no sign-in link available.
     */
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

        if (this.settings.tokenExchangeUri && this.settings.enableSso == true) {
            const botId = context.activity.recipient.id;
            response.value.tokenExchangeResource = {
                id: botId,
                uri: this.settings.tokenExchangeUri
            };
        }

        return response;
    }
}
