/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IJwtTokenProviderFactory } from './jwtTokenProviderFactory';
import type { ServiceClientCredentials } from '@azure/ms-rest-js';
import { ManagedIdentityAppCredentials } from './managedIdentityAppCredentials';
import { ServiceClientCredentialsFactory } from './serviceClientCredentialsFactory';
import { ok } from 'assert';

/**
 * A Managed Identity implementation of the [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) abstract class.
 */
export class ManagedIdentityServiceClientCredentialsFactory extends ServiceClientCredentialsFactory {
    private readonly appId: string;
    private readonly tokenProviderFactory: IJwtTokenProviderFactory;

    /**
     * Initializes a new instance of the ManagedIdentityServiceClientCredentialsFactory class.
     *
     * @param appId Client ID for the managed identity assigned to the bot.
     * @param tokenProviderFactory The JWT token provider factory to use.
     */
    constructor(appId: string, tokenProviderFactory: IJwtTokenProviderFactory) {
        super();
        ok(appId?.trim(), 'ManagedIdentityServiceClientCredentialsFactory.constructor(): missing appId.');
        ok(
            tokenProviderFactory,
            'ManagedIdentityServiceClientCredentialsFactory.constructor(): missing tokenProviderFactory.'
        );

        this.appId = appId;
        this.tokenProviderFactory = tokenProviderFactory;
    }

    /**
     * @inheritdoc
     */
    async isValidAppId(appId: string): Promise<boolean> {
        return appId === this.appId;
    }

    /**
     * @inheritdoc
     */
    async isAuthenticationDisabled(): Promise<boolean> {
        // Auth is always enabled for MSI.
        return false;
    }

    /**
     * @inheritdoc
     */
    async createCredentials(appId: string, audience: string): Promise<ServiceClientCredentials> {
        ok(
            await this.isValidAppId(appId),
            'ManagedIdentityServiceClientCredentialsFactory.createCredentials(): Invalid Managed ID.'
        );

        return new ManagedIdentityAppCredentials(this.appId, audience, this.tokenProviderFactory);
    }
}
