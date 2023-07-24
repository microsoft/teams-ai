/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServiceClientCredentials } from '@azure/ms-rest-js';
import * as Models from './models';
import * as Mappers from './models/mappers';
import * as operations from './operations';
import { TeamsConnectorClientContext } from './teamsConnectorClientContext';

class TeamsConnectorClient extends TeamsConnectorClientContext {
    // Operation groups
    teams: operations.Teams;

    /**
     * Initializes a new instance of the TeamsConnectorClient class.
     *
     * @param credentials Subscription credentials which uniquely identify client subscription.
     * @param [options] The parameter options
     */
    constructor(credentials: ServiceClientCredentials, options?: Models.TeamsConnectorClientOptions) {
        super(credentials, options);
        this.teams = new operations.Teams(this);
    }
}

// Operation Specifications

export {
    TeamsConnectorClient,
    TeamsConnectorClientContext,
    Models as TeamsConnectorModels,
    Mappers as TeamsConnectorMappers,
};

export * from './operations';
