// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const {
    ConfigurationServiceClientCredentialFactory,
    createServiceClientCredentialFactoryFromConfiguration,
} = require('../');

describe('ConfigurationServiceClientCredentialFactory', function () {
    class TestConfiguration {
        static DefaultConfig = {
            MicrosoftAppId: 'appId',
            MicrosoftAppPassword: 'appPassword',
            MicrosoftAppType: undefined,
            MicrosoftAppTenantId: undefined,
        };

        constructor(config = {}) {
            this.configuration = Object.assign({}, TestConfiguration.DefaultConfig, config);
        }

        get(_path) {
            return this.configuration;
        }

        set(_path, _val) {}
    }

    const SingleTenantConfig = {
        MicrosoftAppId: 'singleAppId',
        MicrosoftAppPassword: 'singleAppPassword',
        MicrosoftAppType: 'SingleTenant',
        MicrosoftAppTenantId: 'singleAppTenantId',
    };

    const MSIConfig = {
        MicrosoftAppId: 'msiAppId',
        MicrosoftAppType: 'UserAssignedMsi',
        MicrosoftAppTenantId: 'msiAppTenantId',
        MicrosoftAppPassword: undefined,
    };

    it('constructor() should work', function () {
        const bfAuth = new ConfigurationServiceClientCredentialFactory(TestConfiguration.DefaultConfig);
        assert.strictEqual(bfAuth.appId, TestConfiguration.DefaultConfig.MicrosoftAppId);
        assert.strictEqual(bfAuth.password, TestConfiguration.DefaultConfig.MicrosoftAppPassword);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() should work', function () {
        const config = new TestConfiguration();
        const bfAuth = createServiceClientCredentialFactoryFromConfiguration(config);
        assert.strictEqual(bfAuth.appId, TestConfiguration.DefaultConfig.MicrosoftAppId);
        assert.strictEqual(bfAuth.password, TestConfiguration.DefaultConfig.MicrosoftAppPassword);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() with undefined or null configuration values should result in null values', function () {
        const config = new TestConfiguration({
            MicrosoftAppId: undefined,
            MicrosoftAppPassword: undefined,
        });
        const bfAuth = createServiceClientCredentialFactoryFromConfiguration(config);
        assert.strictEqual(bfAuth.appId, null);
        assert.strictEqual(bfAuth.password, null);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() with non-string values should fail', function () {
        const config = new TestConfiguration({
            MicrosoftAppId: 1,
            MicrosoftAppPassword: true,
        });

        assert.throws(
            () => createServiceClientCredentialFactoryFromConfiguration(config),
            (err) => {
                assert((err as Error).message.includes('MicrosoftAppId'));
                assert((err as Error).message.includes('MicrosoftAppPassword'));
                return true;
            }
        );
    });

    it('createServiceClientCredentialFactoryFromConfiguration() with non-defined MicrosoftAppType configuration should work', function () {
        const config = new TestConfiguration();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { MicrosoftAppType, ...configuration } = config.configuration;
        config.configuration = configuration;

        createServiceClientCredentialFactoryFromConfiguration(config);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() with empty-string MicrosoftAppType configuration should work', function () {
        const config = new TestConfiguration({ MicrosoftAppType: '' });

        createServiceClientCredentialFactoryFromConfiguration(config);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() with casing-string MicrosoftAppType configuration should work', function () {
        const config = new TestConfiguration({ ...SingleTenantConfig, MicrosoftAppType: 'singletenant' });

        createServiceClientCredentialFactoryFromConfiguration(config);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() singleTenant with config should work', function () {
        const config = new TestConfiguration(SingleTenantConfig);
        const bfAuth = createServiceClientCredentialFactoryFromConfiguration(config);
        assert.strictEqual(bfAuth.appId, config.configuration.MicrosoftAppId);
        assert.strictEqual(bfAuth.password, config.configuration.MicrosoftAppPassword);
        assert.strictEqual(bfAuth.tenantId, config.configuration.MicrosoftAppTenantId);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() singleTenant without tenantId should throw', function () {
        const config = new TestConfiguration({ ...SingleTenantConfig, MicrosoftAppTenantId: undefined });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppTenantId is required for SingleTenant in configuration.',
        });
    });

    it('createServiceClientCredentialFactoryFromConfiguration() singleTenant without appId should throw', function () {
        const config = new TestConfiguration({ ...SingleTenantConfig, MicrosoftAppId: undefined });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppId is required for SingleTenant in configuration.',
        });
    });

    it('createServiceClientCredentialFactoryFromConfiguration() singleTenant without appPassword should throw', function () {
        const config = new TestConfiguration({ ...SingleTenantConfig, MicrosoftAppPassword: undefined });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppPassword is required for SingleTenant in configuration.',
        });
    });

    it('createServiceClientCredentialFactoryFromConfiguration() manageIdentityApp with config should work', function () {
        const config = new TestConfiguration(MSIConfig);
        const bfAuth = createServiceClientCredentialFactoryFromConfiguration(config);

        assert.strictEqual(bfAuth.appId, config.configuration.MicrosoftAppId);
        assert.strictEqual(bfAuth.tenantId, config.configuration.MicrosoftAppTenantId);
    });

    it('createServiceClientCredentialFactoryFromConfiguration() manageIdentityApp without tenantId should throw', function () {
        const config = new TestConfiguration({ ...MSIConfig, MicrosoftAppTenantId: undefined });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppTenantId is required for MSI in configuration.',
        });
    });

    it('createServiceClientCredentialFactoryFromConfiguration() manageIdentityApp without appId should throw', function () {
        const config = new TestConfiguration({ ...MSIConfig, MicrosoftAppId: undefined });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppId is required for MSI in configuration.',
        });
    });

    it('createServiceClientCredentialFactoryFromConfiguration() manageIdentityApp with appPassword should throw', function () {
        const config = new TestConfiguration({ ...MSIConfig, MicrosoftAppPassword: 'msiAppPassword' });

        assert.throws(() => createServiceClientCredentialFactoryFromConfiguration(config), {
            name: 'AssertionError',
            message: 'MicrosoftAppPassword must not be set for MSI in configuration.',
        });
    });
});
