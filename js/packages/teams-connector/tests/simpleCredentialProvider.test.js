const { ok: assert, strictEqual } = require('assert');
const { SimpleCredentialProvider } = require('../lib');

describe('SimpleCredentialProvider', function () {
    const APP_ID = 'appId';
    const APP_PASSWORD = 'appPassword';
    const NOT_APP_ID = 'notAppId';

    it('should set appId and appPassword during construction', function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        strictEqual(credentials.appId, APP_ID);
        strictEqual(credentials.appPassword, APP_PASSWORD);
    });

    it('isValidAppId() should resolve true if appId matches appId from construction', async function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        const isValidAppId = await credentials.isValidAppId(APP_ID);
        assert(isValidAppId, 'should have validated provided appId');
    });

    it("isValidAppId() should resolve false if appId doesn't match appId from construction", async function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        const isValidAppId = await credentials.isValidAppId(NOT_APP_ID);
        assert(!isValidAppId, 'should have validated provided appId');
    });

    it('getAppPassword() should resolve appPassword if appId matches appId from construction', async function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        const appPassword = await credentials.getAppPassword(APP_ID);
        strictEqual(appPassword, APP_PASSWORD);
    });

    it("getAppPassword() should resolve null if appId doesn't matches appId from construction", async function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        const appPassword = await credentials.getAppPassword(NOT_APP_ID);
        strictEqual(appPassword, null);
    });

    it('isAuthenticationDisabled() should resolve true if appId was passed in during construction', async function () {
        const credentials = new SimpleCredentialProvider(APP_ID, APP_PASSWORD);
        const isAuthDisabled = await credentials.isAuthenticationDisabled();
        strictEqual(isAuthDisabled, false);
    });

    it("isAuthenticationDisabled() should resolve false if appId wasn't passed in during construction", async function () {
        const credentials = new SimpleCredentialProvider();
        strictEqual(credentials.appId, undefined);
        const isAuthDisabled = await credentials.isAuthenticationDisabled();
        strictEqual(isAuthDisabled, true);
    });
});
