// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { AuthenticationConfiguration } from './authenticationConfiguration';
import type { BotFrameworkAuthentication } from './botFrameworkAuthentication';
import type { ServiceClientCredentialsFactory } from './serviceClientCredentialsFactory';
import { AuthenticationConstants } from './authenticationConstants';
import { CallerIdConstants } from 'botframework-schema';
import { ConnectorClientOptions } from '../connectorApi/models';
import { GovernmentConstants } from './governmentConstants';
import { ParameterizedBotFrameworkAuthentication } from './parameterizedBotFrameworkAuthentication';
import * as stringExt from '../stringExt';

/**
 * A factory for [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) which encapsulates the environment specific Bot Framework Protocol auth code.
 */
export class BotFrameworkAuthenticationFactory {
    /**
     * Creates a new [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance for anonymous testing scenarios.
     *
     * @returns A new [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance.
     */
    static create(): BotFrameworkAuthentication;

    /**
     * Creates the appropriate [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance.
     *
     * @param channelService The Channel Service.
     * @param validateAuthority The validate authority value to use.
     * @param toChannelFromBotLoginUrl The to Channel from bot login url.
     * @param toChannelFromBotOAuthScope The to Channel from bot oauth scope.
     * @param toBotFromChannelTokenIssuer The to bot from Channel Token Issuer.
     * @param oAuthUrl The OAuth url.
     * @param toBotFromChannelOpenIdMetadataUrl The to bot from Channel Open Id Metadata url.
     * @param toBotFromEmulatorOpenIdMetadataUrl The to bot from Emulator Open Id Metadata url.
     * @param callerId The callerId set on on authenticated [Activities](xref:botframework-schema.Activity).
     * @param credentialFactory The [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) to use to create credentials.
     * @param authConfiguration The [AuthenticationConfiguration](xref:botframework-connector.AuthenticationConfiguration) to use.
     * @param botFrameworkClientFetch The fetch to use in BotFrameworkClient.
     * @param connectorClientOptions The [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions) to use when creating ConnectorClients.
     */
    static create(
        channelService: string,
        validateAuthority: boolean,
        toChannelFromBotLoginUrl: string,
        toChannelFromBotOAuthScope: string,
        toBotFromChannelTokenIssuer: string,
        oAuthUrl: string,
        toBotFromChannelOpenIdMetadataUrl: string,
        toBotFromEmulatorOpenIdMetadataUrl: string,
        callerId: string,
        credentialFactory: ServiceClientCredentialsFactory,
        authConfiguration: AuthenticationConfiguration,
        botFrameworkClientFetch?: (input: RequestInfo|URL, init?: RequestInit) => Promise<Response>,
        connectorClientOptions?: ConnectorClientOptions
    ): BotFrameworkAuthentication;

    /**
     * @param maybeChannelService The Channel Service.
     * @param maybeValidateAuthority The validate authority value to use.
     * @param maybeToChannelFromBotLoginUrl The to Channel from bot login url.
     * @param maybeToChannelFromBotOAuthScope The to Channel from bot oauth scope.
     * @param maybeToBotFromChannelTokenIssuer The to bot from Channel Token Issuer.
     * @param maybeOAuthUrl The oAuth url.
     * @param maybeToBotFromChannelOpenIdMetadataUrl The to bot from Channel Open Id Metadata url.
     * @param maybeToBotFromEmulatorOpenIdMetadataUrl The to bot from Emulator Open Id Metadata url.
     * @param maybeCallerId The callerId set on on authenticated [Activities](xref:botframework-schema.Activity).
     * @param maybeCredentialFactory The [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) to use to create credentials.
     * @param maybeAuthConfiguration The [AuthenticationConfiguration](xref:botframework-connector.AuthenticationConfiguration) to use.
     * @param maybeBotFrameworkClientFetch The fetch to use in BotFrameworkClient.
     * @param maybeConnectorClientOptions The [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions) to use when creating ConnectorClients.
     * @returns A new [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance.
     */
    static create(
        maybeChannelService?: string,
        maybeValidateAuthority?: boolean,
        maybeToChannelFromBotLoginUrl?: string,
        maybeToChannelFromBotOAuthScope?: string,
        maybeToBotFromChannelTokenIssuer?: string,
        maybeOAuthUrl?: string,
        maybeToBotFromChannelOpenIdMetadataUrl?: string,
        maybeToBotFromEmulatorOpenIdMetadataUrl?: string,
        maybeCallerId?: string,
        maybeCredentialFactory?: ServiceClientCredentialsFactory,
        maybeAuthConfiguration?: AuthenticationConfiguration,
        maybeBotFrameworkClientFetch?: (input: RequestInfo|URL, init?: RequestInit) => Promise<Response>,
        maybeConnectorClientOptions: ConnectorClientOptions = {}
    ): BotFrameworkAuthentication {
        if (
            !stringExt.isNilOrEmpty(maybeToChannelFromBotLoginUrl) ||
            !stringExt.isNilOrEmpty(maybeToChannelFromBotOAuthScope) ||
            !stringExt.isNilOrEmpty(maybeToBotFromChannelTokenIssuer) ||
            !stringExt.isNilOrEmpty(maybeOAuthUrl) ||
            !stringExt.isNilOrEmpty(maybeToBotFromChannelOpenIdMetadataUrl) ||
            !stringExt.isNilOrEmpty(maybeToBotFromEmulatorOpenIdMetadataUrl) ||
            !stringExt.isNilOrEmpty(maybeCallerId)
        ) {
            // If any of the 'parameterized' properties are defined, assume all parameters are intentional.
            return new ParameterizedBotFrameworkAuthentication(
                maybeValidateAuthority!,
                maybeToChannelFromBotLoginUrl!,
                maybeToChannelFromBotOAuthScope!,
                maybeToBotFromChannelTokenIssuer!,
                maybeOAuthUrl!,
                maybeToBotFromChannelOpenIdMetadataUrl!,
                maybeToBotFromEmulatorOpenIdMetadataUrl!,
                maybeCallerId!,
                maybeCredentialFactory!,
                maybeAuthConfiguration!,
                maybeBotFrameworkClientFetch,
                maybeConnectorClientOptions
            );
        } else {
            // else apply the built in default behavior, which is either the public cloud or the gov cloud depending on whether we have a channelService value present
            if (stringExt.isNilOrEmpty(maybeChannelService)) {
                return new ParameterizedBotFrameworkAuthentication(
                    true,
                    AuthenticationConstants.ToChannelFromBotLoginUrl,
                    AuthenticationConstants.ToChannelFromBotOAuthScope,
                    AuthenticationConstants.ToBotFromChannelTokenIssuer,
                    AuthenticationConstants.OAuthUrl,
                    AuthenticationConstants.ToBotFromChannelOpenIdMetadataUrl,
                    AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl,
                    CallerIdConstants.PublicAzureChannel,
                    maybeCredentialFactory!,
                    maybeAuthConfiguration!,
                    maybeBotFrameworkClientFetch,
                    maybeConnectorClientOptions
                );
            } else if (maybeChannelService === GovernmentConstants.ChannelService) {
                return new ParameterizedBotFrameworkAuthentication(
                    true,
                    GovernmentConstants.ToChannelFromBotLoginUrl,
                    GovernmentConstants.ToChannelFromBotOAuthScope,
                    GovernmentConstants.ToBotFromChannelTokenIssuer,
                    GovernmentConstants.OAuthUrl,
                    GovernmentConstants.ToBotFromChannelOpenIdMetadataUrl,
                    GovernmentConstants.ToBotFromEmulatorOpenIdMetadataUrl,
                    CallerIdConstants.USGovChannel,
                    maybeCredentialFactory!,
                    maybeAuthConfiguration!,
                    maybeBotFrameworkClientFetch,
                    maybeConnectorClientOptions
                );
            } else {
                // The ChannelService value is used an indicator of which built in set of constants to use. If it is not recognized, a full configuration is expected.
                throw new Error('The provided ChannelService value is not supported.');
            }
        }
    }
}
