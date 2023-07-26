// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import { Activity } from '@microsoft/teams-connector/src/schema';

import {
    AuthenticateRequestResult,
    AuthenticationConfiguration,
    AuthenticationConstants,
    BotFrameworkAuthentication,
    BotFrameworkAuthenticationFactory,
    BotFrameworkClient,
    ClaimsIdentity,
    ConnectorClientOptions,
    ConnectorFactory,
    ServiceClientCredentialsFactory,
    UserTokenClient,
} from '@microsoft/teams-connector';

import {
    ConfigurationServiceClientCredentialFactory,
    ConfigurationServiceClientCredentialFactoryOptions,
} from './configurationServiceClientCredentialFactory';

const TypedOptions = z
    .object({
        /**
         * (Optional) The OAuth URL used to get a token from OAuthApiClient. The "OAuthUrl" member takes precedence over this value.
         */
        [AuthenticationConstants.OAuthUrlKey]: z.string(),

        /**
         * (Optional) The OpenID metadata document used for authenticating tokens coming from the channel. The "ToBotFromChannelOpenIdMetadataUrl" member takes precedence over this value.
         */
        [AuthenticationConstants.BotOpenIdMetadataKey]: z.string().nullable(),

        /**
         * A string used to indicate if which cloud the bot is operating in (e.g. Public Azure or US Government).
         *
         * @remarks
         * A `null` or `''` value indicates Public Azure, whereas [GovernmentConstants.ChannelService](xref:botframework-connector.GovernmentConstants.ChannelService) indicates the bot is operating in the US Government cloud.
         *
         * Other values result in a custom authentication configuration derived from the values passed in on the [ConfigurationBotFrameworkAuthenticationOptions](xef:botbuilder-core.ConfigurationBotFrameworkAuthenticationOptions) instance.
         */
        [AuthenticationConstants.ChannelService]: z.string(),

        /**
         * Flag indicating whether or not to validate the address.
         */
        ValidateAuthority: z.union([z.string(), z.boolean()]),

        /**
         * The Login URL used to specify the tenant from which the bot should obtain access tokens from.
         */
        ToChannelFromBotLoginUrl: z.string(),

        /**
         * The Oauth scope to request.
         *
         * @remarks
         * This value is used when fetching a token to indicate the ultimate recipient or `audience` of an activity sent using these credentials.
         */
        ToChannelFromBotOAuthScope: z.string(),

        /**
         * The Token issuer for signed requests to the channel.
         */
        ToBotFromChannelTokenIssuer: z.string(),

        /**
         * The OAuth URL used to get a token from OAuthApiClient.
         */
        OAuthUrl: z.string(),

        /**
         * The OpenID metadata document used for authenticating tokens coming from the channel.
         */
        ToBotFromChannelOpenIdMetadataUrl: z.string(),

        /**
         * The The OpenID metadata document used for authenticating tokens coming from the Emulator.
         */
        ToBotFromEmulatorOpenIdMetadataUrl: z.string(),

        /**
         * A value for the CallerId.
         */
        CallerId: z.string(),
    })
    .partial();

/**
 * Contains settings used to configure a [ConfigurationBotFrameworkAuthentication](xref:botbuilder-core.ConfigurationBotFrameworkAuthentication) instance.
 */
export type ConfigurationBotFrameworkAuthenticationOptions = z.infer<typeof TypedOptions>;

/**
 * Creates a [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance from an object with the authentication values or a [Configuration](xref:botbuilder-dialogs-adaptive-runtime-core.Configuration) instance.
 */
export class ConfigurationBotFrameworkAuthentication extends BotFrameworkAuthentication {
    private readonly inner: BotFrameworkAuthentication;

    /**
     * Initializes a new instance of the [ConfigurationBotFrameworkAuthentication](xref:botbuilder-core.ConfigurationBotFrameworkAuthentication) class.
     *
     * @param botFrameworkAuthConfig A [ConfigurationBotFrameworkAuthenticationOptions](xref:botbuilder-core.ConfigurationBotFrameworkAuthenticationOptions) object.
     * @param credentialsFactory A [ServiceClientCredentialsFactory](xref:botframework-connector.ServiceClientCredentialsFactory) instance.
     * @param authConfiguration A [Configuration](xref:botframework-connector.AuthenticationConfiguration) object.
     * @param botFrameworkClientFetch A custom Fetch implementation to be used in the [BotFrameworkClient](xref:botframework-connector.BotFrameworkClient).
     * @param connectorClientOptions A [ConnectorClientOptions](xref:botframework-connector.ConnectorClientOptions) object.
     */
    constructor(
        botFrameworkAuthConfig: ConfigurationBotFrameworkAuthenticationOptions = {},
        credentialsFactory?: ServiceClientCredentialsFactory,
        authConfiguration?: AuthenticationConfiguration,
        botFrameworkClientFetch?: (input: RequestInfo|URL, init?: RequestInit) => Promise<Response>,
        connectorClientOptions: ConnectorClientOptions = {}
    ) {
        super();

        try {
            const typedBotFrameworkAuthConfig = TypedOptions.nonstrict().parse(botFrameworkAuthConfig);

            const {
                CallerId,
                ChannelService,
                OAuthUrl = typedBotFrameworkAuthConfig[AuthenticationConstants.OAuthUrlKey],
                ToBotFromChannelOpenIdMetadataUrl = typedBotFrameworkAuthConfig[
                    AuthenticationConstants.BotOpenIdMetadataKey
                ],
                ToBotFromChannelTokenIssuer,
                ToBotFromEmulatorOpenIdMetadataUrl,
                ToChannelFromBotLoginUrl,
                ToChannelFromBotOAuthScope,
            } = typedBotFrameworkAuthConfig;

            let ValidateAuthority = true;
            try {
                ValidateAuthority = Boolean(JSON.parse(`${typedBotFrameworkAuthConfig.ValidateAuthority ?? true}`));
            } catch (_err) {
                // no-op
            }

            this.inner = BotFrameworkAuthenticationFactory.create(
                ChannelService!,
                ValidateAuthority,
                ToChannelFromBotLoginUrl!,
                ToChannelFromBotOAuthScope!,
                ToBotFromChannelTokenIssuer!,
                OAuthUrl!,
                ToBotFromChannelOpenIdMetadataUrl!,
                ToBotFromEmulatorOpenIdMetadataUrl!,
                CallerId!,
                credentialsFactory ??
                    new ConfigurationServiceClientCredentialFactory(
                        typedBotFrameworkAuthConfig as ConfigurationServiceClientCredentialFactoryOptions
                    ),
                authConfiguration ?? { requiredEndorsements: [] },
                botFrameworkClientFetch,
                connectorClientOptions
            );
        } catch (err: unknown) {
            // Throw a new error with the validation details prominently featured.
            if (z.instanceof(z.ZodError).check(err)) {
                throw new Error(JSON.stringify(err.errors, null, 2));
            }
            throw err;
        }
    }

    /**
     * Authenticate Bot Framework Protocol requests to Skills.
     *
     * @param authHeader The http auth header received in the skill request.
     * @returns  {Promise<ClaimsIdentity>} A [ClaimsIdentity](xref:botframework-connector.ClaimsIdentity).
     */
    authenticateChannelRequest(authHeader: string): Promise<ClaimsIdentity> {
        return this.inner.authenticateChannelRequest(authHeader);
    }

    /**
     * Validate Bot Framework Protocol requests.
     *
     * @param activity The inbound Activity.
     * @param authHeader The HTTP auth header.
     * @returns {Promise<AuthenticateRequestResult>} An [AuthenticateRequestResult](xref:botframework-connector.AuthenticateRequestResult).
     */
    authenticateRequest(activity: Activity, authHeader: string): Promise<AuthenticateRequestResult> {
        return this.inner.authenticateRequest(activity, authHeader);
    }

    /**
     * Validate Bot Framework Protocol requests.
     *
     * @param authHeader The HTTP auth header.
     * @param channelIdHeader The channel ID HTTP header.
     * @returns {Promise<AuthenticateRequestResult>} An [AuthenticateRequestResult](xref:botframework-connector.AuthenticateRequestResult).
     */
    authenticateStreamingRequest(authHeader: string, channelIdHeader: string): Promise<AuthenticateRequestResult> {
        return this.inner.authenticateStreamingRequest(authHeader, channelIdHeader);
    }

    /**
     * Creates a BotFrameworkClient for calling Skills.
     *
     * @returns A [BotFrameworkClient](xref:botframework-connector.BotFrameworkClient).
     */
    createBotFrameworkClient(): BotFrameworkClient {
        return this.inner.createBotFrameworkClient();
    }

    /**
     * Creates a ConnectorFactory that can be used to create ConnectorClients that can use credentials from this particular Cloud Environment.
     *
     * @param claimsIdentity The inbound Activity's ClaimsIdentity.
     * @returns A [ConnectorFactory](xref:botframework-connector.ConnectorFactory).
     */
    createConnectorFactory(claimsIdentity: ClaimsIdentity): ConnectorFactory {
        return this.inner.createConnectorFactory(claimsIdentity);
    }

    /**
     * Creates the appropriate UserTokenClient instance.
     *
     * @param claimsIdentity The inbound Activity's ClaimsIdentity.
     * @returns {Promise<UserTokenClient>} An [UserTokenClient](xref:botframework-connector.UserTokenClient).
     */
    createUserTokenClient(claimsIdentity: ClaimsIdentity): Promise<UserTokenClient> {
        return this.inner.createUserTokenClient(claimsIdentity);
    }
}
