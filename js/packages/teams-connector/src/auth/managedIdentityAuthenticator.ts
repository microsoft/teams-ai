/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AccessToken, DefaultAzureCredential } from '@azure/identity';
import type { IJwtTokenProviderFactory } from './jwtTokenProviderFactory';
import { ok } from 'assert';
import { retry } from '../retry';

/**
 * Abstraction to acquire tokens from a Managed Service Identity.
 */
export class ManagedIdentityAuthenticator {
    private readonly tokenProvider: DefaultAzureCredential;
    private readonly resource: string;

    /**
     * Initializes a new instance of the ManagedIdentityAuthenticator class.
     *
     * @param appId Client id for the managed identity to be used for acquiring tokens.
     * @param resource Resource for which to acquire the token.
     * @param tokenProviderFactory The JWT token provider factory to use.
     */
    constructor(appId: string, resource: string, tokenProviderFactory: IJwtTokenProviderFactory) {
        ok(appId?.trim(), 'ManagedIdentityAuthenticator.constructor(): missing appId.');
        ok(resource?.trim(), 'ManagedIdentityAuthenticator.constructor(): missing resource.');
        ok(tokenProviderFactory, 'ManagedIdentityAuthenticator.constructor(): missing tokenProviderFactory.');

        this.resource = resource;
        this.tokenProvider = tokenProviderFactory.createAzureServiceTokenProvider(appId);
    }

    /**
     * Acquires the security token.
     *
     * @returns {Promise<AccessToken>} A promise with the `AccessToken` provided by the [IJwtTokenProviderFactory](xref:botframework-connector.IJwtTokenProviderFactory) class.
     */
    async getToken(): Promise<AccessToken> {
        // Retry gradually, starting from 10 ms up to 5 times.
        return retry(() => this.tokenProvider.getToken(this.resource), 5, 10) as Promise<AccessToken>;
    }
}
