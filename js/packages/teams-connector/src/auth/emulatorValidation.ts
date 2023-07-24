/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-namespace */

import { decode } from 'jsonwebtoken';
import { ClaimsIdentity } from './claimsIdentity';
import { AuthenticationConstants } from './authenticationConstants';
import { AuthenticationConfiguration } from './authenticationConfiguration';
import { GovernmentConstants } from './governmentConstants';
import { ICredentialProvider } from './credentialProvider';
import { JwtTokenExtractor } from './jwtTokenExtractor';
import { JwtTokenValidation } from './jwtTokenValidation';
import { AuthenticationError } from './authenticationError';
import { StatusCodes } from 'botframework-schema';
import { ToBotFromBotOrEmulatorTokenValidationParameters } from './tokenValidationParameters';

/**
 * @deprecated Use `ConfigurationBotFrameworkAuthentication` instead to perform emulator validation.
 * Validates and Examines JWT tokens from the Bot Framework Emulator
 */
export namespace EmulatorValidation {
    /**
     * TO BOT FROM EMULATOR: Token validation parameters when connecting to a channel.
     */
    export const ToBotFromEmulatorTokenValidationParameters = ToBotFromBotOrEmulatorTokenValidationParameters;

    /**
     * Determines if a given Auth header is from the Bot Framework Emulator
     *
     * @param  {string} authHeader Bearer Token, in the "Bearer [Long String]" Format.
     * @returns {boolean} True, if the token was issued by the Emulator. Otherwise, false.
     */
    export function isTokenFromEmulator(authHeader: string): boolean {
        // The Auth Header generally looks like this:
        // "Bearer eyJ0e[...Big Long String...]XAiO"
        if (!authHeader) {
            // No token. Can't be an emulator token.
            return false;
        }

        const parts: string[] = authHeader.split(' ');
        if (parts.length !== 2) {
            // Emulator tokens MUST have exactly 2 parts. If we don't have 2 parts, it's not an emulator token
            return false;
        }

        const authScheme: string = parts[0];
        const bearerToken: string = parts[1];

        // We now have an array that should be:
        // [0] = "Bearer"
        // [1] = "[Big Long String]"
        if (authScheme !== 'Bearer') {
            // The scheme from the emulator MUST be "Bearer"
            return false;
        }

        // Parse the Big Long String into an actual token.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token: any = decode(bearerToken, { complete: true });
        if (!token) {
            return false;
        }

        // Is there an Issuer?
        const issuer: string = token.payload.iss;
        if (!issuer) {
            // No Issuer, means it's not from the Emulator.
            return false;
        }

        // Is the token issues by a source we consider to be the emulator?
        if (
            ToBotFromEmulatorTokenValidationParameters.issuer &&
            ToBotFromEmulatorTokenValidationParameters.issuer.indexOf(issuer) === -1
        ) {
            // Not a Valid Issuer. This is NOT a Bot Framework Emulator Token.
            return false;
        }

        // The Token is from the Bot Framework Emulator. Success!
        return true;
    }

    /**
     * Validate the incoming Auth Header as a token sent from the Bot Framework Emulator.
     * A token issued by the Bot Framework will FAIL this check. Only Emulator tokens will pass.
     *
     * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
     * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
     * @param  {string} channelService The channelService value that distinguishes public Azure from US Government Azure.
     * @param  {string} channelId The ID of the channel to validate.
     * @param  {AuthenticationConfiguration} authConfig The authentication configuration.
     * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
     */
    export async function authenticateEmulatorToken(
        authHeader: string,
        credentials: ICredentialProvider,
        channelService: string,
        channelId: string,
        authConfig: AuthenticationConfiguration = new AuthenticationConfiguration()
    ): Promise<ClaimsIdentity> {
        const openIdMetadataUrl =
            channelService !== undefined && JwtTokenValidation.isGovernment(channelService)
                ? GovernmentConstants.ToBotFromEmulatorOpenIdMetadataUrl
                : AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl;

        const tokenExtractor: JwtTokenExtractor = new JwtTokenExtractor(
            ToBotFromEmulatorTokenValidationParameters,
            openIdMetadataUrl,
            AuthenticationConstants.AllowedSigningAlgorithms
        );

        const identity: ClaimsIdentity|null = await tokenExtractor.getIdentityFromAuthHeader(
            authHeader,
            channelId,
            authConfig.requiredEndorsements
        );
        if (!identity) {
            // No valid identity. Not Authorized.
            throw new AuthenticationError('Unauthorized. No valid identity.', StatusCodes.UNAUTHORIZED);
        }

        if (!identity.isAuthenticated) {
            // The token is in some way invalid. Not Authorized.
            throw new AuthenticationError('Unauthorized. Is not authenticated', StatusCodes.UNAUTHORIZED);
        }

        // Now check that the AppID in the claimset matches
        // what we're looking for. Note that in a multi-tenant bot, this value
        // comes from developer code that may be reaching out to a service, hence the
        // Async validation.
        const versionClaim: string|null = identity.getClaimValue(AuthenticationConstants.VersionClaim);
        if (versionClaim === null) {
            throw new AuthenticationError(
                'Unauthorized. "ver" claim is required on Emulator Tokens.',
                StatusCodes.UNAUTHORIZED
            );
        }

        let appId = '';

        // The Emulator, depending on Version, sends the AppId via either the
        // appid claim (Version 1) or the Authorized Party claim (Version 2).
        if (!versionClaim || versionClaim === '1.0') {
            // either no Version or a version of "1.0" means we should look for
            // the claim in the "appid" claim.
            const appIdClaim: string|null = identity.getClaimValue(AuthenticationConstants.AppIdClaim);
            if (!appIdClaim) {
                // No claim around AppID. Not Authorized.
                throw new AuthenticationError(
                    'Unauthorized. "appid" claim is required on Emulator Token version "1.0".',
                    StatusCodes.UNAUTHORIZED
                );
            }

            appId = appIdClaim;
        } else if (versionClaim === '2.0') {
            // Emulator, "2.0" puts the AppId in the "azp" claim.
            const appZClaim: string|null = identity.getClaimValue(AuthenticationConstants.AuthorizedParty);
            if (!appZClaim) {
                // No claim around AppID. Not Authorized.
                throw new AuthenticationError(
                    'Unauthorized. "azp" claim is required on Emulator Token version "2.0".',
                    StatusCodes.UNAUTHORIZED
                );
            }

            appId = appZClaim;
        } else {
            // Unknown Version. Not Authorized.
            throw new AuthenticationError(
                `Unauthorized. Unknown Emulator Token version "${versionClaim}".`,
                StatusCodes.UNAUTHORIZED
            );
        }

        if (!(await credentials.isValidAppId(appId))) {
            throw new AuthenticationError(
                `Unauthorized. Invalid AppId passed on token: ${appId}`,
                StatusCodes.UNAUTHORIZED
            );
        }

        return identity;
    }
}
