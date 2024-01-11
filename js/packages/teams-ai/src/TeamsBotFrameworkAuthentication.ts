/**
 * @module teams-ai
 */

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CallerIdConstants } from 'botframework-schema';
import {
    ConnectorClientOptions,
    AuthenticationConfiguration,
    ServiceClientCredentialsFactory,
    AuthenticationConstants,
    GovernmentConstants
} from 'botframework-connector';

import { ParameterizedBotFrameworkAuthentication } from 'botframework-connector/lib/auth/parameterizedBotFrameworkAuthentication';

import packageInfo from '../package.json';

const USER_AGENT = `${packageInfo.name}/${packageInfo.version}`;
const DEFAULTS = {
    authentication: {
        validateAuthority: true,
        toChannelFromBotLoginUrl: AuthenticationConstants.ToChannelFromBotLoginUrl,
        toChannelFromBotOAuthScope: AuthenticationConstants.ToChannelFromBotOAuthScope,
        toBotFromChannelTokenIssuer: AuthenticationConstants.ToBotFromChannelTokenIssuer,
        oAuthUrl: AuthenticationConstants.OAuthUrl,
        toBotFromChannelOpenIdMetadataUrl: AuthenticationConstants.ToBotFromChannelOpenIdMetadataUrl,
        toBotFromEmulatorOpenIdMetadataUrl: AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl,
        callerId: CallerIdConstants.PublicAzureChannel
    },
    government: {
        validateAuthority: true,
        toChannelFromBotLoginUrl: GovernmentConstants.ToChannelFromBotLoginUrl,
        toChannelFromBotOAuthScope: GovernmentConstants.ToChannelFromBotOAuthScope,
        toBotFromChannelTokenIssuer: GovernmentConstants.ToBotFromChannelTokenIssuer,
        oAuthUrl: GovernmentConstants.OAuthUrl,
        toBotFromChannelOpenIdMetadataUrl: GovernmentConstants.ToBotFromChannelOpenIdMetadataUrl,
        toBotFromEmulatorOpenIdMetadataUrl: GovernmentConstants.ToBotFromEmulatorOpenIdMetadataUrl,
        callerId: CallerIdConstants.USGovChannel
    }
};

/**
 * Used to authenticate Bot Framework Protocol network calls
 */
export class TeamsBotFrameworkAuthentication extends ParameterizedBotFrameworkAuthentication {
    public get connectedClientOptions(): ConnectorClientOptions {
        return this._connectedClientOptions;
    }
    private readonly _connectedClientOptions: ConnectorClientOptions;

    constructor(args: {
        channelService?: string;
        validateAuthority?: boolean;
        toChannelFromBotLoginUrl?: string;
        toChannelFromBotOAuthScope?: string;
        toBotFromChannelTokenIssuer?: string;
        oAuthUrl?: string;
        toBotFromChannelOpenIdMetadataUrl?: string;
        toBotFromEmulatorOpenIdMetadataUrl?: string;
        callerId?: string;
        credentialsFactory: ServiceClientCredentialsFactory;
        authConfiguration?: AuthenticationConfiguration;
        botFrameworkClientFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
        connectorClientOptions?: ConnectorClientOptions;
    }) {
        const defaultsKey = !args.channelService ? 'authentication' : 'government';

        if (args.channelService && args.channelService !== GovernmentConstants.ChannelService) {
            throw new Error('The provided ChannelService value is not supported.');
        }

        const connectedClientOptions = {
            ...(args.connectorClientOptions || {}),
            userAgent: USER_AGENT,
            userAgentHeaderName: undefined
        };

        super(
            args.validateAuthority !== undefined ? args.validateAuthority : DEFAULTS[defaultsKey].validateAuthority,
            args.toChannelFromBotLoginUrl || DEFAULTS[defaultsKey].toChannelFromBotLoginUrl,
            args.toChannelFromBotOAuthScope || DEFAULTS[defaultsKey].toChannelFromBotOAuthScope,
            args.toBotFromChannelTokenIssuer || DEFAULTS[defaultsKey].toBotFromChannelTokenIssuer,
            args.oAuthUrl || DEFAULTS[defaultsKey].oAuthUrl,
            args.toBotFromChannelOpenIdMetadataUrl || DEFAULTS[defaultsKey].toBotFromChannelOpenIdMetadataUrl,
            args.toBotFromEmulatorOpenIdMetadataUrl || DEFAULTS[defaultsKey].toBotFromEmulatorOpenIdMetadataUrl,
            args.callerId || DEFAULTS[defaultsKey].callerId,
            args.credentialsFactory,
            args.authConfiguration || { requiredEndorsements: [] },
            args.botFrameworkClientFetch,
            connectedClientOptions
        );

        this._connectedClientOptions = connectedClientOptions;
    }
}
