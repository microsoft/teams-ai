/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as adal from 'adal-node';
import { AppCredentials } from './appCredentials';

// Determines if an unknown value is of adal.ErrorResponse type
function isErrorResponse(value: unknown): value is adal.ErrorResponse {
    if (value) {
        const { error, errorDescription } = value as adal.ErrorResponse;
        return error != null && errorDescription != null;
    }

    return false;
}

/**
 * MicrosoftAppCredentials auth implementation
 */
export class MicrosoftAppCredentials extends AppCredentials {
    /**
     * An empty set of credentials.
     */
    static readonly Empty = new MicrosoftAppCredentials('', '');

    /**
     * Initializes a new instance of the [MicrosoftAppCredentials](xref:botframework-connector.MicrosoftAppCredentials) class.
     *
     * @param {string} appId The Microsoft app ID.
     * @param {string} appPassword The Microsoft app password.
     * @param {string} channelAuthTenant Optional. The oauth token tenant.
     * @param {string} oAuthScope Optional. The scope for the token.
     */
    constructor(appId: string, public appPassword: string, channelAuthTenant?: string, oAuthScope?: string) {
        super(appId, channelAuthTenant, oAuthScope);
    }

    protected async refreshToken(): Promise<adal.TokenResponse> {
        if (!this.refreshingToken) {
            this.refreshingToken = new Promise<adal.TokenResponse>((resolve, reject): void => {
                this.authenticationContext?.acquireTokenWithClientCredentials(
                    this.oAuthScope,
                    this.appId,
                    this.appPassword,
                    (err, tokenResponse) => {
                        if (err) {
                            reject(err);
                        } else if (isErrorResponse(tokenResponse)) {
                            reject(new Error(tokenResponse.error));
                        } else {
                            resolve(tokenResponse);
                        }
                    }
                );
            });
        }

        return this.refreshingToken;
    }
}
