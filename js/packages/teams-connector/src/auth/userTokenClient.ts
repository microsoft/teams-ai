// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';

import {
    Activity,
    ActivityEx,
    SignInUrlResponse,
    TokenExchangeRequest,
    TokenExchangeState,
    TokenResponse,
    TokenStatus,
} from 'botframework-schema';

/**
 * Client for access user token service.
 */
export abstract class UserTokenClient {
    /**
     * Attempts to retrieve the token for a user that's in a login flow.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     * @param magicCode (Optional) Optional user entered code to validate.
     * @returns {Promise<UserTokenClient>} A [TokenResponse](xref:botframework-schema.TokenResponse) object.
     */
    abstract getUserToken(
        userId: string,
        connectionName: string,
        channelId: string,
        magicCode: string
    ): Promise<TokenResponse>;

    /**
     * Get the raw signin link to be sent to the user for signin for a connection name.
     *
     * @param connectionName Name of the auth connection to use.
     * @param activity The [Activity](xref:botframework-schema.Activity) from which to derive the token exchange state.
     * @param finalRediect The final URL that the OAuth flow will redirect to.
     * @returns {Promise<SignInUrlResponse>} A [SignInUrlResponse](xref:botframework-schema.SignInUrlResponse).
     */
    abstract getSignInResource(
        connectionName: string,
        activity: Activity,
        finalRediect: string
    ): Promise<SignInUrlResponse>;

    /**
     * Signs the user out with the token server.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     */
    abstract signOutUser(userId: string, connectionName: string, channelId: string): Promise<void>;

    /**
     * Retrieves the token status for each configured connection for the given user.
     *
     * @param userId The user id that will be associated with the token.
     * @param channelId The channel Id that will be associated with the token.
     * @param includeFilter The includeFilter.
     * @returns {Promise<TokenStatus[]>} A list of [TokenStatus](xref:botframework-schema.TokenStatus) objects.
     */
    abstract getTokenStatus(userId: string, channelId: string, includeFilter: string): Promise<TokenStatus[]>;

    /**
     * Retrieves Azure Active Directory tokens for particular resources on a configured connection.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param resourceUrls The list of resource URLs to retrieve tokens for.
     * @param channelId The channel Id that will be associated with the token.
     * @returns {Promise<Record<string, TokenResponse>>} A Dictionary of resourceUrls to the corresponding [TokenResponse](xref:botframework-schema.TokenResponse).
     */
    abstract getAadTokens(
        userId: string,
        connectionName: string,
        resourceUrls: string[],
        channelId: string
    ): Promise<Record<string, TokenResponse>>;

    /**
     * Performs a token exchange operation such as for single sign-on.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     * @param exchangeRequest The exchange request details, either a token to exchange or a uri to exchange.
     * @returns {Promise<TokenResponse>} A [TokenResponse](xref:botframework-schema.TokenResponse) object.
     */
    abstract exchangeToken(
        userId: string,
        connectionName: string,
        channelId: string,
        exchangeRequest: TokenExchangeRequest
    ): Promise<TokenResponse>;

    /**
     * Helper function to create the Base64 encoded token exchange state used in getSignInResource calls.
     *
     * @param appId The appId to include in the token exchange state.
     * @param connectionName The connectionName to include in the token exchange state.
     * @param activity The [Activity](xref:botframework-schema.Activity) from which to derive the token exchange state.
     * @returns Base64 encoded token exchange state.
     */
    protected static createTokenExchangeState(appId: string, connectionName: string, activity: Activity): string {
        z.object({
            appId: z.string(),
            connectionName: z.string(),
            activity: z.record(z.unknown()),
        }).parse({
            appId,
            connectionName,
            activity,
        });

        const tokenExchangeState: TokenExchangeState = {
            connectionName,
            conversation: ActivityEx.getConversationReference(activity),
            relatesTo: activity.relatesTo!,
            msAppId: appId,
        };

        return Buffer.from(JSON.stringify(tokenExchangeState)).toString('base64');
    }
}
