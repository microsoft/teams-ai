/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 */

/*
 * WORKING WITH THESE TESTS
 *   To run mocked and without recording:
 *    1. Supply .env with:
 *       * NOCK_OFF=false
 *
 *   To run live or unmocked:
 *    1. Supply .env with (all must be valid):
 *       * CLIENT_ID (appID)
 *       * CLIENT_SECRET (appPass)
 *       * USER_ID (from Slack)
 *       * BOT_ID (from slack)
 *       * AZURE_SUBSCRIPTION_ID
 *       * NOCK_OFF=true
 *    2. Ensure appId has Slack channel enabled and you've installed the bot in Slack
 *
 *   To re-record:
 *    1. All from live/unmocked, except NOCK_OFF=false and AZURE_NOCK_RECORD=true
 *    2. GetAttachment should work fine, provided SuiteBase appropriately replaces the encoded stream with fs.createReadStream('tests/bot-framework.png')
 *       * You shouldn't need to adjust/change anything unless the test image or path changes.
 *
 *   Notes: tokenApiClient.userToken.get*Token has to be mocked/stubbed because the bot can't be logged in to create a valid token
 */
const fs = require('fs');
const assert = require('assert');
// eslint-reason This is actually used. not sure why linter complains
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const should = require('should');

require('dotenv').config({ path: 'tests/.env' });

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    const bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap);
}

const BotConnector = require('../lib');

const ConnectorClient = BotConnector.ConnectorClient;
const TokenApiClient = BotConnector.TokenApiClient;

const SuiteBase = require('azure/framework/suite-base');

const requiredEnvironment = ['USER_ID', 'BOT_ID', 'HOST_URL'];

const clientId = process.env['CLIENT_ID'];
const clientSecret = process.env['CLIENT_SECRET'];
const hostURL = process.env['HOST_URL'] || 'https://slack.botframework.com';

const user = {
    id: process.env['USER_ID'] || 'UK8CH2281:TKGSUQHQE',
};
const bot = {
    id: process.env['BOT_ID'] || 'BKGSYSTFG:TKGSUQHQE',
};

const testPrefix = 'botFramework-connector-tests';
const libraryPath = 'botframework-connector';
let suite;
let credentials;
let client;
let tokenApiClient;

const createActivity = () => ({
    type: 'message',
    text: 'test activity',
    recipient: user,
    from: bot,
});

const createConversation = () => ({
    members: [user],
    bot: bot,
});

const createAttachment = () => ({
    name: 'bot-framework.png',
    type: 'image/png',
    originalBase64: base64_encode(__dirname + '/bot-framework.png'),
});

const readStreamToBuffer = function (stream, callback) {
    const buffer = [];
    stream.on('data', (d) => buffer.push(d));
    stream.on('end', () => callback(null, buffer.join('')));
    stream.on('error', (err) => callback(err, null));
};

describe('Bot Framework Connector SDK', function () {
    before(function (done) {
        suite = new SuiteBase(this, testPrefix, requiredEnvironment, libraryPath);
        suite.setupSuite(function () {
            credentials = new BotConnector.MicrosoftAppCredentials(clientId, clientSecret);
            client = new ConnectorClient(credentials, { baseUri: hostURL });
            tokenApiClient = new TokenApiClient(credentials, { baseUri: 'https://token.botframework.com' });
        });
        done();
    });

    after(function (done) {
        suite.teardownSuite(done);
    });

    beforeEach(function (done) {
        suite.setupTest(done);
    });

    afterEach(function (done) {
        suite.baseTeardownTest(done);
    });

    describe('Conversations', function () {
        describe('CreateConversation', function () {
            it('should return a valid conversation ID', async function () {
                const params = createConversation();
                params.activity = createActivity();

                const result = await client.conversations.createConversation(params);
                assert(!!result.id);
            });

            it('should fail with invalid bot', async function () {
                const params = createConversation();
                params.bot = { id: 'invalid-id' };

                await assert.rejects(async () => await client.conversations.createConversation(params), {
                    code: 'ServiceError',
                    message: 'Invalid userId: invalid-id',
                });
            });
            it('should fail without members', async function () {
                const params = createConversation();
                params.members = [];

                await assert.rejects(async () => await client.conversations.createConversation(params), {
                    code: 'BadArgument',
                    message: 'Conversations must be to a single member',
                });
            });
            it('should fail with bot member', async function () {
                const params = createConversation();
                params.members = [bot];

                await assert.rejects(async () => await client.conversations.createConversation(params), {
                    code: 'BadArgument',
                    message: 'Bots cannot IM other bots',
                });
            });
        });

        describe('GetConversationMembers', function () {
            it('should have the userId', async function () {
                const params = createConversation();

                const result = await client.conversations.createConversation(params);
                const members = await client.conversations.getConversationMembers(result.id);
                members.should.matchAny((member) => member.id === user.id);
            });
            it('should fail with invalid conversationId', async function () {
                const params = createConversation();

                const result = await client.conversations.createConversation(params);
                await assert.rejects(
                    async () => await client.conversations.getConversationMembers(result.id.concat('M')),
                    {
                        code: 'BadArgument',
                        message: 'Slack API error',
                    }
                );
            });
        });

        describe('SendToConversation', function () {
            it('should return a valid activityId', async function () {
                const params = createConversation();

                const result = await client.conversations.createConversation(params);
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                assert(!!result2.id);
            });
            it('should return a valid activityId with Teams activity', async function () {
                const params = createConversation();
                const activity = createActivity();
                activity.entities = [
                    {
                        type: 'mention',
                        text: '<at>User1</at>',
                        mentioned: {
                            name: 'User1',
                            id: `${user.id}_1`,
                        },
                    },
                    {
                        type: 'mention',
                        text: '<at>User2</at>',
                        mentioned: {
                            name: 'User2',
                            id: `${user.id}_2`,
                        },
                    },
                ];

                const result = await client.conversations.createConversation(params);
                const result2 = await client.conversations.sendToConversation(result.id, activity);
                assert(!!result2.id);
            });
            it('should fail with invalid conversationId', async function () {
                const params = createConversation();

                const result = await client.conversations.createConversation(params);
                await assert.rejects(
                    async () => await client.conversations.sendToConversation(result.id.concat('M'), createActivity()),
                    {
                        code: 'BadArgument',
                        message: 'Slack API error',
                    }
                );
            });
            it('should send a Hero card', async function () {
                const params = createConversation();
                const activity = createActivity();
                activity.attachments = [
                    {
                        contentType: 'application/vnd.microsoft.card.hero',
                        content: {
                            title: 'A static image',
                            subtitle: 'JPEG image',
                            images: [
                                {
                                    url:
                                        'https://docs.microsoft.com/en-us/bot-framework/media/designing-bots/core/dialogs-screens.png',
                                },
                            ],
                        },
                    },
                ];

                const result = await client.conversations.createConversation(params);
                const result2 = await client.conversations.sendToConversation(result.id, activity);
                assert(!!result2.id);
            });
        });

        describe('GetActivityMembers', function () {
            it('should have the userId', async function () {
                const params = createConversation();
                params.activity = createActivity();

                const result = await client.conversations.createConversation(params);
                const members = await client.conversations.getActivityMembers(result.id, result.activityId);
                members.should.matchAny((member) => member.id === user.id);
            });
            it('should fail with invalid conversationId', async function () {
                const params = createConversation();
                params.activity = createActivity();

                const result = await client.conversations.createConversation(params);
                await assert.rejects(
                    async () => await client.conversations.getActivityMembers(result.id.concat('M'), result.activityId),
                    {
                        code: 'BadArgument',
                        message: 'Slack API error',
                    }
                );
            });
        });

        describe('ReplyToActivity', function () {
            it('should return a valid activityId', async function () {
                const params = createConversation();
                const reply = createActivity();
                reply.text = 'reply';

                const result = await client.conversations.createConversation(params);
                const conversationId = result.id;
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                const result3 = await client.conversations.replyToActivity(conversationId, result2.id, reply);
                assert(!!result3.id);
            });
            it('should fail with invalid conversationId', async function () {
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                await assert.rejects(
                    async () => await client.conversations.replyToActivity('invalid-id', result2.id, createActivity()),
                    {
                        code: 'ServiceError',
                        message: 'Invalid ConversationId: invalid-id',
                    }
                );
            });
        });

        describe('DeleteActivity', function () {
            it('should delete the activity', async function () {
                const conversation = createConversation();
                conversation.activity = createActivity();
                const result = await client.conversations.createConversation(conversation);
                await assert.doesNotReject(
                    async () => await client.conversations.deleteActivity(result.id, result.activityId)
                );
            });
            it('should fail with invalid conversationId', async function () {
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                await assert.rejects(async () => client.conversations.deleteActivity('invalid-id', result2.id), {
                    code: 'ServiceError',
                    message: 'Invalid ConversationId: invalid-id',
                });
            });
        });

        describe('UpdateActivity', function () {
            it('should return a valid activityId', async function () {
                const updatedActivity = createActivity();
                updatedActivity.text = 'updated activity';

                const result = await client.conversations.createConversation(createConversation());
                const conversationId = result.id;
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                updatedActivity.id = result2.id;
                const result3 = await client.conversations.updateActivity(conversationId, result2.id, updatedActivity);
                assert(!!result3.id);
            });
            it('should fail with invalid conversationId', async function () {
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.sendToConversation(result.id, createActivity());
                await assert.rejects(
                    async () => client.conversations.updateActivity('invalid-id', result2.id, createActivity()),
                    {
                        code: 'ServiceError',
                        message: 'Invalid ConversationId: invalid-id',
                    }
                );
            });
        });

        describe('UploadAttachment', function () {
            it('should return a valid attachmentId', async function () {
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.uploadAttachment(result.id, createAttachment());
                assert(!!result2.id);
            });
        });
    });

    describe('Attachments', function () {
        describe('GetAttachmentInfo', function () {
            it('should return a valid attachmentId', async function () {
                const attachment = createAttachment();
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.uploadAttachment(result.id, attachment);
                const result3 = await client.attachments.getAttachmentInfo(result2.id);
                result3.name.should.be.exactly(attachment.name);
            });
        });

        describe('GetAttachment', function () {
            it('should return valid attachment', async function () {
                const attachment = createAttachment();
                const result = await client.conversations.createConversation(createConversation());
                const result2 = await client.conversations.uploadAttachment(result.id, attachment);
                const attachmentId = result2.id;
                const result3 = await client.attachments.getAttachmentInfo(result2.id);
                const result4 = await client.attachments.getAttachment(attachmentId, result3.views[0].viewId);
                await new Promise((resolve, _reject) => {
                    readStreamToBuffer(result4._response.readableStreamBody, (err, buffer) => {
                        buffer.toString().should.be.exactly(attachment.originalBase64.toString());
                        resolve();
                    });
                });
            });
        });
    });
    describe('TokenApiClient', function () {
        describe('tokenApiClient Construction', function () {
            it('should not throw on http url', function () {
                const client = new TokenApiClient(credentials, {
                    baseUri: 'http://localhost',
                });
                assert(client);
            });
            it('should throw on null credentials', function () {
                assert.throws(
                    () =>
                        new TokenApiClient(null, {
                            baseUri: 'http://localhost',
                        }),
                    {
                        message: "'credentials' cannot be null.",
                    }
                );
            });
        });
        describe('botSignIn', function () {
            it('should return a valid sign in url', async function () {
                const urlRegex = /https:\/\/token.botframework.com\/api\/oauth\/signin\?signin=.*/i;
                const conversation = createConversation();
                conversation.user = user;
                const state = {
                    ConnectionName: 'github',
                    Conversation: conversation,
                    MsAppId: credentials.appId,
                };
                const finalState = Buffer.from(JSON.stringify(state)).toString('base64');
                const result = await tokenApiClient.botSignIn.getSignInUrl(finalState);
                assert.strictEqual(result._response.status, 200);
                assert(result._response.bodyAsText.match(urlRegex));
            });
        });
        describe('userToken', function () {
            describe('getToken', function () {
                it('should throw on null userId', async function () {
                    await assert.rejects(async () => await tokenApiClient.userToken.getToken(null, 'mockConnection'), {
                        message: 'userId cannot be null',
                    });
                });
                it('should throw on null connectionName', async function () {
                    await assert.rejects(async () => await tokenApiClient.userToken.getToken(user.id, null), {
                        message: 'connectionName cannot be null',
                    });
                });
                it('should return null on invalid connection string', async function () {
                    const result = await tokenApiClient.userToken.getToken(user.id, 'invalid');
                    assert.strictEqual(result.token, null);
                });
                it('should return token with no magic code', async function () {
                    const result = await tokenApiClient.userToken.getToken(user.id, 'slack', { code: null });
                    assert(result.channelId);
                    assert(result.connectionName);
                    assert(result.token);
                    assert(result.expiration);
                });
            });
            describe('getAadTokens', function () {
                it('should throw on null userId', async function () {
                    await assert.rejects(
                        async () =>
                            await tokenApiClient.userToken.getAadTokens(null, 'mockConnection', {
                                resourceUrls: ['http://localhost'],
                            }),
                        {
                            message: 'userId cannot be null',
                        }
                    );
                });
                it('should throw on null connectionName', async function () {
                    await assert.rejects(
                        async () =>
                            await tokenApiClient.userToken.getAadTokens(user.id, null, {
                                resourceUrls: ['http://localhost'],
                            }),
                        {
                            message: 'connectionName cannot be null',
                        }
                    );
                });
                it('should return token', async function () {
                    const result = await tokenApiClient.userToken.getAadTokens(user.id, 'slack', {
                        resourceUrls: ['http://localhost'],
                    });
                    assert(result.channelId);
                    assert(result.connectionName);
                    assert(result.token);
                    assert(result.expiration);
                });
            });
            describe('getTokenStatus', function () {
                it('should throw on null userId', async function () {
                    await assert.rejects(async () => await tokenApiClient.userToken.getTokenStatus(null), {
                        message: 'userId cannot be null',
                    });
                });
                it('should return token', async function () {
                    const result = await tokenApiClient.userToken.getTokenStatus(user.id);
                    assert(result.channelId);
                    assert(result.connectionName);
                    assert.notStrictEqual(result.hasToken, null);
                    assert(result.serviceProviderDisplayName);
                });
            });
            describe('signOut', function () {
                it('should throw on null userId', async function () {
                    await assert.rejects(async () => tokenApiClient.userToken.signOut(null), {
                        message: 'userId cannot be null',
                    });
                });
                it('should return a response', async function () {
                    const result = await tokenApiClient.userToken.signOut(user.id);
                    assert(result.body);
                    assert(result._response);
                    assert.equal(result._response.status, 200);
                    assert(result._response.bodyAsText);
                    assert(result._response.parsedBody);
                });
            });
        });
    });
});
