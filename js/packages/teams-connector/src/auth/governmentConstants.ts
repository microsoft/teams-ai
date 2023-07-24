/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GovernmentConstants {
    /**
     * Government Channel Service property value
     */
    export const ChannelService = 'https://botframework.azure.us';

    /**
     * TO CHANNEL FROM BOT: Login URL
     */
    export const ToChannelFromBotLoginUrl = 'https://login.microsoftonline.us/MicrosoftServices.onmicrosoft.us';

    /**
     * TO CHANNEL FROM BOT: OAuth scope to request
     */
    export const ToChannelFromBotOAuthScope = 'https://api.botframework.us';

    /**
     * TO BOT FROM CHANNEL: Token issuer
     */
    export const ToBotFromChannelTokenIssuer = 'https://api.botframework.us';

    /**
     * OAuth Url used to get a token from OAuthApiClient.
     */
    export const OAuthUrl = 'https://api.botframework.azure.us';

    /**
     * TO BOT FROM GOVERNMENT CHANNEL: OpenID metadata document for tokens coming from MSA
     */
    export const ToBotFromChannelOpenIdMetadataUrl =
        'https://login.botframework.azure.us/v1/.well-known/openidconfiguration';

    /**
     * TO BOT FROM GOVERNMENT EMULATOR: OpenID metadata document for tokens coming from MSA
     */
    export const ToBotFromEmulatorOpenIdMetadataUrl =
        'https://login.microsoftonline.us/cab8a31a-1906-4287-a0d8-4eef66b95f6e/v2.0/.well-known/openid-configuration';
}
