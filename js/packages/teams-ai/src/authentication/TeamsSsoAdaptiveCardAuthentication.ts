// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TurnContext } from 'botbuilder-core';
import { TokenResponse } from 'botframework-schema';
import { AdaptiveCardAuthenticationBase, AdaptiveCardLoginRequest } from './AdaptiveCardAuthenticationBase';

/**
 * @internal
 *
 * Handles authentication using Teams SSO for Adaptive Cards in Teams.
 */
export class TeamsSsoAdaptiveCardAuthentication extends AdaptiveCardAuthenticationBase {
    /**
     * Initializes a new instance of the TeamsSsoAdaptiveCardAuthentication class.
     */
    public constructor() {
        super();
    }

    /**
     * Handles the SSO token exchange.
     */
    public async handleSsoTokenExchange(): Promise<never> {
        throw new Error('Not implemented');
    }

    /**
     * Handles the user sign-in.
     * @param {TurnContext} context - The turn context.
     * @param {string} magicCode - The magic code from user sign-in.
     */
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        throw new Error('Not implemented');
    }

    /**
     * Gets the login request for Adaptive Card authentication.
     * @param {TurnContext} context - The turn context.
     */
    public async getLoginRequest(context: TurnContext): Promise<AdaptiveCardLoginRequest> {
        throw new Error('Not implemented');
    }

    /**
     * Checks if the activity is valid for Adaptive Card authentication.
     * @param {TurnContext} context - The turn context.
     * @returns {boolean} A boolean indicating if the activity is valid.
     */
    public override isValidActivity(context: TurnContext): boolean {
        if (super.isValidActivity(context)) {
            console.warn(
                'TeamsSsoSetting does not support Adaptive Card authentication yet. Please use OAuthSetting instead.'
            );
        }
        return false;
    }
}
