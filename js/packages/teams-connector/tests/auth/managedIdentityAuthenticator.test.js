// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const sinon = require('sinon');
const { JwtTokenProviderFactory, ManagedIdentityAuthenticator } = require('../../lib');

const testAppId = 'foo';
const testAudience = 'bar';
const authResult = {
    token: '123',
    expiresOnTimestamp: 3000,
};

const tokenProvider = new JwtTokenProviderFactory(testAppId);
tokenProvider.createAzureServiceTokenProvider = sinon.spy(() => ({
    getToken: () => authResult,
}));

const testInput = [
    { name: 'null', value: null },
    { name: 'empty', value: '' },
    { name: 'blank', value: ' ' },
];

const errorMsgAppId = 'ManagedIdentityAuthenticator.constructor(): missing appId.';
const errorMsgAudience = 'ManagedIdentityAuthenticator.constructor(): missing resource.';
const errorMsgToken = 'ManagedIdentityAuthenticator.constructor(): missing tokenProviderFactory.';

describe('ManagedIdentityAuthenticator', function () {
    it('constructor() should call createAzureServiceTokenProvider', function () {
        const sut = new ManagedIdentityAuthenticator(testAppId, testAudience, tokenProvider);
        assert.strictEqual(testAudience, sut.resource);
        assert.strictEqual(tokenProvider.createAzureServiceTokenProvider.calledOnce, true);
    });

    testInput.forEach(({ name, value }) => {
        it(`constructor() should throw if appId is ${name}`, function () {
            assert.throws(() => new ManagedIdentityAuthenticator(value, testAudience, tokenProvider), {
                name: 'AssertionError',
                message: errorMsgAppId,
            });
        });
    });

    testInput.forEach(({ name, value }) => {
        it(`constructor() should throw if audience is ${name}`, function () {
            assert.throws(() => new ManagedIdentityAuthenticator(testAppId, value, tokenProvider), {
                name: 'AssertionError',
                message: errorMsgAudience,
            });
        });
    });

    it('constructor() should throw with null tokenProviderFactory', function () {
        assert.throws(() => new ManagedIdentityAuthenticator(testAppId, testAudience, null), {
            name: 'AssertionError',
            message: errorMsgToken,
        });
    });

    it('getToken() should get token', async function () {
        const sut = new ManagedIdentityAuthenticator(testAppId, testAudience, tokenProvider);
        const token = await sut.getToken();

        assert.strictEqual(token.token, authResult.token);
        assert.strictEqual(token.expiresOnTimestamp, authResult.expiresOnTimestamp);
    });

    it('getToken() should retry and acquire token', async function () {
        let callsToAcquireToken = 0;
        const tokenProvider = new JwtTokenProviderFactory(testAppId);
        tokenProvider.createAzureServiceTokenProvider = sinon.spy(() => ({
            getToken() {
                callsToAcquireToken++;
                if (callsToAcquireToken === 1) {
                    throw new Error();
                }

                return authResult;
            },
        }));
        const sut = new ManagedIdentityAuthenticator(testAppId, testAudience, tokenProvider);
        const token = await sut.getToken();

        assert.strictEqual(token.token, authResult.token);
        assert.strictEqual(token.expiresOnTimestamp, authResult.expiresOnTimestamp);
        assert.strictEqual(callsToAcquireToken, 2);
    });

    it('getToken() should retry on error', async function () {
        const maxRetries = 5;
        let callsToAcquireToken = 0;
        const tokenProvider = new JwtTokenProviderFactory(testAppId);
        tokenProvider.createAzureServiceTokenProvider = sinon.spy(() => ({
            getToken() {
                callsToAcquireToken++;
                throw new Error('AuthError');
            },
        }));

        const sut = new ManagedIdentityAuthenticator(testAppId, testAudience, tokenProvider);

        await assert.rejects(sut.getToken(), {
            message: 'AuthError',
        });
        assert.strictEqual(callsToAcquireToken, maxRetries);
    });
});
