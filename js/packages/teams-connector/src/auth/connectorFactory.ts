// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ConnectorClient } from '../connectorApi/connectorClient';

/**
 * A factory class used to create ConnectorClients with appropriate credentials for the current appId.
 */
export abstract class ConnectorFactory {
    /**
     * A factory method used to create [ConnectorClient](xref:botframework-connector.ConnectorClient) instances.
     *
     * @param serviceUrl The url for the client.
     * @param audience The audience for the credentials the client will use.
     * @returns A [ConnectorClient](xref:botframework-connector.ConnectorClient) for sending activities to the audience at the serviceUrl.
     */
    abstract create(serviceUrl: string, audience?: string): Promise<ConnectorClient>;
}
