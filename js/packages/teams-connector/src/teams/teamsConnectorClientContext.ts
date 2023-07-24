/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServiceClientCredentials, ServiceClient } from '@azure/ms-rest-js';
import { TeamsConnectorClientOptions } from './models';

/**
 * The Bot Connector REST API extension for Microsoft Teams allows your
 * bot to perform extended operations on the Microsoft Teams channel
 * configured in the [Bot Framework Developer Portal](https://dev.botframework.com).
 * The Connector service uses industry-standard REST and JSON over HTTPS.
 */
export class TeamsConnectorClientContext extends ServiceClient {
    credentials: ServiceClientCredentials;

    /**
     * Initializes a new instance of the TeamsConnectorClientContext class.
     *
     * @param credentials Subscription credentials which uniquely identify client subscription.
     * @param [options] The parameter options
     */
    constructor(credentials: ServiceClientCredentials, options?: TeamsConnectorClientOptions) {
        if (!options) {
            options = {};
        }

        super(credentials, options);

        this.baseUri = options.baseUri || this.baseUri || 'https://api.botframework.com';
        this.requestContentType = 'application/json; charset=utf-8';
        this.credentials = credentials;
    }
}
