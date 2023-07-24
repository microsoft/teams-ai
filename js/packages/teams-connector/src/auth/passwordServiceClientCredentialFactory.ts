/**
 * @module botframework-connector
 */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as adal from 'adal-node';
import type { ServiceClientCredentials } from '@azure/ms-rest-js';
import { AuthenticationConstants } from './authenticationConstants';
import { GovernmentConstants } from './governmentConstants';
import { MicrosoftAppCredentials } from './microsoftAppCredentials';
import { ServiceClientCredentialsFactory } from './serviceClientCredentialsFactory';
import * as stringExt from '../stringExt';

/**
 * A simple implementation of the [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) interface.
 */
export class PasswordServiceClientCredentialFactory implements ServiceClientCredentialsFactory {
    /**
     * The app ID for this credential.
     */
    appId: string | null;

    /**
     * The app password for this credential.
     */
    password: string | null;

    /**
     * The tenant ID of the Azure AD tenant where the bot is created.
     */
    tenantId: string | null;

    // Protects against JSON.stringify leaking secrets
    private toJSON(): unknown {
        return {
            name: this.constructor.name,
            appId: this.appId,
        };
    }

    /**
     * Initializes a new instance of the [PasswordServiceClientCredentialFactory](xref:botframework-connector.PasswordServiceClientCredentialFactory) class.
     *
     * @param appId The app ID.
     * @param password The app password.
     */
    constructor(appId: string, password: string);

    /**
     * Initializes a new instance of the [PasswordServiceClientCredentialFactory](xref:botframework-connector.PasswordServiceClientCredentialFactory) class.
     *
     * @param appId The app ID.
     * @param password The app password.
     * @param tenantId Tenant ID of the Azure AD tenant where the bot is created.
     */
    constructor(appId: string, password: string, tenantId: string);

    /**
     * @internal
     */
    constructor(appId: string, password: string, tenantId?: string) {
        this.appId = appId;
        this.password = password;
        this.tenantId = tenantId ?? null;
    }

    /**
     * Validates an app ID.
     *
     * @param appId The appId to validate.
     * @returns Promise with the validation result.
     */
    async isValidAppId(appId = ''): Promise<boolean> {
        return appId === this.appId;
    }

    /**
     * Checks whether bot authentication is disabled.
     *
     * @returns Promise with the validation result.
     */
    async isAuthenticationDisabled(): Promise<boolean> {
        return stringExt.isNilOrEmpty(this.appId);
    }

    /**
     * A factory method for creating ServiceClientCredentials.
     *
     * @param appId The appId.
     * @param audience The audience.
     * @param loginEndpoint The login url.
     * @param validateAuthority The validate authority value to use.
     * @returns A Promise representing the result of the operation.
     */
    async createCredentials(
        appId: string,
        audience: string,
        loginEndpoint: string,
        validateAuthority: boolean
    ): Promise<ServiceClientCredentials> {
        if (await this.isAuthenticationDisabled()) {
            return MicrosoftAppCredentials.Empty;
        }

        if (!(await this.isValidAppId(appId))) {
            throw new Error('Invalid appId.');
        }

        let credentials: MicrosoftAppCredentials;
        const normalizedEndpoint = loginEndpoint?.toLowerCase();

        if (normalizedEndpoint?.startsWith(AuthenticationConstants.ToChannelFromBotLoginUrlPrefix)) {
            credentials = new MicrosoftAppCredentials(appId, this.password!, this.tenantId!, audience);
        } else if (normalizedEndpoint === GovernmentConstants.ToChannelFromBotLoginUrl.toLowerCase()) {
            credentials = new MicrosoftAppCredentials(appId, this.password!, this.tenantId!, audience);
            credentials.oAuthEndpoint = loginEndpoint;
        } else {
            credentials = new PrivateCloudAppCredentials(
                appId,
                this.password!,
                this.tenantId!,
                audience,
                normalizedEndpoint,
                validateAuthority
            );
        }
        return credentials;
    }
}

class PrivateCloudAppCredentials extends MicrosoftAppCredentials {
    private readonly _validateAuthority: boolean;
    private __oAuthEndpoint?: string;

    constructor(
        appId: string,
        password: string,
        tenantId: string,
        oAuthScope: string,
        oAuthEndpoint: string,
        validateAuthority: boolean
    ) {
        super(appId, password, tenantId, oAuthScope);
        this.oAuthEndpoint = oAuthEndpoint;
        this._validateAuthority = validateAuthority;
    }

    /**
     * Gets a value indicating whether to validate the Authority.
     *
     * @returns The ValidateAuthority value to use.
     */
    get validateAuthority(): boolean {
        return this._validateAuthority;
    }

    /**
     * Gets the OAuth endpoint to use.
     *
     * @returns The OAuthEndpoint to use.
     */
    get oAuthEndpoint(): string {
        return this.__oAuthEndpoint!;
    }

    /**
     * Sets the OAuth endpoint to use.
     */
    set oAuthEndpoint(value: string) {
        // aadApiVersion is set to '1.5' to avoid the "spn:" concatenation on the audience claim
        // For more info, see https://github.com/AzureAD/azure-activedirectory-library-for-nodejs/issues/128
        this.__oAuthEndpoint = value;
        this.authenticationContext = new adal.AuthenticationContext(value, this.validateAuthority, undefined, '1.5');
    }
}
