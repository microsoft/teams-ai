// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TokenResponse, TurnContext } from 'botbuilder';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * @internal
 * 
 * Handles authentication for Teams Message Extension.
 */
export class OAuthPromptMessageExtensionAuthentication extends MessageExtensionAuthenticationBase {

    /**
     * Creates a new instance of OAuthPromptMessageExtensionAuthentication.
     * @param settings The OAuthPromptSettings.
     */
    public constructor(private readonly settings: OAuthPromptSettings) {
        super();
    }

    /**
     * Handles the SSO token exchange.
     * @param context The turn context.
     * @returns A promise that resolves to the token response or undefined if token exchange failed.
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
     * @param context The turn context.
     * @param magicCode The magic code from sign-in.
     * @returns A promise that resolves to undefined. The parent class will trigger silentAuth again.
     */
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return await UserTokenAccess.getUserToken(context, this.settings, magicCode);
    }

    /**
     * Gets the sign-in link for the user.
     * @param context The turn context.
     * @returns A promise that resolves to the sign-in link or undefined if no sign-in link available.
     */
    public async getSignInLink(context: TurnContext): Promise<string | undefined> {
        const signInResource = await UserTokenAccess.getSignInResource(context, this.settings);
        return signInResource.signInLink;
    }
}
