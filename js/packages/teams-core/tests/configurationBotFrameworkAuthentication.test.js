const assert = require('assert');
const { AuthenticationConstants } = require('botframework-connector');
const {
    CallerIdConstants,
    ConfigurationBotFrameworkAuthentication,
    createBotFrameworkAuthenticationFromConfiguration,
} = require('../');

describe('ConfigurationBotFrameworkAuthentication', function () {
    class TestConfiguration {
        static DefaultConfig = {
            // [AuthenticationConstants.ChannelService]: undefined,
            ValidateAuthority: true,
            ToChannelFromBotLoginUrl: AuthenticationConstants.ToChannelFromBotLoginUrl,
            ToChannelFromBotOAuthScope: AuthenticationConstants.ToChannelFromBotOAuthScope,
            ToBotFromChannelTokenIssuer: AuthenticationConstants.ToBotFromChannelTokenIssuer,
            ToBotFromEmulatorOpenIdMetadataUrl: AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl,
            CallerId: CallerIdConstants.PublicAzureChannel,
            ToBotFromChannelOpenIdMetadataUrl: AuthenticationConstants.ToBotFromChannelOpenIdMetadataUrl,
            OAuthUrl: AuthenticationConstants.OAuthUrl,
            // [AuthenticationConstants.OAuthUrlKey]: 'test',
            [AuthenticationConstants.BotOpenIdMetadataKey]: null,
        };

        constructor(config = {}) {
            this.configuration = Object.assign({}, TestConfiguration.DefaultConfig, config);
        }

        get(_path) {
            return this.configuration;
        }

        set(_path, _val) {}
    }

    it('constructor should work', function () {
        const bfAuth = new ConfigurationBotFrameworkAuthentication(TestConfiguration.DefaultConfig);
        assert(bfAuth.inner);
    });

    it('createBotFrameworkAuthenticationFromConfiguration should work', function () {
        const config = new TestConfiguration();
        const bfAuth = createBotFrameworkAuthenticationFromConfiguration(config);
        assert(bfAuth.inner);
    });
});
