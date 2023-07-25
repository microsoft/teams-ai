/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CoreAppCredentials } from './coreAppCredentials';
import { IUserTokenProvider } from './userTokenProvider';
import { TurnContext } from './turnContext';
import { SignInUrlResponse, TokenResponse, TokenExchangeRequest } from '@microsoft/teams-connector/src/schema';

/**
 * Interface for User Token OAuth Single Sign On and Token Exchange APIs for BotAdapters
 *
 * @deprecated Use `UserTokenClient` instead.
 */
export interface ExtendedUserTokenProvider extends IUserTokenProvider {
    /**
     * Retrieves the OAuth token for a user that is in a sign-in flow.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param magicCode (Optional) Optional user entered code to validate.
     */
    getUserToken(
        context: TurnContext,
        connectionName: string,
        magicCode?: string,
        appCredentials?: CoreAppCredentials
    ): Promise<TokenResponse>;

    /**
     * Signs the user out with the token server.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId User id of user to sign out.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     */
    signOutUser(
        context: TurnContext,
        connectionName: string,
        userId?: string,
        appCredentials?: CoreAppCredentials
    ): Promise<void>;

    /**
     * Gets a signin link from the token server that can be sent as part of a SigninCard.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     */
    getSignInLink(context: TurnContext, connectionName: string, appCredentials?: CoreAppCredentials): Promise<string>;

    /**
     * Signs the user out with the token server.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     */
    getAadTokens(
        context: TurnContext,
        connectionName: string,
        resourceUrls: string[],
        appCredentials?: CoreAppCredentials
    ): Promise<{
        [propertyName: string]: TokenResponse;
    }>;

    /**
     * Get the raw signin resource to be sent to the user for signin for a connection name.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     */
    getSignInResource(context: TurnContext, connectionName: string): Promise<SignInUrlResponse>;

    /**
     * Get the raw signin resource to be sent to the user for signin for a connection name.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param finalRedirect The final URL that the OAuth flow will redirect to.
     */
    getSignInResource(
        context: TurnContext,
        connectionName: string,
        userId: string,
        finalRedirect?: string
    ): Promise<SignInUrlResponse>;

    /**
     * Get the raw signin resource to be sent to the user for signin for a connection name.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param finalRedirect The final URL that the OAuth flow will redirect to.
     */
    getSignInResource(
        context: TurnContext,
        connectionName: string,
        userId: string,
        finalRedirect?: string,
        appCredentials?: CoreAppCredentials
    ): Promise<SignInUrlResponse>;

    /**
     * Performs a token exchange operation such as for single sign-on.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param tokenExchangeRequest The exchange request details, either a token to exchange or a uri to exchange.
     */
    exchangeToken(
        context: TurnContext,
        connectionName: string,
        userId: string,
        tokenExchangeRequest: TokenExchangeRequest
    ): Promise<TokenResponse>;

    /**
     * Performs a token exchange operation such as for single sign-on.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param tokenExchangeRequest The exchange request details, either a token to exchange or a uri to exchange.
     */
    exchangeToken(
        context: TurnContext,
        connectionName: string,
        userId: string,
        tokenExchangeRequest: TokenExchangeRequest,
        appCredentials: CoreAppCredentials
    ): Promise<TokenResponse>;
}
