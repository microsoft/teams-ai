/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, Channels, RoleTypes, StatusCodes } from 'botframework-schema';

import { AuthenticationError } from './authenticationError';
import { AuthenticationConfiguration } from './authenticationConfiguration';
import { AuthenticationConstants } from './authenticationConstants';
import { ChannelValidation } from './channelValidation';
import { Claim, ClaimsIdentity } from './claimsIdentity';
import { ICredentialProvider } from './credentialProvider';
import { EmulatorValidation } from './emulatorValidation';
import { EnterpriseChannelValidation } from './enterpriseChannelValidation';
import { GovernmentChannelValidation } from './governmentChannelValidation';
import { GovernmentConstants } from './governmentConstants';
import { SkillValidation } from './skillValidation';

/**
 * @deprecated Use `ConfigurationBotFrameworkAuthentication` instead to perform JWT token validation.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JwtTokenValidation {
    /**
     * Authenticates the request and sets the service url in the set of trusted urls.
     *
     * @param {Partial<Activity>} activity The incoming Activity from the Bot Framework or the Emulator
     * @param {string} authHeader The Bearer token included as part of the request
     * @param {ICredentialProvider} credentials The set of valid credentials, such as the Bot Application ID
     * @param {string} channelService The channel service
     * @param {AuthenticationConfiguration} authConfig Optional, the auth config
     * @returns {Promise<ClaimsIdentity>} Promise with ClaimsIdentity for the request.
     */
    export async function authenticateRequest(
        activity: Partial<Activity>,
        authHeader: string,
        credentials: ICredentialProvider,
        channelService: string,
        authConfig?: AuthenticationConfiguration
    ): Promise<ClaimsIdentity> {
        if (!authConfig) {
            authConfig = new AuthenticationConfiguration();
        }

        if (!authHeader.trim()) {
            const isAuthDisabled = await credentials.isAuthenticationDisabled();
            if (!isAuthDisabled) {
                throw new AuthenticationError(
                    'Unauthorized Access. Request is not authorized',
                    StatusCodes.UNAUTHORIZED
                );
            }

            // Check if the activity is for a skill call and is coming from the Emulator.
            if (
                activity.channelId === Channels.Emulator &&
                activity.recipient &&
                activity.recipient.role === RoleTypes.Skill
            ) {
                return SkillValidation.createAnonymousSkillClaim();
            }

            // In the scenario where Auth is disabled, we still want to have the
            // IsAuthenticated flag set in the ClaimsIdentity. To do this requires
            // adding in an empty claim.
            return new ClaimsIdentity([], AuthenticationConstants.AnonymousAuthType);
        }

        const claimsIdentity: ClaimsIdentity = await validateAuthHeader(
            authHeader,
            credentials,
            channelService,
            activity.channelId!,
            activity.serviceUrl,
            authConfig
        );

        return claimsIdentity;
    }

    /**
     * Validate an auth header.
     *
     * @param {string} authHeader the auth header
     * @param {ICredentialProvider} credentials the credentials
     * @param {string} channelService the channel service
     * @param {string} channelId the channel ID
     * @param {string} serviceUrl the service URL
     * @param {AuthenticationConfiguration} authConfig the auth config
     * @returns {Promise<ClaimsIdentity>} a promise that resolves to the validated claims, or rejects if validation fails
     */
    export async function validateAuthHeader(
        authHeader: string,
        credentials: ICredentialProvider,
        channelService: string,
        channelId: string,
        serviceUrl = '',
        authConfig: AuthenticationConfiguration = new AuthenticationConfiguration()
    ): Promise<ClaimsIdentity> {
        if (!authHeader.trim()) {
            throw new AuthenticationError("'authHeader' required.", StatusCodes.BAD_REQUEST);
        }

        const identity = await authenticateToken(
            authHeader,
            credentials,
            channelService,
            channelId,
            authConfig,
            serviceUrl
        );

        await validateClaims(authConfig, identity.claims);

        return identity;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc, no-inner-declarations
    async function authenticateToken(
        authHeader: string,
        credentials: ICredentialProvider,
        channelService: string,
        channelId: string,
        authConfig: AuthenticationConfiguration,
        serviceUrl: string
    ): Promise<ClaimsIdentity> {
        if (SkillValidation.isSkillToken(authHeader)) {
            return await SkillValidation.authenticateChannelToken(
                authHeader,
                credentials,
                channelService,
                channelId,
                authConfig
            );
        }

        const usingEmulator = EmulatorValidation.isTokenFromEmulator(authHeader);

        if (usingEmulator) {
            return await EmulatorValidation.authenticateEmulatorToken(
                authHeader,
                credentials,
                channelService,
                channelId
            );
        }

        if (isPublicAzure(channelService)) {
            if (serviceUrl.trim()) {
                return await ChannelValidation.authenticateChannelTokenWithServiceUrl(
                    authHeader,
                    credentials,
                    serviceUrl,
                    channelId
                );
            }

            return await ChannelValidation.authenticateChannelToken(authHeader, credentials, channelId);
        }

        if (isGovernment(channelService)) {
            if (serviceUrl.trim()) {
                return await GovernmentChannelValidation.authenticateChannelTokenWithServiceUrl(
                    authHeader,
                    credentials,
                    serviceUrl,
                    channelId
                );
            }

            return await GovernmentChannelValidation.authenticateChannelToken(authHeader, credentials, channelId);
        }

        // Otherwise use Enterprise Channel Validation
        if (serviceUrl.trim()) {
            return await EnterpriseChannelValidation.authenticateChannelTokenWithServiceUrl(
                authHeader,
                credentials,
                serviceUrl,
                channelId,
                channelService
            );
        }

        return await EnterpriseChannelValidation.authenticateChannelToken(
            authHeader,
            credentials,
            channelId,
            channelService
        );
    }

    /**
     * Validates the identity claims against the ClaimsValidator in AuthenticationConfiguration if present.
     *
     * @param authConfig The authentication configuration.
     * @param claims The list of claims to validate.
     */
    // eslint-disable-next-line no-inner-declarations
    async function validateClaims(authConfig: AuthenticationConfiguration, claims: Claim[] = []): Promise<void> {
        if (authConfig.validateClaims) {
            // Call the validation method if defined (it should throw an exception if the validation fails)
            await authConfig.validateClaims(claims);
        } else if (SkillValidation.isSkillClaim(claims)) {
            // Skill claims must be validated using AuthenticationConfiguration validateClaims
            throw new AuthenticationError(
                'Unauthorized Access. Request is not authorized. Skill Claims require validation.',
                StatusCodes.UNAUTHORIZED
            );
        }
    }

    /**
     * Gets the AppId from a claims list.
     *
     * @summary
     * In v1 tokens the AppId is in the "ver" AuthenticationConstants.AppIdClaim claim.
     * In v2 tokens the AppId is in the "azp" AuthenticationConstants.AuthorizedParty claim.
     * If the AuthenticationConstants.VersionClaim is not present, this method will attempt to
     * obtain the attribute from the AuthenticationConstants.AppIdClaim or if present.
     *
     * Throws a TypeError if claims is falsy.
     *
     * @param {Claim[]} claims An object containing claims types and their values.
     * @returns {string} the app ID
     */
    export function getAppIdFromClaims(claims: Claim[]): string {
        if (!claims) {
            throw new TypeError('JwtTokenValidation.getAppIdFromClaims(): missing claims.');
        }

        let appId: string;

        // Group claims by type for fast lookup
        const claimsByType: Record<string,any> = claims.reduce((acc, claim) => ({ ...acc, [claim.type]: claim }), {});

        // Depending on Version, the AppId is either in the
        // appid claim (Version 1) or the 'azp' claim (Version 2).
        const versionClaim = claimsByType[AuthenticationConstants.VersionClaim];
        const versionValue = versionClaim && versionClaim.value;
        if (!versionValue || versionValue === '1.0') {
            // No version or a version of '1.0' means we should look for
            // the claim in the 'appid' claim.
            const appIdClaim = claimsByType[AuthenticationConstants.AppIdClaim];
            if (appIdClaim && appIdClaim.value) {
                appId = appIdClaim.value;
            }
        } else if (versionValue === '2.0') {
            // Version '2.0' puts the AppId in the 'azp' claim.
            const azpClaim = claimsByType[AuthenticationConstants.AuthorizedParty];
            if (azpClaim && azpClaim.value) {
                appId = azpClaim.value;
            }
        }

        return appId!;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc, no-inner-declarations
    function isPublicAzure(channelService: string): boolean {
        return !channelService || channelService.length === 0;
    }

    /**
     * Determine whether or not a channel service is government
     *
     * @param {string} channelService the channel service
     * @returns {boolean} true if this is a government channel service
     */
    export function isGovernment(channelService: string): boolean {
        return channelService != undefined && channelService.toLowerCase() === GovernmentConstants.ChannelService;
    }

    /**
     * Internal helper to check if the token has the shape we expect "Bearer [big long string]".
     *
     * @param {string} authHeader A string containing the token header.
     * @returns {boolean} True if the token is valid, false if not.
     */
    export function isValidTokenFormat(authHeader: string): boolean {
        if (!authHeader) {
            // No token, not valid.
            return false;
        }

        const parts: string[] = authHeader.trim().split(' ');
        if (parts.length !== 2) {
            // Tokens MUST have exactly 2 parts. If we don't have 2 parts, it's not a valid token
            return false;
        }

        // We now have an array that should be:
        // [0] = "Bearer"
        // [1] = "[Big Long String]"
        const authScheme: string = parts[0];
        if (authScheme !== 'Bearer') {
            // The scheme MUST be "Bearer"
            return false;
        }

        return true;
    }
}
