// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { AuthenticationConstants, PasswordServiceClientCredentialFactory, GovernmentConstants } = require('../');
const assert = require('assert');

const APP_ID = '2cd87869-38a0-4182-9251-d056e8f0ac24';
const APP_PASSWORD = 'password';

describe('PasswordServiceClientCredentialFactory', function () {
    it('should set appId and password during construction', function () {
        const credFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
        assert.strictEqual(credFactory.appId, APP_ID);
        assert.strictEqual(credFactory.password, APP_PASSWORD);
    });

    it('isValidAppId() should work', async function () {
        const credFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
        assert(await credFactory.isValidAppId(APP_ID));
        assert(!(await credFactory.isValidAppId('invalid-app-id')));
    });

    it('isAuthenticationDisabled() should work', async function () {
        const credFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
        assert(!(await credFactory.isAuthenticationDisabled()));
        credFactory.appId = null;
        assert(await credFactory.isAuthenticationDisabled());
    });

    it('createCredentials() should work', async function () {
        const credFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
        const testArgs = [
            [
                APP_ID,
                AuthenticationConstants.ToChannelFromBotOAuthScope,
                AuthenticationConstants.ToChannelFromBotLoginUrlPrefix +
                    AuthenticationConstants.DefaultChannelAuthTenant,
            ],
            [
                APP_ID,
                AuthenticationConstants.ToChannelFromBotOAuthScope,
                AuthenticationConstants.ToChannelFromBotLoginUrlPrefix +
                    AuthenticationConstants.DefaultChannelAuthTenant,
            ],
            [APP_ID, GovernmentConstants.ToChannelFromBotOAuthScope, GovernmentConstants.ToChannelFromBotLoginUrl],
            [APP_ID, 'CustomAudience', 'https://custom.login-endpoint.com/custom-tenant'],
        ];

        const credentials = await Promise.all(
            testArgs.map((args) => credFactory.createCredentials(args[0], args[1], args[2]))
        );
        credentials.forEach((cred, idx) => {
            // The PasswordServiceClientCredentialFactory generates subclasses of the AppCredentials class.
            assert.strictEqual(cred.appId, APP_ID);
            assert.strictEqual(cred.oAuthScope, testArgs[idx][1]);
            assert.strictEqual(cred.oAuthEndpoint, testArgs[idx][2]);
        });
    });

    it('createCredentials() should always return empty credentials when auth is disabled', async function () {
        const credFactory = new PasswordServiceClientCredentialFactory('', '');
        let creds = await credFactory.createCredentials();

        // When authentication is disabled, a MicrosoftAppCredentials with empty strings for appId and appPassword is returned.
        assert.strictEqual(creds.appId, null);
        assert.strictEqual(creds.appPassword, null);

        creds = await credFactory.createCredentials(APP_ID);
        assert.strictEqual(creds.appId, null);
        assert.strictEqual(creds.appPassword, null);
    });

    it('createCredentials() should throw when appId is invalid', async function () {
        const credFactory = new PasswordServiceClientCredentialFactory(APP_ID, APP_PASSWORD);
        await assert.rejects(() => credFactory.createCredentials('badAppId'), new Error('Invalid appId.'));
    });
});
