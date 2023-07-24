// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const { JwtTokenProviderFactory } = require('../../lib');

const appId = [
    { name: 'null', value: null },
    { name: 'empty', value: '' },
    { name: 'blank', value: ' ' },
];
const errorMsg = 'jwtTokenProviderFactory.createAzureServiceTokenProvider(): missing appId.';

describe('JwtTokenProviderFactory', function () {
    const testAppId = 'foo';

    it('createAzureServiceTokenProvider() can create with appId', async function () {
        const sut = new JwtTokenProviderFactory();
        const tokenProvider = sut.createAzureServiceTokenProvider(testAppId);
        assert.notStrictEqual(tokenProvider, null);
    });

    appId.forEach(({ name, value }) => {
        it(`createAzureServiceTokenProvider() should throw if appId is ${name}`, function () {
            const sut = new JwtTokenProviderFactory();
            assert.throws(() => sut.createAzureServiceTokenProvider(value), {
                name: 'AssertionError',
                message: errorMsg,
            });
        });
    });
});
