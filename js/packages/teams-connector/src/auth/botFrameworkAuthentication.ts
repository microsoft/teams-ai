// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, CallerIdConstants } from 'botframework-schema';
import { AuthenticateRequestResult } from './authenticateRequestResult';
import type { BotFrameworkClient } from '../skills';
import { ClaimsIdentity } from './claimsIdentity';
import type { ConnectorFactory } from './connectorFactory';
import { JwtTokenValidation } from './jwtTokenValidation';
import type { ServiceClientCredentialsFactory } from './serviceClientCredentialsFactory';
import { SkillValidation } from './skillValidation';
import type { UserTokenClient } from './userTokenClient';

/**
 * Represents a Cloud Environment used to authenticate Bot Framework Protocol network calls within this environment.
 */
export abstract class BotFrameworkAuthentication {
    /**
     * Validate Bot Framework Protocol requests.
     *
     * @param activity The inbound Activity.
     * @param authHeader The HTTP auth header.
     * @returns {Promise<AuthenticateRequestResult>} An [AuthenticateRequestResult](xref:botframework-connector.AuthenticateRequestResult).
     */
    abstract authenticateRequest(activity: Activity, authHeader: string): Promise<AuthenticateRequestResult>;

    /**
     * Validate Bot Framework Protocol requests.
     *
     * @param authHeader The HTTP auth header.
     * @param channelIdHeader The channel ID HTTP header.
     * @returns {Promise<AuthenticateRequestResult>} An [AuthenticateRequestResult](xref:botframework-connector.AuthenticateRequestResult).
     */
    abstract authenticateStreamingRequest(
        authHeader: string,
        channelIdHeader: string
    ): Promise<AuthenticateRequestResult>;

    /**
     * Creates a ConnectorFactory that can be used to create ConnectorClients that can use credentials from this particular Cloud Environment.
     *
     * @param claimsIdentity The inbound Activity's ClaimsIdentity.
     * @returns A [ConnectorFactory](xref:botframework-connector.ConnectorFactory).
     */
    abstract createConnectorFactory(claimsIdentity: ClaimsIdentity): ConnectorFactory;

    /**
     * Creates the appropriate UserTokenClient instance.
     *
     * @param claimsIdentity The inbound Activity's ClaimsIdentity.
     * @returns {Promise<UserTokenClient>} An [UserTokenClient](xref:botframework-connector.UserTokenClient).
     */
    abstract createUserTokenClient(claimsIdentity: ClaimsIdentity): Promise<UserTokenClient>;

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a BotFrameworkClient for calling Skills.
     *
     * @returns A [BotFrameworkClient](xref:botframework-connector.BotFrameworkClient).
     */
    createBotFrameworkClient(): BotFrameworkClient {
        throw new Error('NotImplemented');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Gets the originating audience from Bot OAuth scope.
     *
     * @returns The originating audience.
     */
    getOriginatingAudience(): string {
        throw new Error('NotImplemented');
    }

    // TODO: Update docstring - this is a direct port from .NET
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Authenticate Bot Framework Protocol request to Skills.
     *
     * @param authHeader The HTTP auth header in the skill request.
     * @returns {Promise<ClaimsIdentity>} A [ClaimsIdentity](xref:botframework-connector.ClaimsIdentity).
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authenticateChannelRequest(authHeader: string): Promise<ClaimsIdentity> {
        throw new Error('NotImplemented');
    }

    /**
     * Generates the appropriate callerId to write onto the Activity, this might be null.
     *
     * @param credentialFactory A ServiceClientCredentialsFactory to use.
     * @param claimsIdentity The inbound claims.
     * @param callerId The default callerId to use if this is not a skill.
     * @returns The callerId, this might be null.
     */
    protected async generateCallerId(
        credentialFactory: ServiceClientCredentialsFactory,
        claimsIdentity: ClaimsIdentity,
        callerId: string
    ): Promise<string | undefined> {
        // Is the bot accepting all incoming messages?
        if (await credentialFactory.isAuthenticationDisabled()) {
            // Return null so that the callerId is cleared.
            return undefined;
        }

        // Is the activity from another bot?
        return SkillValidation.isSkillClaim(claimsIdentity.claims)
            ? `${CallerIdConstants.BotToBotPrefix}${JwtTokenValidation.getAppIdFromClaims(claimsIdentity.claims)}`
            : callerId;
    }
}
