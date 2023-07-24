/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthenticationConstants {
    /**
     * TO CHANNEL FROM BOT: Login URL
     *
     * DEPRECATED: DO NOT USE
     */
    export const ToChannelFromBotLoginUrl = 'https://login.microsoftonline.com/botframework.com';

    /**
     * TO CHANNEL FROM BOT: Login URL prefix
     */
    export const ToChannelFromBotLoginUrlPrefix = 'https://login.microsoftonline.com/';

    /**
     * TO CHANNEL FROM BOT: Login URL token endpoint path
     */
    export const ToChannelFromBotTokenEndpointPath = '/oauth2/v2.0/token';

    /**
     * TO CHANNEL FROM BOT: Default tenant from which to obtain a token for bot to channel communication
     */
    export const DefaultChannelAuthTenant = 'botframework.com';

    /**
     * TO CHANNEL FROM BOT: OAuth scope to request
     */
    export const ToChannelFromBotOAuthScope = 'https://api.botframework.com';

    /**
     * TO BOT FROM CHANNEL: Token issuer
     */
    export const ToBotFromChannelTokenIssuer = 'https://api.botframework.com';

    /**
     * OAuth Url used to get a token from OAuthApiClient.
     */
    export const OAuthUrl = 'https://api.botframework.com';

    /**
     * Application Setting Key for the OpenIdMetadataUrl value.
     */
    export const BotOpenIdMetadataKey = 'BotOpenIdMetadata';

    /**
     * Application Setting Key for the ChannelService value.
     */
    export const ChannelService = 'ChannelService';

    /**
     * Application Setting Key for the OAuthUrl value.
     */
    export const OAuthUrlKey = 'OAuthApiEndpoint';

    /**
     * Application Settings Key for whether to emulate OAuthCards when using the emulator.
     */
    export const EmulateOAuthCardsKey = 'EmulateOAuthCards';

    /**
     * TO BOT FROM CHANNEL: OpenID metadata document for tokens coming from MSA
     */
    export const ToBotFromChannelOpenIdMetadataUrl =
        'https://login.botframework.com/v1/.well-known/openidconfiguration';

    /**
     * TO BOT FROM ENTERPRISE CHANNEL: OpenID metadata document for tokens coming from MSA
     */
    export const ToBotFromEnterpriseChannelOpenIdMetadataUrlFormat =
        'https://{channelService}.enterprisechannel.botframework.com/v1/.well-known/openidconfiguration';

    /**
     * TO BOT FROM EMULATOR: OpenID metadata document for tokens coming from MSA
     */
    export const ToBotFromEmulatorOpenIdMetadataUrl =
        'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration';

    /**
     * The V1 Azure AD token issuer URL template that will contain the tenant id where the token was issued from.
     */
    export const ValidTokenIssuerUrlTemplateV1 = 'https://sts.windows.net/';

    /**
     * The V2 Azure AD token issuer URL template that will contain the tenant id where the token was issued from.
     */
    export const ValidTokenIssuerUrlTemplateV2 = 'https://login.microsoftonline.com/';

    /**
     * The Government V1 Azure AD token issuer URL template that will contain the tenant id where the token was issued from.
     */
    export const ValidGovernmentTokenIssuerUrlTemplateV1 = 'https://login.microsoftonline.us/';

    /**
     * The Government V2 Azure AD token issuer URL template that will contain the tenant id where the token was issued from.
     */
    export const ValidGovernmentTokenIssuerUrlTemplateV2 = 'https://login.microsoftonline.us/';

    /**
     * Allowed token signing algorithms. Tokens come from channels to the bot. The code
     * that uses this also supports tokens coming from the emulator.
     */
    export const AllowedSigningAlgorithms: string[] = ['RS256', 'RS384', 'RS512'];

    /**
     * 'azp' Claim.
     * Authorized party - the party to which the ID Token was issued.
     * This claim follows the general format set forth in the OpenID Spec.
     *     http://openid.net/specs/openid-connect-core-1_0.html#IDToken
     */
    export const AuthorizedParty = 'azp';

    /**
     * Audience Claim. From RFC 7519.
     *     https://tools.ietf.org/html/rfc7519#section-4.1.3
     * The 'aud' (audience) claim identifies the recipients that the JWT is
     * intended for.  Each principal intended to process the JWT MUST
     * identify itself with a value in the audience claim.If the principal
     * processing the claim does not identify itself with a value in the
     * 'aud' claim when this claim is present, then the JWT MUST be
     * rejected.In the general case, the 'aud' value is an array of case-
     * sensitive strings, each containing a StringOrURI value.In the
     * special case when the JWT has one audience, the 'aud' value MAY be a
     * single case-sensitive string containing a StringOrURI value.The
     * interpretation of audience values is generally application specific.
     * Use of this claim is OPTIONAL.
     */
    export const AudienceClaim = 'aud';

    /**
     * Issuer Claim. From RFC 7519.
     *     https://tools.ietf.org/html/rfc7519#section-4.1.1
     * The 'iss' (issuer) claim identifies the principal that issued the
     * JWT.  The processing of this claim is generally application specific.
     * The 'iss' value is a case-sensitive string containing a StringOrURI
     * value.  Use of this claim is OPTIONAL.
     */
    export const IssuerClaim = 'iss';

    /**
     * From RFC 7515
     *     https://tools.ietf.org/html/rfc7515#section-4.1.4
     * The 'kid' (key ID) Header Parameter is a hint indicating which key
     * was used to secure the JWS. This parameter allows originators to
     * explicitly signal a change of key to recipients. The structure of
     * the 'kid' value is unspecified. Its value MUST be a case-sensitive
     * string. Use of this Header Parameter is OPTIONAL.
     * When used with a JWK, the 'kid' value is used to match a JWK 'kid'
     * parameter value.
     */
    export const KeyIdHeader = 'kid';

    /**
     * Token version claim name. As used in Microsoft AAD tokens.
     */
    export const VersionClaim = 'ver';

    /**
     * App ID claim name. As used in Microsoft AAD 1.0 tokens.
     */
    export const AppIdClaim = 'appid';

    /**
     * Service URL claim name. As used in Microsoft Bot Framework v3.1 auth.
     */
    export const ServiceUrlClaim = 'serviceurl';

    /**
     * AppId used for creating skill claims when there is no appId and password configured.
     */
    export const AnonymousSkillAppId = 'AnonymousSkill';

    /**
     * Indicates that bot identity is anonymous (no appId and password were provided).
     */
    export const AnonymousAuthType = 'anonymous';
}
