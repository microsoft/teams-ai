/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msrest from '@azure/ms-rest-js';
import * as adal from 'adal-node';
import { AuthenticationConstants } from './authenticationConstants';

/**
 * General AppCredentials auth implementation and cache. Supports any ADAL client credential flow.
 * Subclasses can implement refreshToken to acquire the token.
 */
export abstract class AppCredentials implements msrest.ServiceClientCredentials {
    private static readonly cache: Map<string, adal.TokenResponse> = new Map<string, adal.TokenResponse>();

    appId: string;

    private _oAuthEndpoint?: string;
    private _oAuthScope?: string;
    private _tenant?: string;
    tokenCacheKey: string = '';
    protected refreshingToken: Promise<adal.TokenResponse> | null = null;
    protected authenticationContext: adal.AuthenticationContext | null = null;

    // Protects against JSON.stringify leaking secrets
    private toJSON(): unknown {
        return {
            name: this.constructor.name,
            appId: this.appId,
            tenant: this.tenant,
            oAuthEndpoint: this.oAuthEndpoint,
            oAuthScope: this.oAuthScope,
        };
    }

    /**
     * Initializes a new instance of the [AppCredentials](xref:botframework-connector.AppCredentials) class.
     *
     * @param appId The App ID.
     * @param channelAuthTenant Optional. The oauth token tenant.
     * @param oAuthScope The scope for the token.
     */
    constructor(
        appId: string,
        channelAuthTenant: string = AuthenticationConstants.DefaultChannelAuthTenant,
        oAuthScope: string = AuthenticationConstants.ToBotFromChannelTokenIssuer
    ) {
        this.appId = appId;
        this.tenant = channelAuthTenant;
        this.oAuthEndpoint = AuthenticationConstants.ToChannelFromBotLoginUrlPrefix + this.tenant;
        this.oAuthScope = oAuthScope;
    }

    /**
     * Gets tenant to be used for channel authentication.
     *
     * @returns The channel auth token tenant for this credential.
     */
    private get tenant(): string {
        return this._tenant!;
    }

    /**
     * Sets tenant to be used for channel authentication.
     */
    private set tenant(value: string) {
        this._tenant = value && value.length > 0 ? value : AuthenticationConstants.DefaultChannelAuthTenant;
    }

    /**
     * Gets the OAuth scope to use.
     *
     * @returns The OAuth scope to use.
     */
    get oAuthScope(): string {
        return this._oAuthScope!;
    }

    /**
     * Sets the OAuth scope to use.
     */
    set oAuthScope(value: string) {
        this._oAuthScope = value;
        this.tokenCacheKey = `${this.appId}${this.oAuthScope}-cache`;
    }

    /**
     * Gets the OAuth endpoint to use.
     *
     * @returns The OAuthEndpoint to use.
     */
    get oAuthEndpoint(): string {
        return this._oAuthEndpoint!;
    }

    /**
     * Sets the OAuth endpoint to use.
     */
    set oAuthEndpoint(value: string) {
        // aadApiVersion is set to '1.5' to avoid the "spn:" concatenation on the audience claim
        // For more info, see https://github.com/AzureAD/azure-activedirectory-library-for-nodejs/issues/128
        this._oAuthEndpoint = value;
        this.authenticationContext = new adal.AuthenticationContext(value, true, undefined, '1.5');
    }

    /**
     * Adds the host of service url to trusted hosts.
     * If expiration time is not provided, the expiration date will be current (utc) date + 1 day.
     *
     * @deprecated
     *
     * @param  {string} serviceUrl The service url
     * @param  {Date} expiration? The expiration date after which this service url is not trusted anymore
     */
    static trustServiceUrl(serviceUrl: string, expiration?: Date): void;
    /**
     * Adds the host of service url to trusted hosts.
     * If expiration time is not provided, the expiration date will be current (utc) date + 1 day.
     */
    static trustServiceUrl(): void {
        // no-op
    }

    /**
     * Checks if the service url is for a trusted host or not.
     *
     * @deprecated
     *
     * @param  {string} serviceUrl The service url
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    static isTrustedServiceUrl(serviceUrl: string): boolean;
    /**
     * Checks if the service url is for a trusted host or not.
     *
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    static isTrustedServiceUrl(): boolean {
        return true;
    }

    /**
     * Apply the credentials to the HTTP request.
     *
     * @param webResource The WebResource HTTP request.
     * @returns A Promise representing the asynchronous operation.
     */
    async signRequest(webResource: msrest.WebResource): Promise<msrest.WebResource> {
        if (this.shouldSetToken()) {
            return new msrest.TokenCredentials(await this.getToken()).signRequest(webResource);
        }

        return webResource;
    }

    /**
     * Gets an OAuth access token.
     *
     * @param forceRefresh True to force a refresh of the token; or false to get
     * a cached token if it exists.
     * @returns A Promise that represents the work queued to execute.
     * @remarks If the promise is successful, the result contains the access token string.
     */
    async getToken(forceRefresh = false): Promise<string> {
        if (!forceRefresh) {
            // check the global cache for the token. If we have it, and it's valid, we're done.
            const oAuthToken: adal.TokenResponse|undefined = AppCredentials.cache.get(this.tokenCacheKey);
            if (oAuthToken) {
                // we have the token. Is it valid?
                if (oAuthToken.expirationTime > Date.now()) {
                    return oAuthToken.accessToken;
                }
            }
        }

        // We need to refresh the token, because:
        // 1. The user requested it via the forceRefresh parameter
        // 2. We have it, but it's expired
        // 3. We don't have it in the cache.
        const res: adal.TokenResponse = await this.refreshToken();
        this.refreshingToken = null;

        if (res && res.accessToken) {
            // `res` is equalivent to the results from the cached promise `this.refreshingToken`.
            // Because the promise has been cached, we need to see if the body has been read.
            // If the body has not been read yet, we can call res.json() to get the access_token.
            // If the body has been read, the OAuthResponse for that call should have been cached already,
            // in which case we can return the cache from there. If a cached OAuthResponse does not exist,
            // call getToken() again to retry the authentication process.

            // Subtract 5 minutes from expires_in so they'll we'll get a
            // new token before it expires.
            res.expirationTime = Date.now() + res.expiresIn * 1000 - 300000;
            AppCredentials.cache.set(this.tokenCacheKey, res);
            return res.accessToken;
        } else {
            throw new Error('Authentication: No response or error received from ADAL.');
        }
    }

    protected abstract refreshToken(): Promise<adal.TokenResponse>;

    /**
     * @private
     */
    private shouldSetToken(): boolean {
        return this.appId != undefined && this.appId !== AuthenticationConstants.AnonymousSkillAppId;
    }
}
