// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TurnContext } from 'botbuilder-core';
import { TokenResponse } from 'botframework-schema';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import { TeamsSsoSettings } from './TeamsSsoSettings';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { MessageExtensionsInvokeNames } from '../MessageExtensions';

/**
 * @internal
 *
 * Handles authentication for Teams Message Extension using Single Sign-On (SSO).
 */
export class TeamsSsoMessageExtensionAuthentication extends MessageExtensionAuthenticationBase {
    /**
     * Creates a new instance of TeamsSsoMessageExtensionAuthentication.
     * @param {TeamsSsoSettings} settings The Teams SSO settings.
     * @param {ConfidentialClientApplication} msal The MSAL (Microsoft Authentication Library) instance.
     */
    public constructor(
        private readonly settings: TeamsSsoSettings,
        private readonly msal: ConfidentialClientApplication
    ) {
        super();
    }

    /**
     * Checks if the activity is a valid Message Extension activity that supports SSO
     * @param {TurnContext} context The turn context.
     * @returns {boolean} A boolean indicating if the activity is valid.
     */
    public override isValidActivity(context: TurnContext): boolean {
        // Currently only search based message extensions has SSO
        return super.isValidActivity(context) && context.activity.name == MessageExtensionsInvokeNames.QUERY_INVOKE;
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

        const result = await this.msal.acquireTokenOnBehalfOf({
            oboAssertion: tokenExchangeRequest.token!, // The parent class ensures that this is not undefined
            scopes: this.settings.scopes
        });
        if (result) {
            return {
                connectionName: '',
                token: result.accessToken,
                expiration: result.expiresOn?.toISOString() ?? ''
            };
        }
        return undefined;
    }

    /**
     * Handles the signin/verifyState activity.
     * @param {TurnContext} context The turn context.
     * @param {string} magicCode The magic code from sign-in.
     * @returns {Promise<TokenResponse|undefined>} A promise that resolves to undefined. The parent class will trigger silentAuth again.
     */
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return undefined; // Let parent class trigger silentAuth again
    }

    /**
     * Gets the sign-in link for the user.
     * @param {TurnContext} context The turn context.
     * @returns {Promise<string>} A promise that resolves to the sign-in link.
     */
    public async getSignInLink(context: TurnContext): Promise<string> {
        const clientId = this.settings.msalConfig.auth.clientId;
        const scope = encodeURI(this.settings.scopes.join(' '));
        const authority = this.settings.msalConfig.auth.authority ?? 'https://login.microsoftonline.com/common/';
        const tenantId = authority.match(/https:\/\/[^\/]+\/([^\/]+)\/?/)?.[1];

        const signInLink = `${this.settings.signInLink}?scope=${scope}&clientId=${clientId}&tenantId=${tenantId}`;

        return signInLink;
    }

    /**
     * Should sign in using SSO flow.
     * @param {TurnContext} context - The turn context.
     * @returns {boolean} - A boolean indicating if the sign-in should use SSO flow.
     */
    public isSsoSignIn(context: TurnContext): boolean {
        if (context.activity.name === MessageExtensionsInvokeNames.QUERY_INVOKE) {
            return true;
        }
        return false;
    }
}
