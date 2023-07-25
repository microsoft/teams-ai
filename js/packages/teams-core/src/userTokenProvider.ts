/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from './turnContext';
import { TokenResponse } from '@microsoft/teams-connector/src/schema';

/**
 * Interface for User Token OAuth APIs for BotAdapters
 *
 * @deprecated Use `UserTokenClient` instead.
 */
export interface IUserTokenProvider {
    /**
     * Retrieves the OAuth token for a user that is in a sign-in flow.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param magicCode (Optional) Optional user entered code to validate.
     */
    getUserToken(context: TurnContext, connectionName: string, magicCode?: string): Promise<TokenResponse>;

    /**
     * Signs the user out with the token server.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId User id of user to sign out.
     */
    signOutUser(context: TurnContext, connectionName: string, userId?: string): Promise<void>;

    /**
     * Retrieves the token status for each configured connection for the given user, using the bot's AppCredentials.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param userId The user Id for which token status is retrieved.
     * @param includeFilter Comma separated list of connection's to include. Blank will return token status for all configured connections.
     * @param oAuthAppCredentials The app credentials for OAuth.
     */
    getTokenStatus(
        context: TurnContext,
        userId: string,
        includeFilter?: string,
        oAuthAppCredentials?: any
    ): Promise<any[]>;

    /**
     * Gets a signin link from the token server that can be sent as part of a SigninCard.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     */
    getSignInLink(context: TurnContext, connectionName: string): Promise<string>;

    /**
     * Signs the user out with the token server.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     */
    getAadTokens(
        context: TurnContext,
        connectionName: string,
        resourceUrls: string[]
    ): Promise<{
        [propertyName: string]: TokenResponse;
    }>;
}
