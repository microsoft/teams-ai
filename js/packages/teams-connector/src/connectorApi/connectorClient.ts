/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Mappers from './models/mappers';
import * as Models from './models';
import * as msRest from '@azure/ms-rest-js';
import * as operations from './operations';
import { ConnectorClientContext } from './connectorClientContext';

class ConnectorClient extends ConnectorClientContext {

    // Operation groups
    attachments: operations.Attachments;
    conversations: operations.Conversations;

    /**
     * Initializes a new instance of the ConnectorClient class.
     * @param credentials Subscription credentials which uniquely identify client subscription.
     * @param [options] The parameter options
     */
    constructor(credentials: msRest.ServiceClientCredentials, options?: Models.ConnectorClientOptions) {
        super(credentials, options);
        this.attachments = new operations.Attachments(this);
        this.conversations = new operations.Conversations(this);
    }
}

// Operation Specifications

export * from './operations';
export { ConnectorClient, ConnectorClientContext, Models as ConnectorModels, Mappers as ConnectorMappers };
