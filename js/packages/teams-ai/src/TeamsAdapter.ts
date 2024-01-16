import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions
} from 'botbuilder';

import {
    AuthenticationConfiguration,
    ConnectorClientOptions,
    ServiceClientCredentialsFactory
} from 'botframework-connector';

import packageInfo from '../package.json';

const USER_AGENT = `teamsai-js/${packageInfo.version}`;

/**
 * An adapter that implements the Bot Framework Protocol and can be hosted in different cloud environments both public and private.
 */
export class TeamsAdapter extends CloudAdapter {
    constructor(
        botFrameworkAuthConfig?: ConfigurationBotFrameworkAuthenticationOptions,
        credentialsFactory?: ServiceClientCredentialsFactory,
        authConfiguration?: AuthenticationConfiguration,
        connectorClientOptions?: ConnectorClientOptions
    ) {
        super(
            new ConfigurationBotFrameworkAuthentication(
                botFrameworkAuthConfig || {},
                credentialsFactory,
                authConfiguration,
                undefined,
                {
                    ...(connectorClientOptions || {}),
                    userAgent: USER_AGENT,
                    userAgentHeaderName: undefined
                }
            )
        );
    }
}
