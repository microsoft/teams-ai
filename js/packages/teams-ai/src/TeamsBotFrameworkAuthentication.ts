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
    /**
     * The [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions)
     * to use when creating ConnectorClients.
     */
    public get connectedClientOptions(): ConnectorClientOptions {
        return this._connectedClientOptions;
    }
    private readonly _connectedClientOptions: ConnectorClientOptions;

    /**
     * @param args BotFramework Authentication Arguments
     * @param args.channelService Optional. The channel service
     * @param args.validateAuthority Optional. The validate authority value to use.
     * @param args.toChannelFromBotLoginUrl Optional. The to Channel from bot login url.
     * @param args.toChannelFromBotOAuthScope Optional. The to Channel from bot oauth scope.
     * @param args.toBotFromChannelTokenIssuer Optional. The to bot from Channel Token Issuer.
     * @param args.oAuthUrl Optional. The OAuth url.
     * @param args.toBotFromChannelOpenIdMetadataUrl Optional. The to bot from Channel Open Id Metadata url.
     * @param args.toBotFromEmulatorOpenIdMetadataUrl Optional. The to bot from Emulator Open Id Metadata url.
     * @param args.callerId Optional. The callerId set on an authenticated [Activities](xref:botframework-schema.Activity).
     * @param args.credentialsFactory The [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) to use to create credentials.
     * @param args.authConfiguration Optional. The [AuthenticationConfiguration](xref:botframework-connector.AuthenticationConfiguration) to use.
     * @param args.botFrameworkClientFetch Optional. The fetch to use in BotFrameworkClient.
     * @param args.connectorClientOptions Optional. The [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions) to use when creating ConnectorClients.
     */
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
