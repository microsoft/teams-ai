// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const {
    JwtTokenProviderFactory,
    ManagedIdentityAppCredentials,
    ManagedIdentityServiceClientCredentialsFactory,
} = require('../../lib');

const testAppId = 'foo';
const testAudience = 'bar';
const testTokenProvider = new JwtTokenProviderFactory(testAppId);

const testInput = [
    { name: 'null', value: null },
    { name: 'empty', value: '' },
    { name: 'blank', value: ' ' },
];
const errorMsgAppId = 'ManagedIdentityServiceClientCredentialsFactory.constructor(): missing appId.';
const errorMsgToken = 'ManagedIdentityServiceClientCredentialsFactory.constructor(): missing tokenProviderFactory.';

describe('ManagedIdentityServiceClientCredentialsFactory', function () {
    it('constructor() succeeds with appId and tokenProvider', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        assert.strictEqual(testAppId, sut.appId);
        assert.strictEqual(testTokenProvider, sut.tokenProviderFactory);
    });

    testInput.forEach(({ name, value }) => {
        it(`constructor() should throw if appId is ${name}`, function () {
            assert.throws(() => new ManagedIdentityServiceClientCredentialsFactory(value, testTokenProvider), {
                name: 'AssertionError',
                message: errorMsgAppId,
            });
        });
    });

    it('constructor() should throw with null tokenProviderFactory', function () {
        assert.throws(() => new ManagedIdentityServiceClientCredentialsFactory(testAppId, null), {
            name: 'AssertionError',
            message: errorMsgToken,
        });
    });

    it('isValidAppId() should be valid', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        assert.strictEqual(true, await sut.isValidAppId(testAppId));
    });

    it('isValidAppId() should not be valid', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        assert.strictEqual(false, await sut.isValidAppId('invalidAppId'));
    });

    it('isAuthenticationDisabled() should not be disabled', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        assert.strictEqual(false, await sut.isAuthenticationDisabled());
    });

    it('createCredentials() should create credentials', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        const credentials = await sut.createCredentials(testAppId, testAudience);
        assert(credentials instanceof ManagedIdentityAppCredentials);
    });

    it('createCredentials() should throw with invalid appId', async function () {
        const sut = new ManagedIdentityServiceClientCredentialsFactory(testAppId, testTokenProvider);
        await assert.rejects(sut.createCredentials('invalidAppId', testAudience), {
            name: 'AssertionError',
            message: 'ManagedIdentityServiceClientCredentialsFactory.createCredentials(): Invalid Managed ID.',
        });
    });
});
