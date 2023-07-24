// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ServiceClientCredentials } from '@azure/ms-rest-js';

// Export underlying type for convenience
export { ServiceClientCredentials };

/**
 * The ServiceClientCredentialsFactory abstract class that allows Bots to provide their own
 * ServiceClientCredentials for bot to bot channel or skill bot to parent bot calls.
 */
export abstract class ServiceClientCredentialsFactory {
    /**
     * Validates an app ID.
     *
     * @param appId The app ID to validate.
     * @returns {Promise<boolean>} The result is true if `appId` is valid for the controller; otherwise, false.
     */
    abstract isValidAppId(appId: string): Promise<boolean>;

    /**
     * Checks whether bot authentication is disabled.
     *
     * @returns {Promise<boolean>} If bot authentication is disabled, the result is true; otherwise, false.
     */
    abstract isAuthenticationDisabled(): Promise<boolean>;

    /**
     * A factory method for creating ServiceClientCredentials.
     *
     * @param appId The appId.
     * @param audience The audience.
     * @param loginEndpoint The login url.
     * @param validateAuthority The validate authority value to use.
     * @returns {Promise<ServiceClientCredentials>} A [ServiceClientCredentials](xref:botframework-connector.ServiceClientCredentials).
     */
    abstract createCredentials(
        appId: string,
        audience: string | undefined,
        loginEndpoint: string,
        validateAuthority: boolean
    ): Promise<ServiceClientCredentials>;
}
