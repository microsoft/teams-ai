/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-namespace */

import { AuthenticationConfiguration } from './authenticationConfiguration';
import { AuthenticationConstants } from './authenticationConstants';
import { AuthenticationError } from './authenticationError';
import { Claim, ClaimsIdentity } from './claimsIdentity';
import { GovernmentConstants } from './governmentConstants';
import { ICredentialProvider } from './credentialProvider';
import { JwtTokenExtractor } from './jwtTokenExtractor';
import { JwtTokenValidation } from './jwtTokenValidation';
import { StatusCodes } from 'botframework-schema';
import { ToBotFromBotOrEmulatorTokenValidationParameters } from './tokenValidationParameters';
import { decode, VerifyOptions } from 'jsonwebtoken';

/**
 * @deprecated Use `ConfigurationBotFrameworkAuthentication` instead to perform skill validation.
 * Validates JWT tokens sent to and from a Skill.
 */
export namespace SkillValidation {
    /**
     * Determines if a given Auth header is from a skill to bot or bot to skill request.
     *
     * @param  {string} authHeader Bearer Token, in the "Bearer [Long String]" Format.
     * @returns {boolean} True, if the token was issued for a skill to bot communication. Otherwise, false.
     */
    export function isSkillToken(authHeader: string): boolean {
        if (!JwtTokenValidation.isValidTokenFormat(authHeader)) {
            return false;
        }

        // We know is a valid token, split it and work with it:
        // [0] = "Bearer"
        // [1] = "[Big Long String]"
        const [, ...bearerTokens] = authHeader.trim().split(' ');

        // Parse the Big Long String into an actual token.
        const payload = decode(bearerTokens.join(' '));

        let claims: Claim[] = [];
        if (payload && typeof payload === 'object') {
            claims = Object.entries(payload).map(([type, value]) => ({
                type,
                value,
            }));
        }

        return isSkillClaim(claims);
    }

    /**
     * Checks if the given object of claims represents a skill.
     *
     * @remarks
     * A skill claim should contain:
     *     An "AuthenticationConstants.VersionClaim" claim.
     *     An "AuthenticationConstants.AudienceClaim" claim.
     *     An "AuthenticationConstants.AppIdClaim" claim (v1) or an a "AuthenticationConstants.AuthorizedParty" claim (v2).
     * And the appId claim should be different than the audience claim.
     * The audience claim should be a guid, indicating that it is from another bot/skill.
     * @param claims An object of claims.
     * @returns {boolean} True if the object of claims is a skill claim, false if is not.
     */
    export function isSkillClaim(claims: Claim[]): boolean {
        if (!claims) {
            throw new TypeError('SkillValidation.isSkillClaim(): missing claims.');
        }

        // Group claims by type for fast lookup
        const claimsByType: Record<string,any> = claims.reduce((acc, claim) => ({ ...acc, [claim.type]: claim }), {});

        // Short circuit if this is a anonymous skill app ID (generated via createAnonymousSkillClaim)
        const appIdClaim = claimsByType[AuthenticationConstants.AppIdClaim];
        if (appIdClaim && appIdClaim.value === AuthenticationConstants.AnonymousSkillAppId) {
            return true;
        }

        const versionClaim = claimsByType[AuthenticationConstants.VersionClaim];
        const versionValue = versionClaim && versionClaim.value;
        if (!versionValue) {
            // Must have a version claim.
            return false;
        }

        const audClaim = claimsByType[AuthenticationConstants.AudienceClaim];
        const audienceValue = audClaim && audClaim.value;
        if (
            !audClaim ||
            AuthenticationConstants.ToBotFromChannelTokenIssuer === audienceValue ||
            GovernmentConstants.ToBotFromChannelTokenIssuer === audienceValue
        ) {
            // The audience is https://api.botframework.com and not an appId.
            return false;
        }

        const appId = JwtTokenValidation.getAppIdFromClaims(claims);
        if (!appId) {
            return false;
        }

        // Skill claims must contain and app ID and the AppID must be different than the audience.
        return appId !== audienceValue;
    }

    /**
     * Validates that the incoming Auth Header is a token sent from a bot to a skill or from a skill to a bot.
     *
     * @param authHeader The raw HTTP header in the format: "Bearer [longString]".
     * @param credentials The user defined set of valid credentials, such as the AppId.
     * @param channelService The channelService value that distinguishes public Azure from US Government Azure.
     * @param channelId The ID of the channel to validate.
     * @param authConfig The authentication configuration.
     * @returns {Promise<ClaimsIdentity>} A "ClaimsIdentity" instance if the validation is successful.
     */
    export async function authenticateChannelToken(
        authHeader: string,
        credentials: ICredentialProvider,
        channelService: string,
        channelId: string,
        authConfig: AuthenticationConfiguration
    ): Promise<ClaimsIdentity> {
        if (!authConfig) {
            throw new AuthenticationError(
                'SkillValidation.authenticateChannelToken(): invalid authConfig parameter',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }

        const openIdMetadataUrl = JwtTokenValidation.isGovernment(channelService)
            ? GovernmentConstants.ToBotFromEmulatorOpenIdMetadataUrl
            : AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl;

        // Add allowed token issuers from configuration.
        const verifyOptions: VerifyOptions = {
            ...ToBotFromBotOrEmulatorTokenValidationParameters,
            issuer: [
                ...ToBotFromBotOrEmulatorTokenValidationParameters.issuer!,
                ...(authConfig.validTokenIssuers ?? []),
            ],
        };

        const tokenExtractor = new JwtTokenExtractor(
            verifyOptions,
            openIdMetadataUrl,
            AuthenticationConstants.AllowedSigningAlgorithms
        );

        const parts: string[] = authHeader.split(' ');
        const identity = await tokenExtractor.getIdentity(
            parts[0],
            parts[1],
            channelId,
            authConfig.requiredEndorsements
        );

        await validateIdentity(identity!, credentials);

        return identity!;
    }

    /**
     * @ignore
     * @private
     * @param identity
     * @param credentials
     */
    export async function validateIdentity(identity: ClaimsIdentity, credentials: ICredentialProvider): Promise<void> {
        if (!identity) {
            // No valid identity. Not Authorized.
            throw new AuthenticationError(
                'SkillValidation.validateIdentity(): Invalid identity',
                StatusCodes.UNAUTHORIZED
            );
        }

        if (!identity.isAuthenticated) {
            // The token is in some way invalid. Not Authorized.
            throw new AuthenticationError(
                'SkillValidation.validateIdentity(): Token not authenticated',
                StatusCodes.UNAUTHORIZED
            );
        }

        const versionClaim = identity.getClaimValue(AuthenticationConstants.VersionClaim);
        // const versionClaim = identity.claims.FirstOrDefault(c => c.Type == AuthenticationConstants.VersionClaim);
        if (!versionClaim) {
            // No version claim
            throw new AuthenticationError(
                `SkillValidation.validateIdentity(): '${AuthenticationConstants.VersionClaim}' claim is required on skill Tokens.`,
                StatusCodes.UNAUTHORIZED
            );
        }

        // Look for the "aud" claim, but only if issued from the Bot Framework
        const audienceClaim = identity.getClaimValue(AuthenticationConstants.AudienceClaim);
        if (!audienceClaim) {
            // Claim is not present or doesn't have a value. Not Authorized.
            throw new AuthenticationError(
                `SkillValidation.validateIdentity(): '${AuthenticationConstants.AudienceClaim}' claim is required on skill Tokens.`,
                StatusCodes.UNAUTHORIZED
            );
        }

        if (!(await credentials.isValidAppId(audienceClaim))) {
            // The AppId is not valid. Not Authorized.
            throw new AuthenticationError(
                'SkillValidation.validateIdentity(): Invalid audience.',
                StatusCodes.UNAUTHORIZED
            );
        }

        const appId = JwtTokenValidation.getAppIdFromClaims(identity.claims);
        if (!appId) {
            // Invalid appId
            throw new AuthenticationError(
                'SkillValidation.validateIdentity(): Invalid appId.',
                StatusCodes.UNAUTHORIZED
            );
        }

        // TODO: check the appId against the registered skill client IDs.
        // Check the AppId and ensure that only works against my whitelist authConfig can have info on how to get the
        // whitelist AuthenticationConfiguration
        // We may need to add a ClaimsIdentityValidator delegate or class that allows the dev to inject a custom validator.
    }

    /**
     * Creates a set of claims that represent an anonymous skill. Useful for testing bots locally in the emulator
     *
     * @returns A [ClaimsIdentity](xref.botframework-connector.ClaimsIdentity) instance with authentication type set to [AuthenticationConstants.AnonymousAuthType](xref.botframework-connector.AuthenticationConstants) and a reserved [AuthenticationConstants.AnonymousSkillAppId](xref.botframework-connector.AuthenticationConstants) claim.
     */
    export function createAnonymousSkillClaim(): ClaimsIdentity {
        return new ClaimsIdentity(
            [
                {
                    type: AuthenticationConstants.AppIdClaim,
                    value: AuthenticationConstants.AnonymousSkillAppId,
                },
            ],
            AuthenticationConstants.AnonymousAuthType
        );
    }
}
