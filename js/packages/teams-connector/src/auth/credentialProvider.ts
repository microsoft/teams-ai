/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @deprecated Use `ConfigurationBotFrameworkAuthentication` instead to configure credentials.
 * CredentialProvider interface. This interface allows Bots to provide their own
 * implementation of what is, and what is not, a valid appId and password. This is
 * useful in the case of multi-tenant bots, where the bot may need to call
 * out to a service to determine if a particular appid/password pair
 * is valid.
 *
 * For Single Tenant bots (the vast majority) the simple static providers
 * are sufficient.
 */
export interface ICredentialProvider {
    /**
     * Validate AppId.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     *
     * @param {string} appId bot appid
     * @returns {Promise<boolean>} true if it is a valid AppId
     */
    isValidAppId(appId: string): Promise<boolean>;

    /**
     * Get the app password for a given bot appId, if it is not a valid appId, return Null
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     *
     * @param {string} appId bot appid
     * @returns {Promise<string|null>} password or null for invalid appid
     */
    getAppPassword(appId: string): Promise<string | null>;

    /**
     * Checks if bot authentication is disabled.
     * Return true if bot authentication is disabled.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     *
     * @returns {Promise<boolean>} true if bot authentication is disabled.
     */
    isAuthenticationDisabled(): Promise<boolean>;
}

/**
 * @deprecated Use `ConfigurationBotFrameworkAuthentication` instead to configure credentials.
 * A simple implementation of the [ICredentialProvider](xref:botframework-connector.ICredentialProvider) interface.
 */
export class SimpleCredentialProvider implements ICredentialProvider {
    private readonly appId: string;
    private readonly appPassword: string;

    // Protects against JSON.stringify leaking secrets
    private toJSON(): unknown {
        return { name: this.constructor.name, appId: this.appId };
    }

    /**
     * Initializes a new instance of the [SimpleCredentialProvider](xref:botframework-connector.SimpleCredentialProvider) class with the provided credentials.
     *
     * @param {string} appId The app ID.
     * @param {string} appPassword The app password.
     */
    constructor(appId: string, appPassword: string) {
        this.appId = appId;
        this.appPassword = appPassword;
    }

    /**
     * Validate AppId.
     *
     * This method is async to enable custom implementations
     * that may need to call out to service to validate the appId / password pair.
     *
     * @param {string} appId bot appid
     * @returns {Promise<boolean>} true if it is a valid AppId
     */
    isValidAppId(appId: string): Promise<boolean> {
        return Promise.resolve(this.appId === appId);
    }

    /**
     * Get the app password for a given bot appId, if it is not a valid appId, return Null
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     *
     * @param {string} appId bot appid
     * @returns {Promise<string|null>} password or null for invalid appid
     */
    getAppPassword(appId: string): Promise<string | null> {
        return Promise.resolve(this.appId === appId ? this.appPassword : null);
    }

    /**
     * Checks if bot authentication is disabled.
     * Return true if bot authentication is disabled.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     *
     * @returns {Promise<boolean>} true if bot authentication is disabled.
     */
    isAuthenticationDisabled(): Promise<boolean> {
        return Promise.resolve(!this.appId);
    }
}
