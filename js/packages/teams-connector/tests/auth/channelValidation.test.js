// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const { ChannelValidation, ClaimsIdentity, SimpleCredentialProvider, AuthenticationError } = require('../..');
const { StatusCodes } = require('botframework-schema');

describe('ChannelValidation', function () {
    const credentials = new SimpleCredentialProvider('2cd87869-38a0-4182-9251-d056e8f0ac24', '2.30Vs3VQLKt974F');
    describe('validateIdentity', function () {
        it('should fail if unauthenticated', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(new ClaimsIdentity([], false), undefined),
                new AuthenticationError('Unauthorized. Is not authenticated', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should fail if no identity', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(undefined, undefined),
                new AuthenticationError('Unauthorized. Is not authenticated', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should fail if no issuer', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(
                    new ClaimsIdentity([{ type: 'peanut', value: 'peanut' }], true),
                    credentials
                ),
                new AuthenticationError('Unauthorized. Issuer Claim MUST be present.', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should fail if wrong issuer', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(
                    new ClaimsIdentity([{ type: 'iss', value: 'peanut' }], true),
                    credentials
                ),
                new AuthenticationError('Unauthorized. Issuer Claim MUST be present.', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should fail if no audience', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(
                    new ClaimsIdentity([{ type: 'iss', value: 'https://api.botframework.com' }], true),
                    credentials
                ),
                new AuthenticationError('Unauthorized. Invalid AppId passed on token: null', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should fail if wrong audience', async function () {
            await assert.rejects(
                ChannelValidation.validateIdentity(
                    new ClaimsIdentity(
                        [
                            { type: 'iss', value: 'https://api.botframework.com' },
                            { type: 'aud', value: 'peanut' },
                        ],
                        true
                    ),
                    credentials
                ),
                new AuthenticationError('Unauthorized. Invalid AppId passed on token: peanut', StatusCodes.UNAUTHORIZED)
            );
        });

        it('should work', async function () {
            await ChannelValidation.validateIdentity(
                new ClaimsIdentity(
                    [
                        { type: 'iss', value: 'https://api.botframework.com' },
                        { type: 'aud', value: credentials.appId },
                    ],
                    true
                ),
                credentials
            );
        });
    });
});
