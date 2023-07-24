// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getDefaultUserAgentValue, RequestPolicyFactory, userAgentPolicy } from '@azure/ms-rest-js';
import { ConnectorClient } from '../connectorApi/connectorClient';
import { ConnectorClientOptions } from '../connectorApi/models';
import { ConnectorFactory } from './connectorFactory';
import type { ServiceClientCredentialsFactory } from './serviceClientCredentialsFactory';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo: Record<'name' | 'version', string> = require('../../package.json');
export const USER_AGENT = `Microsoft-BotFramework/3.1 ${packageInfo.name}/${
    packageInfo.version
} ${getDefaultUserAgentValue()} `;

/**
 * @internal
 * Implementation of [ConnectorFactory](xref:botframework-connector.ConnectorFactory).
 */
export class ConnectorFactoryImpl extends ConnectorFactory {
    /**
     * @param appId The AppID.
     * @param toChannelFromBotOAuthScope The to Channel from bot oauth scope.
     * @param loginEndpoint The login url.
     * @param validateAuthority The validate authority value to use.
     * @param credentialFactory A ServiceClientCredentialsFactory to use.
     * @param connectorClientOptions The [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions) to use when creating ConnectorClients.
     */
    constructor(
        private readonly appId: string,
        private readonly toChannelFromBotOAuthScope: string,
        private readonly loginEndpoint: string,
        private readonly validateAuthority: boolean,
        private readonly credentialFactory: ServiceClientCredentialsFactory,
        private readonly connectorClientOptions: ConnectorClientOptions = {}
    ) {
        super();
    }

    /**
     * @param serviceUrl The client's service URL.
     * @param audience The audience to use for outbound communication. It will vary by cloud environment.
     * @returns The new instance of the ConnectorClient class.
     */
    async create(serviceUrl: string, audience?: string): Promise<ConnectorClient> {
        // Use the credentials factory to create credentails specific to this particular cloud environment.
        const credentials = await this.credentialFactory.createCredentials(
            this.appId,
            audience ?? this.toChannelFromBotOAuthScope,
            this.loginEndpoint,
            this.validateAuthority
        );

        // A new connector client for making calls against this serviceUrl using credentials derived from the current appId and the specified audience.
        const options = this.getClientOptions(serviceUrl);
        return new ConnectorClient(credentials, options);
    }

    private getClientOptions(serviceUrl: string): ConnectorClientOptions {
        const { requestPolicyFactories, ...clientOptions } = this.connectorClientOptions;

        const options: ConnectorClientOptions = Object.assign({}, { baseUri: serviceUrl }, clientOptions);

        const userAgent = typeof options.userAgent === 'function' ? options.userAgent(USER_AGENT) : options.userAgent;
        const setUserAgent = userAgentPolicy({
            value: `${USER_AGENT}${userAgent ?? ''}`,
        });

        const acceptHeader: RequestPolicyFactory = {
            create: (nextPolicy) => ({
                sendRequest: (httpRequest) => {
                    if (!httpRequest.headers.contains('accept')) {
                        httpRequest.headers.set('accept', '*/*');
                    }
                    return nextPolicy.sendRequest(httpRequest);
                },
            }),
        };

        // Resolve any user request policy factories, then include our user agent via a factory policy
        options.requestPolicyFactories = (defaultRequestPolicyFactories) => {
            let defaultFactories: any[] = [];

            if (requestPolicyFactories) {
                if (typeof requestPolicyFactories === 'function') {
                    const newDefaultFactories = requestPolicyFactories(defaultRequestPolicyFactories);
                    if (newDefaultFactories) {
                        defaultFactories = newDefaultFactories;
                    }
                } else if (requestPolicyFactories) {
                    defaultFactories = [...requestPolicyFactories];
                }

                // If the user has supplied custom factories, allow them to optionally set user agent
                // before we do.
                defaultFactories = [...defaultFactories, setUserAgent, acceptHeader];
            } else {
                // In the case that there are no user supplied factories, inject our user agent as
                // the first policy to ensure none of the default policies override it.
                defaultFactories = [acceptHeader, setUserAgent, ...defaultRequestPolicyFactories];
            }

            return defaultFactories;
        };

        return options;
    }
}
