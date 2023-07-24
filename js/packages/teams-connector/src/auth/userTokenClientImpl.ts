// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import type { ServiceClientCredentials } from '@azure/ms-rest-js';
import { Activity, SignInUrlResponse, TokenExchangeRequest, TokenResponse, TokenStatus } from 'botframework-schema';
import { ConnectorClientOptions } from '../connectorApi/models';
import { TokenApiClient } from '../tokenApi/tokenApiClient';
import { UserTokenClient } from './userTokenClient';

/**
 * @internal
 * Implementation of [UserTokenClient](xref:botframework-connector.UserTokenClient) for access user token service.
 */
export class UserTokenClientImpl extends UserTokenClient {
    private readonly client: TokenApiClient;
    /**
     * @param appId The appId.
     * @param credentials AppCredentials for OAuth.
     * @param oauthEndpoint The OAuth API endpoint.
     * @param connectorClientOptions A ConnectorClientOptions object.
     */
    constructor(
        private readonly appId: string,
        credentials: ServiceClientCredentials,
        oauthEndpoint: string,
        connectorClientOptions: ConnectorClientOptions = {}
    ) {
        super();
        this.client = new TokenApiClient(
            credentials,
            Object.assign({ baseUri: oauthEndpoint }, connectorClientOptions)
        );
    }

    /**
     * Attempts to retrieve the token for a user that's in a login flow.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     * @param magicCode (Optional) Optional user entered code to validate.
     * @returns The token Response.
     */
    async getUserToken(
        userId: string,
        connectionName: string,
        channelId: string,
        magicCode: string
    ): Promise<TokenResponse> {
        z.object({
            userId: z.string(),
            connectionName: z.string(),
            channelId: z.string(),
        }).parse({
            userId,
            connectionName,
            channelId,
        });

        const result = await this.client.userToken.getToken(userId, connectionName, { channelId, code: magicCode });
        return result._response.parsedBody;
    }

    /**
     * Asynchronously Get the raw signin resource to be sent to the user for signin.
     *
     * @param connectionName Name of the auth connection to use.
     * @param activity The Activity from which to derive the token exchange state.
     * @param finalRedirect The final URL that the OAuth flow will redirect to.
     * @returns The [SignInUrlResponse](xref:botframework-schema.SignInUrlResponse) resource.
     */
    async getSignInResource(
        connectionName: string,
        activity: Activity,
        finalRedirect: string
    ): Promise<SignInUrlResponse> {
        z.object({
            activity: z.record(z.unknown()),
            connectionName: z.string(),
        }).parse({
            activity,
            connectionName,
        });

        const result = await this.client.botSignIn.getSignInResource(
            UserTokenClient.createTokenExchangeState(this.appId, connectionName, activity),
            { finalRedirect }
        );

        return result._response.parsedBody;
    }

    /**
     * Signs the user out with the token server.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     */
    async signOutUser(userId: string, connectionName: string, channelId: string): Promise<void> {
        z.object({
            userId: z.string(),
            connectionName: z.string(),
            channelId: z.string(),
        }).parse({
            userId,
            connectionName,
            channelId,
        });

        await this.client.userToken.signOut(userId, { channelId, connectionName });
    }

    /**
     * Retrieves the token status for each configured connection for the given user.
     *
     * @param userId The user id that will be associated with the token.
     * @param channelId The channel Id that will be associated with the token.
     * @param includeFilter The includeFilter.
     * @returns A promise with an Array of the Token Status.
     */
    async getTokenStatus(userId: string, channelId: string, includeFilter: string): Promise<TokenStatus[]> {
        z.object({
            userId: z.string(),
            channelId: z.string(),
        }).parse({
            userId,
            channelId,
        });

        const result = await this.client.userToken.getTokenStatus(userId, {
            channelId,
            include: includeFilter,
        });
        return result._response.parsedBody;
    }

    /**
     * Retrieves Azure Active Directory tokens for particular resources on a configured connection.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param resourceUrls The list of resource URLs to retrieve tokens for.
     * @param channelId The channel Id that will be associated with the token.
     * @returns A promise of Dictionary of resourceUrl to the corresponding TokenResponse.
     */
    async getAadTokens(
        userId: string,
        connectionName: string,
        resourceUrls: string[],
        channelId: string
    ): Promise<Record<string, TokenResponse>> {
        z.object({
            userId: z.string(),
            connectionName: z.string(),
            channelId: z.string(),
        }).parse({
            userId,
            connectionName,
            channelId,
        });

        const result = await this.client.userToken.getAadTokens(
            userId,
            connectionName,
            { resourceUrls },
            { channelId }
        );
        return result._response.parsedBody as Record<string, TokenResponse>;
    }

    /**
     * Performs a token exchange operation such as for single sign-on.
     *
     * @param userId The user id that will be associated with the token.
     * @param connectionName Name of the auth connection to use.
     * @param channelId The channel Id that will be associated with the token.
     * @param exchangeRequest The exchange request details, either a token to exchange or a uri to exchange.
     * @returns A promise representing the result of the operation.
     */
    async exchangeToken(
        userId: string,
        connectionName: string,
        channelId: string,
        exchangeRequest: TokenExchangeRequest
    ): Promise<TokenResponse> {
        z.object({
            userId: z.string(),
            connectionName: z.string(),
            channelId: z.string(),
        }).parse({
            userId,
            connectionName,
            channelId,
        });

        const result = await this.client.userToken.exchangeAsync(userId, connectionName, channelId, exchangeRequest);
        return result._response.parsedBody;
    }
}
