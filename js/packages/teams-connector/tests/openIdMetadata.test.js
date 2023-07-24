/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const assert = require('assert');
const nock = require('nock');
const { OpenIdMetadata } = require('../lib/auth/openIdMetadata');
const { StatusCodes } = require('botframework-schema');

describe('OpenIdMetadata', function () {
    describe('Cache Tests', function () {
        this.timeout(20000);

        const mockUrl = 'http://mockUrl';
        const mockMetadataUrl = '/api/metadataUrl';
        const jwks_uriUrl = '/api/jwks_uriUrl';

        // the below key and parts were retrieved from an Emulator token
        const e = 'AQAB';
        const kid = 'SsZsBNhZcF3Q9S4trpQBTByNRRI';
        const n =
            'uHPewhg4WC3eLVPkEFlj7RDtaKYWXCI5G-LPVzsMKOuIu7qQQbeytIA6P6HT9_iIRt8zNQvuw4P9vbNjgUCpI6vfZGsjk3XuCVoB_bAIhvuBcQh9ePH2yEwS5reR-NrG1PsqzobnZZuigKCoDmuOb_UDx1DiVyNCbMBlEG7UzTQwLf5NP6HaRHx027URJeZvPAWY7zjHlSOuKoS_d1yUveaBFIgZqPWLCg44ck4gvik45HsNVWT9zYfT74dvUSSrMSR-SHFT7Hy1XjbVXpHJHNNAXpPoGoWXTuc0BxMsB4cqjfJqoftFGOG4x32vEzakArLPxAKwGvkvu0jToAyvSQ';
        const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAuHPewhg4WC3eLVPkEFlj7RDtaKYWXCI5G+LPVzsMKOuIu7qQQbey
tIA6P6HT9/iIRt8zNQvuw4P9vbNjgUCpI6vfZGsjk3XuCVoB/bAIhvuBcQh9ePH2
yEwS5reR+NrG1PsqzobnZZuigKCoDmuOb/UDx1DiVyNCbMBlEG7UzTQwLf5NP6Ha
RHx027URJeZvPAWY7zjHlSOuKoS/d1yUveaBFIgZqPWLCg44ck4gvik45HsNVWT9
zYfT74dvUSSrMSR+SHFT7Hy1XjbVXpHJHNNAXpPoGoWXTuc0BxMsB4cqjfJqoftF
GOG4x32vEzakArLPxAKwGvkvu0jToAyvSQIDAQAB
-----END RSA PUBLIC KEY-----\n`;

        describe('getKey', function () {
            it('retrieves cached key on subsequent call', async function () {
                const nockScope = setupNockCalls();

                const openIdMetadata = new OpenIdMetadata(mockUrl + mockMetadataUrl);
                let foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');

                assert.equal(foundKey.key, publicKey);

                foundKey = await openIdMetadata.getKey(kid);
                assert.equal(foundKey.key, publicKey);
            });

            it('returns null key if key missing and lastUpdated > (Date.now() - 1000 * 60 * 60)', async function () {
                const nockScope = setupNockCalls();

                const openIdMetadata = new OpenIdMetadata(mockUrl + mockMetadataUrl);
                let foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');

                assert.equal(foundKey.key, publicKey);

                // remove the key, so it is not found
                openIdMetadata.keys.splice(openIdMetadata.keys.indexOf(kid), 1);
                foundKey = await openIdMetadata.getKey(kid);
                assert.equal(foundKey, null);
            });

            it('calls refreshCache if key missing and lastUpdated < (Date.now() - 1000 * 60 * 60)', async function () {
                let nockScope = setupNockCalls();

                const openIdMetadata = new OpenIdMetadata(mockUrl + mockMetadataUrl);
                let foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');

                assert.equal(foundKey.key, publicKey);

                // remove the key, so it is not found
                openIdMetadata.keys.splice(openIdMetadata.keys.indexOf(kid), 1);
                openIdMetadata.lastUpdated = Date.now() - 1000 * 60 * 60 - 10000;

                nockScope = setupNockCalls();
                foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');
                assert.equal(foundKey.key, publicKey);
            });

            it('calls refreshCache if lastUpdated < (1000 * 60 * 60 * 24)', async function () {
                let nockScope = setupNockCalls();

                const openIdMetadata = new OpenIdMetadata(mockUrl + mockMetadataUrl);
                let foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');

                assert.equal(foundKey.key, publicKey);
                openIdMetadata.lastUpdated = Date.now() - 1000 * 60 * 60 * 24 - 10000;

                nockScope = setupNockCalls();
                foundKey = await openIdMetadata.getKey(kid);
                assert(nockScope.isDone(), 'nock calls not completed');
                assert.equal(foundKey.key, publicKey);
            });
        });

        function setupNockCalls() {
            nock.restore();
            nock.activate();
            return nock(mockUrl)
                .get(mockMetadataUrl)
                .reply(StatusCodes.OK, { jwks_uri: mockUrl + jwks_uriUrl })
                .get(jwks_uriUrl)
                .reply(StatusCodes.OK, { keys: [{ kid: kid, e: e, n: n }] });
        }
    });
});
