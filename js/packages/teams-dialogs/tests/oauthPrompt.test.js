// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const assert = require('assert');
const { spy } = require('sinon');
const { ok } = require('assert');
const { OAuthPrompt, DialogSet, DialogTurnStatus } = require('../');
const {
    AuthenticationConstants,
    BotFrameworkAuthenticationFactory,
    PasswordServiceClientCredentialFactory,
    SkillValidation,
    ConnectorClient,
} = require('botframework-connector');

const {
    ActionTypes,
    ActivityTypes,
    CardFactory,
    Channels,
    CloudAdapterBase,
    ConversationState,
    InputHints,
    MemoryStorage,
    TestAdapter,
    tokenResponseEventName,
    TurnContext,
    verifyStateOperationName,
} = require('botbuilder-core');

describe('OAuthPrompt', function () {
    it('should call OAuthPrompt', async function () {
        const connectionName = 'myConnection';
        const token = 'abc123';

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {});
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity('Logged in.');
                } else {
                    await turnContext.sendActivity('Failed');
                }
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and OAuthPrompt
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new OAuthPrompt('prompt', {
                connectionName,
                title: 'Login',
                timeout: 300000,
            })
        );

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);
                assert(activity.inputHint === InputHints.AcceptingInput);
                assert(!activity.attachments[0].content.buttons[0].value);

                // send a mock EventActivity back to the bot with the token
                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token);

                const eventActivity = createReply(activity);
                eventActivity.type = ActivityTypes.Event;
                const from = eventActivity.from;
                eventActivity.from = eventActivity.recipient;
                eventActivity.recipient = from;
                eventActivity.name = 'tokens/response';
                eventActivity.value = {
                    connectionName,
                    token,
                };

                adapter.send(eventActivity);
            })
            .assertReply('Logged in.')
            .startTest();
    });

    it('should call OAuthPrompt with code', async function () {
        const connectionName = 'myConnection';
        const token = 'abc123';
        const magicCode = '888999';

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {});
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity('Logged in.');
                } else {
                    await turnContext.sendActivity('Failed');
                }
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and OAuthPrompt
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new OAuthPrompt('prompt', {
                connectionName,
                title: 'Login',
                timeout: 300000,
            })
        );

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
            })
            .send(magicCode)
            .assertReply('Logged in.')
            .startTest();
    });

    it('should timeout OAuthPrompt with message activity', async function () {
        const message = {
            activityId: '1234',
            type: ActivityTypes.message,
        };

        await testTimeout(message);
    });

    it('should timeout OAuthPrompt with tokenResponseEvent activity', async function () {
        const message = {
            activityId: '1234',
            type: ActivityTypes.Event,
            name: tokenResponseEventName,
        };

        await testTimeout(message);
    });

    it('should timeout OAuthPrompt with verifyStateOperation activity', async function () {
        const message = {
            activityId: '1234',
            type: ActivityTypes.Invoke,
            name: verifyStateOperationName,
            channelId: Channels.Msteams,
        };

        await testTimeout(message);
    });

    it('should not timeout OAuthPrompt with custom event activity', async function () {
        const message = {
            activityId: '1234',
            type: ActivityTypes.Event,
            name: 'custom_event_name',
        };

        await testTimeout(message, false, 'Failed', 'Ended');
    });

    it('should end OAuthPrompt on invalid message when endOnInvalidMessage', async function () {
        const connectionName = 'myConnection';
        const token = 'abc123';
        const magicCode = '888999';
        const exchangeToken = 'exch123';

        // Create new ConversationState with MemoryStorage
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and OAuthPrompt
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new OAuthPrompt(
                'prompt',
                {
                    connectionName,
                    title: 'Login',
                    endOnInvalidMessage: true,
                },
                async (prompt) => {
                    if (prompt.recognized.succeeded) {
                        assert(false, 'recognition succeeded but should have failed during test');
                        return true;
                    }

                    return false;
                }
            )
        );

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {});
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result && results.result.token) {
                    await turnContext.sendActivity('Failed');
                } else {
                    await turnContext.sendActivity('Ended');
                }
            }
            await convoState.saveChanges(turnContext);
        });

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
                adapter.addExchangeableToken(
                    connectionName,
                    activity.channelId,
                    activity.recipient.id,
                    exchangeToken,
                    token
                );
            })
            .send('invalid text message here')
            .assertReply('Ended')
            .startTest();
    });

    it('should see attemptCount increment', async function () {
        const connectionName = 'myConnection';
        const token = 'abc123';
        const magicCode = '888999';

        // Create new ConversationState with MemoryStorage
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and OAuthPrompt
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);

        dialogs.add(
            new OAuthPrompt(
                'prompt',
                {
                    connectionName,
                    title: 'Login',
                    timeout: 300000,
                },
                async (prompt) => {
                    if (prompt.recognized.succeeded) {
                        return true;
                    }
                    prompt.context.sendActivity(`attemptCount ${prompt.attemptCount}`);
                    return false;
                }
            )
        );

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { retryPrompt: 'Try again' });
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity('Logged in');
                } else {
                    await turnContext.sendActivity('Failed');
                }
            }
            await convoState.saveChanges(turnContext);
        });

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
            })
            .send('1')
            .assertReply('attemptCount 1')
            .send('12')
            .assertReply('attemptCount 2')
            .send('123')
            .assertReply('attemptCount 3')
            .send(magicCode)
            .assertReply((activity) => {
                assert(activity.text === 'Logged in');

                adapter.signOutUser(
                    new TurnContext(adapter, { channelId: activity.channelId, from: activity.recipient }),
                    connectionName
                );
            })
            .send('Another!')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
            })
            .send('1234')
            .assertReply('attemptCount 1')
            .send('12345')
            .assertReply('attemptCount 2')
            .send('123456')
            .assertReply('attemptCount 3')
            .send(magicCode)
            .assertReply('Logged in')
            .startTest();
    });

    it('should call OAuthPrompt for streaming connection', async function () {
        const connectionName = 'myConnection';
        const token = 'abc123';

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {});
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity('Logged in.');
                } else {
                    await turnContext.sendActivity('Failed');
                }
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and AttachmentPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new OAuthPrompt('prompt', {
                connectionName,
                title: 'Login',
                timeout: 300000,
            })
        );

        const streamingActivity = {
            activityId: '1234',
            channelId: 'directlinespeech',
            serviceUrl: 'urn:botframework.com:websocket:wss://channel.com/blah',
            user: { id: 'user', name: 'User Name' },
            bot: { id: 'bot', name: 'Bot Name' },
            conversation: {
                id: 'convo1',
                properties: {
                    foo: 'bar',
                },
            },
            attachments: [],
            type: 'message',
            text: 'Hello',
        };

        await adapter
            .send(streamingActivity)
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);
                assert(activity.inputHint === InputHints.AcceptingInput);
                assert(activity.attachments[0].content.buttons[0].value);

                // send a mock EventActivity back to the bot with the token
                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token);

                const eventActivity = createReply(activity);
                eventActivity.type = ActivityTypes.Event;
                const from = eventActivity.from;
                eventActivity.from = eventActivity.recipient;
                eventActivity.recipient = from;
                eventActivity.name = 'tokens/response';
                eventActivity.value = {
                    connectionName,
                    token,
                };

                adapter.send(eventActivity);
            })
            .assertReply('Logged in.')
            .startTest();
    });

    describe('static methods', function () {
        describe('sendOAuthCard()', function () {
            class SendActivityAdapter {
                constructor(settings = {}) {
                    // Lazily and forcefully assign all properties and values to SendActivityAdapter instance.
                    Object.assign(this, settings);
                    this.BotIdentityKey = 'BotIdentityKey';
                }

                async getSignInLink(context, connectionName) {
                    assert(context, 'context not passed in to getSignInLink call.');
                    assert(connectionName, 'connectionName not passed in to getSignInLink call.');
                    if (this.connectionName) {
                        assert.strictEqual(connectionName, this.connectionName);
                    }
                    return this.signInLink;
                }

                async getUserToken(context, magicCode) {
                    assert(context, 'context not passed in to getUserToken call.');
                    assert(magicCode, 'magicCode not passed in to getUserToken call');
                    return 'token';
                }

                async getSignInResource(context, connectionName, userId) {
                    assert(context, 'context not passed in to getSignInResource call.');
                    assert(connectionName, 'connectionName not passed in to getSignInResource call');
                    assert(userId, 'userId not passed in to getSignInResource call');
                    return {
                        signInLink: this.signInLink,
                        tokenExchangeResource: this.tokenExchangeResource,
                    };
                }

                async signOutUser() {}
                async exchangeToken() {}
            }

            it("should fail if adapter does not have 'getUserToken'", async function () {
                const fakeAdapter = {};
                const context = new TurnContext(fakeAdapter, {
                    activity: {
                        channelId: Channels.Webchat,
                        serviceUrl: 'https://bing.com',
                    },
                });

                await assert.rejects(
                    OAuthPrompt.sendOAuthCard({}, context),
                    new Error('OAuth prompt is not supported by the current adapter')
                );
            });

            it('should send a well-constructed OAuthCard for channels with OAuthCard support', async function () {
                const connectionName = 'connection';
                const title = 'myTitle';
                const text = 'Sign in here';
                const signInLink = 'https://dev.botframework.com';
                const tokenExchangeResource = {
                    id: 'id',
                    uri: 'some uri',
                };
                const adapter = new SendActivityAdapter({
                    connectionName,
                    signInLink,
                    text,
                    title,
                    tokenExchangeResource,
                });
                const context = new TurnContext(adapter, {
                    channelId: Channels.Webchat,
                    serviceUrl: 'https://bing.com',
                    from: {
                        id: 'someId',
                    },
                });
                // Override sendActivity
                context.sendActivity = async function (activity) {
                    assert.strictEqual(activity.attachments.length, 1);
                    const attachment = activity.attachments[0];
                    assert.strictEqual(attachment.contentType, CardFactory.contentTypes.oauthCard);
                    const card = attachment.content;
                    assert.strictEqual(card.buttons.length, 1);
                    assert.strictEqual(card.connectionName, connectionName);
                    assert.strictEqual(card.text, text);
                    const button = card.buttons[0];
                    assert.strictEqual(button.type, ActionTypes.Signin);
                    assert.strictEqual(button.title, title);
                    // For non streaming activities where the channel supports OAuthCards,
                    // no link should be set on button.value.
                    assert.strictEqual(button.value, undefined);
                }.bind(context);

                await OAuthPrompt.sendOAuthCard({ connectionName, title, text }, context);
            });

            it('should send a well-constructed OAuthCard for channels with OAuthCard support from a skill', async function () {
                const connectionName = 'connection';
                const title = 'myTitle';
                const text = 'Sign in here';
                const signInLink = 'https://dev.botframework.com';
                const tokenExchangeResource = {
                    id: 'id',
                    uri: 'some uri',
                };
                const adapter = new SendActivityAdapter({
                    connectionName,
                    signInLink,
                    text,
                    title,
                    tokenExchangeResource,
                });
                const context = new TurnContext(adapter, {
                    channelId: Channels.Emulator,
                    serviceUrl: 'https://bing.com',
                    from: {
                        id: 'someId',
                    },
                });
                context.turnState.set(
                    adapter.BotIdentityKey,
                    new ClaimsIdentity([
                        { type: 'azp', value: uuid() },
                        { type: 'ver', value: '2.0' },
                        { type: 'aud', value: uuid() },
                    ])
                );
                // Override sendActivity
                context.sendActivity = async function (activity) {
                    assert.strictEqual(activity.attachments.length, 1);
                    const attachment = activity.attachments[0];
                    assert.strictEqual(attachment.contentType, CardFactory.contentTypes.oauthCard);
                    const card = attachment.content;
                    assert.strictEqual(card.buttons.length, 1);
                    assert.strictEqual(card.connectionName, connectionName);
                    assert.strictEqual(card.text, text);
                    const button = card.buttons[0];
                    assert.strictEqual(button.type, ActionTypes.OpenUrl);
                    assert.strictEqual(button.title, title);
                    assert.strictEqual(button.value, signInLink);
                }.bind(context);

                await OAuthPrompt.sendOAuthCard({ connectionName, title, text }, context);
            });

            it('should send a well-constructed OAuthCard for a streaming connection for channels with OAuthCard support', async function () {
                const connectionName = 'connection';
                const title = 'myTitle';
                const text = 'Sign in here';
                const signInLink = 'https://dev.botframework.com';
                const adapter = new SendActivityAdapter({
                    connectionName,
                    signInLink,
                    text,
                    title,
                });
                const context = new TurnContext(adapter, {
                    channelId: Channels.Webchat,
                    serviceUrl: 'wss://bing.com',
                    from: {
                        id: 'someId',
                    },
                });
                // Override sendActivity
                context.sendActivity = async function (activity) {
                    assert.strictEqual(activity.attachments.length, 1);
                    const attachment = activity.attachments[0];
                    assert.strictEqual(attachment.contentType, CardFactory.contentTypes.oauthCard);
                    const card = attachment.content;
                    assert.strictEqual(card.buttons.length, 1);
                    assert.strictEqual(card.connectionName, connectionName);
                    assert.strictEqual(card.text, text);
                    const button = card.buttons[0];
                    assert.strictEqual(button.type, ActionTypes.Signin);
                    assert.strictEqual(button.title, title);
                    // For streaming activities where the channel supports OAuthCards,
                    // a link should be set on button.value.
                    assert.strictEqual(button.value, signInLink);
                }.bind(context);

                await OAuthPrompt.sendOAuthCard({ connectionName, title, text }, context);
            });

            it('should use the passed in activity as a base for the prompt', async function () {
                const connectionName = 'connection';
                const title = 'myTitle';
                const text = 'Sign in here';
                const signInLink = 'https://dev.botframework.com';
                const adapter = new SendActivityAdapter({
                    connectionName,
                    signInLink,
                    text,
                    title,
                });
                const context = new TurnContext(adapter, {
                    channelId: Channels.Webchat,
                    serviceUrl: 'https://bing.com',
                    from: {
                        id: 'someId',
                    },
                });
                context.turnState.set(
                    adapter.BotIdentityKey,
                    new ClaimsIdentity([
                        { type: 'azp', value: uuid() },
                        { type: 'ver', value: '2.0' },
                        { type: 'aud', value: AuthenticationConstants.ToBotFromChannelTokenIssuer },
                    ])
                );
                // Override sendActivity
                context.sendActivity = async function (activity) {
                    assert.strictEqual(activity.value, 1);
                    assert.strictEqual(activity.attachments.length, 1);
                    const attachment = activity.attachments[0];
                    assert.strictEqual(attachment.contentType, CardFactory.contentTypes.oauthCard);
                    const card = attachment.content;
                    assert.strictEqual(card.buttons.length, 1);
                    assert.strictEqual(card.connectionName, connectionName);
                    assert.strictEqual(card.text, text);
                    const button = card.buttons[0];
                    assert.strictEqual(button.type, ActionTypes.Signin);
                    assert.strictEqual(button.title, title);
                    // For non streaming activities where the channel supports OAuthCards,
                    // no link should be set on button.value.
                    assert.strictEqual(button.value, undefined);
                }.bind(context);

                await OAuthPrompt.sendOAuthCard({ connectionName, title, text }, context, { value: 1 });
            });
        });

        describe('recognizeToken()', function () {
            class TestCloudAdapter extends CloudAdapterBase {}

            it('should throw an error during a Token Response Event and adapter is missing "createConnectorClientWithIdentity"', async function () {
                const oAuthPrompt = new OAuthPrompt('OAuthPrompt');
                // Create spy for private instance method called during recognizeToken
                const isTokenResponseEventSpy = spy(OAuthPrompt, 'isTokenResponseEvent');
                isTokenResponseEventSpy.returnValues = [true];

                const adapter = new TestAdapter(async (_context) => {
                    /* no-op */
                });
                const conversationState = new ConversationState(new MemoryStorage());
                const dialogState = conversationState.createProperty('DialogState');
                const dialogSet = new DialogSet(dialogState);
                const dc = await dialogSet.createContext(
                    new TurnContext(adapter, {
                        type: ActivityTypes.Event,
                        name: tokenResponseEventName,
                        conversation: { id: 'conversationId' },
                        channelId: Channels.Test,
                    })
                );
                function setActiveDialog(dc, dialog) {
                    // Create stack if not already there.
                    dc.stack = dc.stack || [];
                    dc.stack.unshift({
                        id: dialog.id,
                        state: {
                            state: {},
                            [dialog.PersistedCaller]: { callerServiceUrl: 'https://test1', scope: 'parent-appId' },
                            options: { prompt: 'Login time' },
                            expires: new Date().getTime() + 900000,
                        },
                    });
                }

                setActiveDialog(dc, oAuthPrompt);

                await assert.rejects(oAuthPrompt.recognizeToken(dc), {
                    message: 'OAuth prompt is not supported by the current adapter',
                });

                ok(isTokenResponseEventSpy.calledOnce, 'isTokenResponseEventSpy called more than once');
            });

            it('should return the correct ConnectorClient instance', async function () {
                const credsFactory = new PasswordServiceClientCredentialFactory('', '');
                const botFrameworkAuthentication = BotFrameworkAuthenticationFactory.create(
                    '',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    credsFactory,
                    { requiredEndorsements: [] }
                );
                const adapter = new TestCloudAdapter(botFrameworkAuthentication);
                const oAuthPrompt = new OAuthPrompt('OAuthPrompt');

                const context = new TurnContext(adapter, {
                    type: ActivityTypes.Event,
                    name: tokenResponseEventName,
                    conversation: { id: 'conversationId' },
                    channelId: Channels.Test,
                });

                // Assign ConnectorFactory to the context state.
                const claimsIdentity = SkillValidation.createAnonymousSkillClaim();
                const connectorFactory = botFrameworkAuthentication.createConnectorFactory(claimsIdentity);
                context.turnState.set(adapter.ConnectorFactoryKey, connectorFactory);

                // Create DialogContext
                const conversationState = new ConversationState(new MemoryStorage());
                const dialogState = conversationState.createProperty('DialogState');
                const dialogSet = new DialogSet(dialogState);
                const dc = await dialogSet.createContext(context);

                function setActiveDialog(dc, dialog) {
                    // Create stack if not already there.
                    dc.stack = dc.stack || [];
                    dc.stack.unshift({
                        id: dialog.id,
                        state: {
                            state: {},
                            [dialog.PersistedCaller]: {
                                callerServiceUrl: 'https://test1',
                                scope: 'parent-appId',
                            },
                            options: { prompt: 'Login time' },
                            expires: new Date().getTime() + 900000,
                        },
                    });
                }

                setActiveDialog(dc, oAuthPrompt);
                await oAuthPrompt.recognizeToken(dc);
                const connectorClient = dc.context.turnState.get(adapter.ConnectorClientKey);

                assert.ok(connectorClient instanceof ConnectorClient, 'ConnectorClient was not created properly');
            });

            it('should throw when UserTokenClient is found instead of ConnectorFactory in the context.turnState', async function () {
                const credsFactory = new PasswordServiceClientCredentialFactory('', '');
                const botFrameworkAuthentication = BotFrameworkAuthenticationFactory.create(
                    '',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    credsFactory,
                    { requiredEndorsements: [] }
                );
                const adapter = new TestCloudAdapter(botFrameworkAuthentication);
                const oAuthPrompt = new OAuthPrompt('OAuthPrompt');

                const context = new TurnContext(adapter, {
                    type: ActivityTypes.Event,
                    name: tokenResponseEventName,
                    conversation: { id: 'conversationId' },
                    channelId: Channels.Test,
                });

                // Assign UserTokenClient to the context state.
                const claimsIdentity = SkillValidation.createAnonymousSkillClaim();
                const userTokenClient = await botFrameworkAuthentication.createUserTokenClient(claimsIdentity);
                context.turnState.set(adapter.UserTokenClientKey, userTokenClient);

                // Create DialogContext
                const conversationState = new ConversationState(new MemoryStorage());
                const dialogState = conversationState.createProperty('DialogState');
                const dialogSet = new DialogSet(dialogState);
                const dc = await dialogSet.createContext(context);

                function setActiveDialog(dc, dialog) {
                    // Create stack if not already there.
                    dc.stack = dc.stack || [];
                    dc.stack.unshift({
                        id: dialog.id,
                        state: {
                            state: {},
                            [dialog.PersistedCaller]: {
                                callerServiceUrl: 'https://test1',
                                scope: 'parent-appId',
                            },
                            options: { prompt: 'Login time' },
                            expires: new Date().getTime() + 900000,
                        },
                    });
                }

                setActiveDialog(dc, oAuthPrompt);
                await assert.rejects(oAuthPrompt.recognizeToken(dc), {
                    message: 'OAuth prompt is not supported by the current adapter',
                });
            });
        });
    });

    describe('OAuthPrompt sas url present in OAuthCard', function () {
        const connectionName = 'myConnection';

        it('TestAdapter with no sas url', async function () {
            //Create new ConversationState with MemoryStorage
            const convoState = new ConversationState(new MemoryStorage());
            //Create a DialogState property, DialogSet and OAuthPrompt
            const dialogState = convoState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(
                new OAuthPrompt('OAuthPrompt', {
                    connectionName,
                    title: 'Sign in',
                    timeout: 30000,
                    text: 'Please sign in',
                })
            );

            const adapter = new TestAdapter(async (turnContext) => {
                const dc = await dialogs.createContext(turnContext);
                const results = await dc.continueDialog();
                if (results.status === DialogTurnStatus.empty) {
                    await dc.prompt('OAuthPrompt', {});
                }
                await convoState.saveChanges(turnContext);
            });

            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);
                    const oAuthCard = activity.attachments[0].content;
                    assert(!oAuthCard.tokenPostResource);
                    assert(oAuthCard.tokenExchangeResource);
                })
                .startTest();
        });

        it('SignInTestAdapter with sas url', async function () {
            //Create new ConversationState with MemoryStorage
            const convoState = new ConversationState(new MemoryStorage());
            //Create a DialogState property, DialogSet and OAuthPrompt
            const dialogState = convoState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(
                new OAuthPrompt('OAuthPrompt', {
                    connectionName,
                    title: 'Sign in',
                    timeout: 30000,
                    text: 'Please sign in',
                })
            );

            const adapter = new SignInTestAdapter(async (turnContext) => {
                const dc = await dialogs.createContext(turnContext);
                const results = await dc.continueDialog();
                if (results.status === DialogTurnStatus.empty) {
                    await dc.prompt('OAuthPrompt', {});
                }
                await convoState.saveChanges(turnContext);
            });

            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);
                    const oAuthCard = activity.attachments[0].content;
                    assert(oAuthCard.tokenPostResource);
                    assert(oAuthCard.tokenPostResource.sasUrl);
                    assert(oAuthCard.tokenExchangeResource);
                })
                .startTest();
        });
    });

    describe('Test Adapter should be able to exchange tokens for uri and token', function () {
        let adapter;
        const connectionName = 'myConnection';
        const exchangeToken = 'exch123';
        const token = 'abc123';
        this.beforeEach(function () {
            adapter = new TestAdapter(async (turnContext) => {
                const userId = 'blah';
                adapter.addExchangeableToken(
                    connectionName,
                    turnContext.activity.channelId,
                    userId,
                    exchangeToken,
                    token
                );

                // Positive case: Token
                let result = await adapter.exchangeToken(turnContext, connectionName, userId, { token: exchangeToken });
                assert(result);
                assert.strictEqual(result.token, token);
                assert.strictEqual(result.connectionName, connectionName);
                // Positive case: URI
                result = await adapter.exchangeToken(turnContext, connectionName, userId, { uri: exchangeToken });
                assert(result);
                assert.strictEqual(result.token, token);
                assert.strictEqual(result.connectionName, connectionName);
                // Negative case: Token
                result = await adapter.exchangeToken(turnContext, connectionName, userId, { token: 'beepboop' });
                assert(result === null);
                // Negative case: URI
                result = await adapter.exchangeToken(turnContext, connectionName, userId, { uri: 'beepboop' });
                assert(result === null);
            });
        });

        it('Test adapter should be able to perform token exchanges for token', async function () {
            await adapter.send('hello').startTest();
        });
    });

    describe('OAuthPrompt should be able to exchange tokens', function () {
        let adapter;
        const connectionName = 'myConnection';
        const exchangeToken = 'exch123';
        const token = 'abc123';
        this.beforeEach(function () {
            // Initialize TestAdapter
            adapter = new TestAdapter(async (turnContext) => {
                const dc = await dialogs.createContext(turnContext);
                const results = await dc.continueDialog();
                if (results.status === DialogTurnStatus.empty) {
                    await dc.prompt('OAuthPrompt', {});
                } else if (results.status === DialogTurnStatus.complete) {
                    if (results.result.token) {
                        await turnContext.sendActivity('Logged in.');
                    } else {
                        await turnContext.sendActivity('Failed');
                    }
                }
                await convoState.saveChanges(turnContext);
            });

            //Create new ConversationState with MemoryStorage
            const convoState = new ConversationState(new MemoryStorage());

            //Create a DialogState property, DialogSet and OAuthPrompt
            const dialogState = convoState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);

            dialogs.add(
                new OAuthPrompt('OAuthPrompt', {
                    connectionName,
                    title: 'Sign in',
                    timeout: 30000,
                    text: 'Please sign in',
                })
            );
        });

        it('Should handle token exchange invoke requests via OAuthPrompt', async function () {
            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);

                    // Add an exchangeable token to the adapter
                    adapter.addExchangeableToken(
                        connectionName,
                        activity.channelId,
                        activity.recipient.id,
                        exchangeToken,
                        token
                    );
                })
                .send({
                    type: ActivityTypes.Invoke,
                    name: 'signin/tokenExchange',
                    value: {
                        id: null,
                        connectionName: connectionName,
                        token: exchangeToken,
                    },
                })
                .assertReply((a) => {
                    assert.strictEqual('invokeResponse', a.type);
                    assert(a.value);
                    assert.strictEqual(a.value.status, 200);
                    assert.strictEqual(a.value.body.connectionName, connectionName);
                    assert(a.value.body.failureDetail === null);
                })
                .assertReply('Logged in.')
                .startTest();
        });

        it('Should reject token exchange requests if token cannot be exchanged', async function () {
            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);

                    // No exchangeable token is added to the adapter
                })
                .send({
                    type: ActivityTypes.Invoke,
                    name: 'signin/tokenExchange',
                    value: {
                        id: null,
                        connectionName: connectionName,
                        token: exchangeToken,
                    },
                })
                .assertReply((a) => {
                    assert.strictEqual('invokeResponse', a.type);
                    assert(a.value);
                    assert.strictEqual(a.value.status, 412);
                    assert(a.value.body.failureDetail);
                })
                .startTest();
        });

        it('Should reject token exhchange requests with no body', async function () {
            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);

                    // No exchangeable token is added to the adapter
                })
                .send({
                    type: ActivityTypes.Invoke,
                    name: 'signin/tokenExchange',
                    //no body is sent
                })
                .assertReply((a) => {
                    assert.strictEqual('invokeResponse', a.type);
                    assert(a.value);
                    assert.strictEqual(a.value.status, 400);
                    assert(a.value.body.failureDetail);
                })
                .startTest();
        });

        it('Should reject token exhchange requests with wrong connection name', async function () {
            await adapter
                .send('hello')
                .assertReply((activity) => {
                    assert.strictEqual(activity.attachments.length, 1);
                    assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                    assert(activity.inputHint === InputHints.AcceptingInput);

                    // No exchangeable token is added to the adapter
                })
                .send({
                    type: ActivityTypes.Invoke,
                    name: 'signin/tokenExchange',
                    value: {
                        id: null,
                        connectionName: 'foobar',
                        token: exchangeToken,
                    },
                })
                .assertReply((a) => {
                    assert.strictEqual('invokeResponse', a.type);
                    assert(a.value);
                    assert.strictEqual(a.value.status, 400);
                    assert.strictEqual(a.value.body.connectionName, connectionName);
                    assert(a.value.body.failureDetail);
                })
                .startTest();
        });
    });

    describe('OAuthPrompt signin link settings', function () {
        let adapter;
        const testCases = [
            { showSignInLinkValue: null, channelId: Channels.Test, shouldHaveSignInLink: false },
            { showSignInLinkValue: null, channelId: Channels.Msteams, shouldHaveSignInLink: true },
            { showSignInLinkValue: false, channelId: Channels.Test, shouldHaveSignInLink: false },
            { showSignInLinkValue: true, channelId: Channels.Test, shouldHaveSignInLink: true },
            { showSignInLinkValue: false, channelId: Channels.Msteams, shouldHaveSignInLink: false },
            { showSignInLinkValue: true, channelId: Channels.Msteams, shouldHaveSignInLink: true },
        ];

        testCases.forEach((testCase) => {
            const test = testCase.shouldHaveSignInLink ? 'show sign in link' : 'not show sign in link';
            it(`Should ${test} for '${testCase.channelId}' channel and showSignInLink set to ${testCase.showSignInLinkValue}`, async function () {
                const oAuthPromptSettings = {
                    showSignInLink: testCase.showSignInLinkValue,
                };

                adapter = new TestAdapter(async (turnContext) => {
                    const dc = await dialogs.createContext(turnContext);
                    const results = await dc.continueDialog();
                    if (results.status === DialogTurnStatus.empty) {
                        await dc.prompt('OAuthPrompt', {});
                    }
                    await convoState.saveChanges(turnContext);
                });

                //Create new ConversationState with MemoryStorage
                const convoState = new ConversationState(new MemoryStorage());

                //Create a DialogState property, DialogSet and OAuthPrompt
                const dialogState = convoState.createProperty('dialogState');
                const dialogs = new DialogSet(dialogState);

                dialogs.add(new OAuthPrompt('OAuthPrompt', oAuthPromptSettings));

                const initialActivity = {
                    channelId: testCase.channelId,
                    text: 'hello',
                };

                await adapter
                    .send(initialActivity)
                    .assertReply((activity) => {
                        assert.strictEqual(activity.attachments.length, 1);
                        assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
                        const oAuthCard = activity.attachments[0].content;
                        const cardAction = oAuthCard.buttons[0];
                        assert.strictEqual(testCase.shouldHaveSignInLink, cardAction.value != null);
                    })
                    .startTest();
            });
        });
    });
});

function createReply(activity) {
    return {
        type: ActivityTypes.Message,
        from: { id: activity.recipient.id, name: activity.recipient.name },
        recipient: { id: activity.from.id, name: activity.from.name },
        replyToId: activity.id,
        serviceUrl: activity.serviceUrl,
        channelId: activity.channelId,
        conversation: {
            isGroup: activity.conversation.isGroup,
            id: activity.conversation.id,
            name: activity.conversation.name,
        },
    };
}

class ClaimsIdentity {
    /**w
     * Each claim should be { type: 'type', value: 'value' }
     *
     * @param {*} claims The claims with which to populate the claims identity.
     * @param {*} isAuthenticated True if the identity has been authenticated; otherwise, false.
     */
    constructor(claims = [], isAuthenticated = false) {
        this.claims = claims;
        this.isAuthenticated = isAuthenticated;
    }

    getClaimValue(claimType) {
        const claim = this.claims.find((c) => c.type === claimType);

        return claim ? claim.value : null;
    }
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function testTimeout(
    oauthPromptActivity,
    shouldSucceed = true,
    tokenResponse = 'Failed',
    noTokenResponse = 'Ended'
) {
    const connectionName = 'myConnection';
    const token = 'abc123';
    const magicCode = '888999';
    const exchangeToken = 'exch123';

    // Create new ConversationState with MemoryStorage
    const convoState = new ConversationState(new MemoryStorage());

    // Create a DialogState property, DialogSet and OAuthPrompt
    const dialogState = convoState.createProperty('dialogState');
    const dialogs = new DialogSet(dialogState);
    dialogs.add(
        new OAuthPrompt(
            'prompt',
            {
                connectionName,
                title: 'Login',
                timeout: -1,
            },
            (prompt) => {
                if (prompt.recognized.succeeded) {
                    assert(shouldSucceed, 'recognition succeeded but should have failed during testTimeout');
                    return true;
                }

                assert(!shouldSucceed, 'recognition failed during testTimeout');
                return false;
            }
        )
    );

    const adapter = new TestAdapter(async (turnContext) => {
        const dc = await dialogs.createContext(turnContext);

        if (!oauthPromptActivity.conversation) {
            oauthPromptActivity.conversation = turnContext.activity.conversation;
            oauthPromptActivity.recipient = turnContext.activity.recipient;
            oauthPromptActivity.from = turnContext.activity.from;
            oauthPromptActivity.serviceUrl = turnContext.activity.serviceUrl;
            oauthPromptActivity.channelId = turnContext.activity.channelId;
        }

        const results = await dc.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dc.prompt('prompt', {});
        } else if (
            results.status === DialogTurnStatus.complete ||
            (results.status === DialogTurnStatus.waiting && !shouldSucceed)
        ) {
            if (results.result && results.result.token) {
                await turnContext.sendActivity(tokenResponse);
            } else {
                await turnContext.sendActivity(noTokenResponse);
            }
        }
        await convoState.saveChanges(turnContext);
    });

    await adapter
        .send('Hello')
        .assertReply((activity) => {
            assert(activity.attachments.length === 1);
            assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

            adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
            adapter.addExchangeableToken(
                connectionName,
                activity.channelId,
                activity.recipient.id,
                exchangeToken,
                token
            );
        })
        .send(oauthPromptActivity)
        .assertReply(noTokenResponse)
        .startTest();
}
/**
 * Sign in test adapter used for unit tests. This adapter can be used to simulate sending messages from the
 * user to the bot.
 *
 * @remarks
 * The following example sets up the test adapter and then executes a simple test:
 *
 * ```JavaScript
 * const { TestAdapter } = require('botbuilder');
 *
 * const adapter = new TestAdapter(async (context) => {
 *      await context.sendActivity(`Hello World`);
 * });
 *
 * adapter.test(`hi`, `Hello World`)
 *        .then(() => done());
 * ```
 */
class SignInTestAdapter extends TestAdapter {
    /**
     * Gets a sign-in resource.
     *
     * @param turnContext [TurnContext](xref:botbuilder-core.TurnContext) for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId User ID
     * @param finalRedirect Final redirect URL.
     * @returns A `Promise` with a new [SignInUrlResponse](xref:botframework-schema.SignInUrlResponse) object.
     */
    async getSignInResource(turnContext, connectionName, userId, finalRedirect = null) {
        const result = await super.getSignInResource(turnContext, connectionName, userId, finalRedirect);
        result.tokenPostResource = { sasUrl: `https://www.fakesas.com/${connectionName}/${userId}` };
        return result;
    }
}
