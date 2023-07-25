/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClaimsIdentity, ConnectorClient } from '@microsoft/teams-connector';

/**
 * Abstraction to build connector clients.
 */
export interface ConnectorClientBuilder {
    /**
     * Creates the connector client asynchronous.
     *
     * @param serviceUrl The service URL.
     * @param claimsIdentity The claims claimsIdentity.
     * @param audience The target audience for the ConnectorClient.
     */
    createConnectorClientWithIdentity: (
        serviceUrl: string,
        claimsIdentity: ClaimsIdentity,
        audience: string
    ) => Promise<ConnectorClient>;
}
