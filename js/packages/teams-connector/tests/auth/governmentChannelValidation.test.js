// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const { ClaimsIdentity, GovernmentChannelValidation, SimpleCredentialProvider, AuthenticationError } = require('../..');
const { StatusCodes } = require('botframework-schema');

describe('GovernmentChannelValidator', function () {
    const credentials = new SimpleCredentialProvider('2cd87869-38a0-4182-9251-d056e8f0ac24', '2.30Vs3VQLKt974F');

    it('validateIdentity should fail if no identity', async function () {
        await assert.rejects(
            GovernmentChannelValidation.validateIdentity(new ClaimsIdentity([], false), undefined),
            new AuthenticationError('Unauthorized. Is not authenticated', StatusCodes.UNAUTHORIZED)
        );
    });

    it('validateIdentity should fail if wrong issuer', async function () {
        await assert.rejects(
            GovernmentChannelValidation.validateIdentity(
                new ClaimsIdentity([{ type: 'iss', value: 'peanut' }], true),
                credentials
            ),
            new AuthenticationError('Unauthorized. Issuer Claim MUST be present.', StatusCodes.UNAUTHORIZED)
        );
    });

    it('validateIdentity should fail if no audience', async function () {
        await assert.rejects(
            GovernmentChannelValidation.validateIdentity(
                new ClaimsIdentity([{ type: 'iss', value: 'https://api.botframework.us' }], true),
                credentials
            ),
            new AuthenticationError('Unauthorized. Invalid AppId passed on token: null', StatusCodes.UNAUTHORIZED)
        );
    });

    it('validateIdentity should fail if wrong audience', async function () {
        await assert.rejects(
            GovernmentChannelValidation.validateIdentity(
                new ClaimsIdentity(
                    [
                        { type: 'iss', value: 'https://api.botframework.us' },
                        { type: 'aud', value: 'peanut' },
                    ],
                    true
                ),
                credentials
            ),
            new AuthenticationError('Unauthorized. Invalid AppId passed on token: peanut', StatusCodes.UNAUTHORIZED)
        );
    });

    it('validateIdentity should work', function () {
        return GovernmentChannelValidation.validateIdentity(
            new ClaimsIdentity(
                [
                    { type: 'iss', value: 'https://api.botframework.us' },
                    { type: 'aud', value: credentials.appId },
                ],
                true
            ),
            credentials
        );
    });
});
