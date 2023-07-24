// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const {
    AuthenticationConstants,
    BotFrameworkAuthentication,
    BotFrameworkAuthenticationFactory,
    ClaimsIdentity,
    GovernmentConstants,
    PasswordServiceClientCredentialFactory,
    SkillValidation,
} = require('..');
const { HttpHeaders } = require('@azure/ms-rest-js');

describe('BotFrameworkAuthenticationFactory', function () {
    it('should create anonymous BotFrameworkAuthentication', function () {
        const bfA = BotFrameworkAuthenticationFactory.create();
        assert(bfA instanceof BotFrameworkAuthentication);
    });

    it('should create BotFrameworkAuthentication configured for valid channel services', function () {
        const bfA = BotFrameworkAuthenticationFactory.create('');
        assert.strictEqual(bfA.getOriginatingAudience(), AuthenticationConstants.ToChannelFromBotOAuthScope);

        const gBfA = BotFrameworkAuthenticationFactory.create(GovernmentConstants.ChannelService);
        assert.strictEqual(gBfA.getOriginatingAudience(), GovernmentConstants.ToChannelFromBotOAuthScope);
    });

    it('should throw with an unknown channel service', function () {
        assert.throws(
            () => BotFrameworkAuthenticationFactory.create('unknown'),
            new Error('The provided ChannelService value is not supported.')
        );
    });

    describe('integration tests', function () {
        /**
         * These tests replicate the flow in CloudAdapterBase.processProactive().
         *
         * The CloudAdapterBase's BotFrameworkAuthentication (normally and practically the ParameterizedBotFrameworkAuthentication) is
         * used to create and set on the TurnState the following values:
         * - ConnectorFactory
         * - ConnectorClient
         * - UserTokenClient
         */
        const APP_ID = 'app-id';
        const APP_PASSWORD = 'app-password';
        const HOST_SERVICE_URL = 'https://bot.host.serviceurl';
        const HOST_AUDIENCE = 'host-bot-app-id';
        const V2_VERSION_CLAIM = {
            type: AuthenticationConstants.VersionClaim,
            value: '2.0',
        };

        it('should not throw errors when auth is disabled and anonymous skill claims are used', async function () {
            const credsFactory = new PasswordServiceClientCredentialFactory('', '');
            const pBFA = BotFrameworkAuthenticationFactory.create(
                '',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                credsFactory,
                { requiredEndorsements: [] }
            );
            assert.strictEqual(pBFA.getOriginatingAudience(), AuthenticationConstants.ToChannelFromBotOAuthScope);
            assert.strictEqual(pBFA.credentialsFactory, credsFactory);
            const claimsIdentity = SkillValidation.createAnonymousSkillClaim();

            // The order of creation for the connectorFactory, connectorClient and userTokenClient mirrors the existing flow in
            // CloudAdapterBase.processProactive().
            const connectorFactory = pBFA.createConnectorFactory(claimsIdentity);
            assert.strictEqual(connectorFactory.appId, AuthenticationConstants.AnonymousSkillAppId);
            assert.strictEqual(connectorFactory.credentialFactory, credsFactory);

            // When authentication is disabled, MicrosoftAppCredentials (an implementation of ServiceClientCredentials) with appId and appPassword fields are created and passed to the newly created ConnectorFactory.
            const connectorClient = await connectorFactory.create(HOST_SERVICE_URL, 'UnusedAudienceWhenAuthIsDisabled');
            assert.strictEqual(connectorClient.credentials.appId, null);
            assert.strictEqual(connectorClient.credentials.appPassword, null);
            // If authentication was enabled 'UnusedAudienceWhenAuthIsDisabled' would have been used, but is unnecessary with disabled authentication.
            assert.strictEqual(
                connectorClient.credentials.oAuthScope,
                AuthenticationConstants.ToChannelFromBotOAuthScope
            );

            const userTokenClient = await pBFA.createUserTokenClient(claimsIdentity);
            assert.strictEqual(userTokenClient.appId, AuthenticationConstants.AnonymousSkillAppId);
            assert.strictEqual(userTokenClient.client.credentials.appId, null);
            assert.strictEqual(userTokenClient.client.credentials.appPassword, null);
        });

        it('should not throw errors when auth is disabled and authenticated skill claims are used', async function () {
            const credsFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
            const pBFA = BotFrameworkAuthenticationFactory.create(
                '',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                credsFactory,
                { requiredEndorsements: [] }
            );
            assert.strictEqual(pBFA.getOriginatingAudience(), AuthenticationConstants.ToChannelFromBotOAuthScope);
            assert.strictEqual(pBFA.credentialsFactory, credsFactory);

            const claimsIdentity = new ClaimsIdentity([
                { type: AuthenticationConstants.AuthorizedParty, value: HOST_AUDIENCE },
                { type: AuthenticationConstants.AudienceClaim, value: APP_ID },
                V2_VERSION_CLAIM,
            ]);

            const connectorFactory = pBFA.createConnectorFactory(claimsIdentity);
            assert.strictEqual(connectorFactory.appId, APP_ID);
            assert.strictEqual(connectorFactory.credentialFactory, credsFactory);

            const connectorClient = await connectorFactory.create(HOST_SERVICE_URL, HOST_AUDIENCE);
            assertHasAcceptHeader(connectorClient);
            assert.strictEqual(connectorClient.credentials.appId, APP_ID);
            assert.strictEqual(connectorClient.credentials.appPassword, APP_PASSWORD);
            assert.strictEqual(connectorClient.credentials.oAuthScope, HOST_AUDIENCE);

            const userTokenClient = await pBFA.createUserTokenClient(claimsIdentity);
            assert.strictEqual(userTokenClient.appId, APP_ID);
            assert.strictEqual(userTokenClient.client.credentials.appId, APP_ID);
            assert.strictEqual(userTokenClient.client.credentials.appPassword, APP_PASSWORD);
        });
    });

    function assertHasAcceptHeader(client) {
        let hasAcceptHeader = false;
        const mockNextPolicy = {
            create: (_) => ({}),
            sendRequest: (_) => {
                return {};
            },
        };

        const length = client._requestPolicyFactories.length;
        for (let i = 0; i < length; i++) {
            const mockHttp = {
                headers: new HttpHeaders(),
            };

            const result = client._requestPolicyFactories[i].create(mockNextPolicy);

            result.sendRequest(mockHttp);
            if (mockHttp.headers.get('accept') == '*/*') {
                hasAcceptHeader = true;
                break;
            }
        }

        assert(hasAcceptHeader, 'accept header from connector client should be */*');
    }
});
