/**
 * @module teams-ai
 */

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Note: this class should never modify the way `CloudAdapter` is
 * intended to work.
 */

import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    ConfigurationServiceClientCredentialFactory,
    ConfigurationServiceClientCredentialFactoryOptions,
    Request,
    Response,
    TurnContext
} from 'botbuilder';

import {
    AuthenticationConfiguration,
    ConnectorClientOptions,
    ServiceClientCredentialsFactory
} from 'botframework-connector';

import packageInfo from '../package.json';
import { INodeSocket, INodeBuffer } from 'botframework-streaming';

const USER_AGENT = `teamsai-js/${packageInfo.version}`;

/**
 * An adapter that implements the Bot Framework Protocol and can be hosted in different cloud environments both public and private.
 */
export class TeamsAdapter extends CloudAdapter {
    /**
     * The credentials factory used by the bot adapter to create a [ServiceClientCredentials](xref:botframework-connector.ServiceClientCredentials) object.
     */
    public readonly credentialsFactory: ServiceClientCredentialsFactory;

    public get userAgent(): string {
        return USER_AGENT;
    }

    constructor(
        readonly botFrameworkAuthConfig?: ConfigurationBotFrameworkAuthenticationOptions,
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

        this.credentialsFactory =
            credentialsFactory ??
            new ConfigurationServiceClientCredentialFactory(
                botFrameworkAuthConfig as ConfigurationServiceClientCredentialFactoryOptions
            );
    }

    async process(req: Request, res: Response, logic: (context: TurnContext) => Promise<void>): Promise<void>;
    async process(
        req: Request,
        socket: INodeSocket,
        head: INodeBuffer,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;
    async process(
        req: Request,
        resOrSocket: Response | INodeSocket,
        logicOrHead: ((context: TurnContext) => Promise<void>) | INodeBuffer,
        maybeLogic?: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        if ('header' in resOrSocket && typeof logicOrHead === 'function') {
            resOrSocket.header('User-Agent', USER_AGENT);
            return super.process(req, resOrSocket, logicOrHead);
        }

        if ('connecting' in resOrSocket && typeof logicOrHead !== 'function' && !!maybeLogic) {
            return super.process(req, resOrSocket, logicOrHead, maybeLogic);
        }
    }
}
