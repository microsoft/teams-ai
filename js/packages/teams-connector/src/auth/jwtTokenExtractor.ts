/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { decode, verify, VerifyOptions } from 'jsonwebtoken';
import { Claim, ClaimsIdentity } from './claimsIdentity';
import { EndorsementsValidator } from './endorsementsValidator';
import { OpenIdMetadata } from './openIdMetadata';
import { AuthenticationError } from './authenticationError';
import { StatusCodes } from 'botframework-schema';

/**
 * A JWT token processing class that gets identity information and performs security token validation.
 */
export class JwtTokenExtractor {
    // Cache for OpenIdConnect configuration managers (one per metadata URL)
    private static openIdMetadataCache: Map<string, OpenIdMetadata> = new Map<string, OpenIdMetadata>();

    // Token validation parameters for this instance
    readonly tokenValidationParameters: VerifyOptions;

    // OpenIdMetadata for this instance
    readonly openIdMetadata: OpenIdMetadata;

    /**
     * Initializes a new instance of the [JwtTokenExtractor](xref:botframework-connector.JwtTokenExtractor) class. Extracts relevant data from JWT Tokens.
     *
     * @param tokenValidationParameters Token validation parameters.
     * @param metadataUrl Metadata Url.
     * @param allowedSigningAlgorithms Allowed signing algorithms.
     */
    constructor(tokenValidationParameters: VerifyOptions, metadataUrl: string, allowedSigningAlgorithms: string[]) {
        this.tokenValidationParameters = { ...tokenValidationParameters };
        this.tokenValidationParameters.algorithms = allowedSigningAlgorithms;
        this.openIdMetadata = JwtTokenExtractor.getOrAddOpenIdMetadata(metadataUrl);
    }

    private static getOrAddOpenIdMetadata(metadataUrl: string): OpenIdMetadata {
        let metadata = this.openIdMetadataCache.get(metadataUrl);
        if (!metadata) {
            metadata = new OpenIdMetadata(metadataUrl);
            this.openIdMetadataCache.set(metadataUrl, metadata);
        }

        return metadata;
    }

    /**
     * Gets the claims identity associated with a request.
     *
     * @param authorizationHeader The raw HTTP header in the format: "Bearer [longString]".
     * @param channelId The Id of the channel being validated in the original request.
     * @param requiredEndorsements The required JWT endorsements.
     * @returns A `Promise` representation for either a [ClaimsIdentity](botframework-connector:module.ClaimsIdentity) or `null`.
     */
    async getIdentityFromAuthHeader(
        authorizationHeader: string,
        channelId: string,
        requiredEndorsements?: string[]
    ): Promise<ClaimsIdentity | null> {
        if (!authorizationHeader) {
            return null;
        }

        const parts: string[] = authorizationHeader.split(' ');
        if (parts.length === 2) {
            return await this.getIdentity(parts[0], parts[1], channelId, requiredEndorsements || []);
        }

        return null;
    }

    /**
     * Gets the claims identity associated with a request.
     *
     * @param scheme The associated scheme.
     * @param parameter The token.
     * @param channelId The Id of the channel being validated in the original request.
     * @param requiredEndorsements The required JWT endorsements.
     * @returns A `Promise` representation for either a [ClaimsIdentity](botframework-connector:module.ClaimsIdentity) or `null`.
     */
    async getIdentity(
        scheme: string,
        parameter: string,
        channelId: string,
        requiredEndorsements: string[] = []
    ): Promise<ClaimsIdentity | null> {
        // No header in correct scheme or no token
        if (scheme !== 'Bearer' || !parameter) {
            return null;
        }

        // Issuer isn't allowed? No need to check signature
        if (!this.hasAllowedIssuer(parameter)) {
            return null;
        }

        return await this.validateToken(parameter, channelId, requiredEndorsements);
    }

    /**
     * @private
     */
    private hasAllowedIssuer(jwtToken: string): boolean {
        const payload = decode(jwtToken);

        let issuer: string;
        if (payload && typeof payload === 'object') {
            issuer = payload.iss;
        } else {
            return false;
        }

        if (Array.isArray(this.tokenValidationParameters.issuer)) {
            return this.tokenValidationParameters.issuer.indexOf(issuer) !== -1;
        }

        if (typeof this.tokenValidationParameters.issuer === 'string') {
            return this.tokenValidationParameters.issuer === issuer;
        }

        return false;
    }

    /**
     * @private
     */
    private async validateToken(
        jwtToken: string,
        channelId: string,
        requiredEndorsements: string[]
    ): Promise<ClaimsIdentity> {
        let header: Partial<Record<'kid' | 'alg', string>> = {};
        const decodedToken = decode(jwtToken, { complete: true });
        if (decodedToken && typeof decodedToken === 'object') {
            header = decodedToken.header;
        }

        // Update the signing tokens from the last refresh
        const keyId = header.kid;
        const metadata = await this.openIdMetadata.getKey(keyId!);
        if (!metadata) {
            throw new AuthenticationError('Signing Key could not be retrieved.', StatusCodes.UNAUTHORIZED);
        }

        try {
            let decodedPayload: Record<string, string> = {};
            const verifyResults = verify(jwtToken, metadata.key, this.tokenValidationParameters);
            if (verifyResults && typeof verifyResults === 'object') {
                // Note: casting is necessary here, but we know `object` is loosely equivalent to a Record
                decodedPayload = verifyResults as Record<string, string>;
            }

            // enforce endorsements in openIdMetadadata if there is any endorsements associated with the key
            const endorsements = metadata.endorsements;
            if (Array.isArray(endorsements) && endorsements.length !== 0) {
                const isEndorsed = EndorsementsValidator.validate(channelId, endorsements);
                if (!isEndorsed) {
                    throw new AuthenticationError(
                        `Could not validate endorsement for key: ${keyId} with endorsements: ${endorsements.join(',')}`,
                        StatusCodes.UNAUTHORIZED
                    );
                }

                // Verify that additional endorsements are satisfied. If no additional endorsements are expected, the requirement is satisfied as well
                const additionalEndorsementsSatisfied = requiredEndorsements.every((endorsement) =>
                    EndorsementsValidator.validate(endorsement, endorsements)
                );

                if (!additionalEndorsementsSatisfied) {
                    throw new AuthenticationError(
                        `Could not validate additional endorsement for key: ${keyId} with endorsements: ${requiredEndorsements.join(
                            ','
                        )}. Expected endorsements: ${requiredEndorsements.join(',')}`,
                        StatusCodes.UNAUTHORIZED
                    );
                }
            }

            if (this.tokenValidationParameters.algorithms) {
                if (this.tokenValidationParameters.algorithms.indexOf(header.alg!) === -1) {
                    throw new AuthenticationError(
                        `"Token signing algorithm '${header.alg}' not in allowed list`,
                        StatusCodes.UNAUTHORIZED
                    );
                }
            }

            const claims = Object.entries(decodedPayload).map<Claim>(([type, value]) => ({ type, value }));

            // Note: true is used here to indicate that these claims are to be considered authenticated. They are sourced
            // from a validated JWT (see `verify` above), so no harm in doing so.
            return new ClaimsIdentity(claims, true);
        } catch (err) {
            console.error(`Error finding key for token. Available keys: ${metadata.key}`);
            throw err;
        }
    }
}
