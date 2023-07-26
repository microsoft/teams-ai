const assert = require('assert');
const { createHash } = require('crypto');
const {
    ActivityTypes,
    CardFactory,
    Channels,
    ConversationState,
    DeliveryModes,
    MemoryStorage,
    MessageFactory,
    TestAdapter,
    SkillConversationIdFactoryBase,
    StatusCodes,
    TurnContext,
    AutoSaveStateMiddleware,
} = require('botbuilder-core');
const { spy, stub } = require('sinon');
const { Dialog, DialogTurnStatus, SkillDialog, DialogSet } = require('../');

const DEFAULT_OAUTHSCOPE = 'https://api.botframework.com';

describe('SkillDialog', function () {
    this.timeout(3000);

    describe('beginDialog should call skill', function () {
        let BOTBUILDER = null;
        let BOTBUILDER_TESTING = null;
        // Use botbuilder for tests
        try {
            BOTBUILDER = require('../../botbuilder');
            BOTBUILDER_TESTING = require('../../botbuilder-testing');
        } catch (_err) {
            console.warn(
                '=====\nUnable to load botbuilder or botbuilder-testing module. "beginDialog should call skill" tests will not be run.\n'
            );
        }

        const { DialogTestClient } = BOTBUILDER_TESTING;

        /**
         * @remarks
         * Port of BeginDialogShouldCallSkill from C#
         * https://github.com/microsoft/botbuilder-dotnet/blob/41120728b22c709ec2d9247393505fdc778b2de1/tests/Microsoft.Bot.Builder.Dialogs.Tests/SkillDialogTests.cs#L47-L49
         * @param {string} deliveryMode The delivery mode to test.
         */
        async function beginDialogShouldCallSkill(deliveryMode, useCreateSkillConversationId = false) {
            let activitySent; // Activity
            let fromBotIdSent; // string
            let toBotIdSent; // string
            let toUriSent; // string (URI)

            // Callback to capture the parameters sent to the skill
            const captureAction = (fromBotId, toBotId, toUri, serviceUrl, conversationId, activity) => {
                // Capture values sent to the skill so we can assert the right parameters were used.
                fromBotIdSent = fromBotId;
                toBotIdSent = toBotId;
                toUriSent = toUri;
                activitySent = activity;
            };

            // Create BotFrameworkHttpClient and postActivityStub
            const [skillClient, postActivityStub] = createSkillClientAndStub(captureAction);

            // Use Memory for conversation state
            const conversationState = new ConversationState(new MemoryStorage());
            const dialogOptions = createSkillDialogOptions(
                conversationState,
                skillClient,
                undefined,
                useCreateSkillConversationId
            );

            let createSkillConversationIdSpy;
            if (useCreateSkillConversationId) {
                createSkillConversationIdSpy = spy(dialogOptions.conversationIdFactory, 'createSkillConversationId');
            }

            // Create the SkillDialogInstance and the activity to send.
            const dialog = new SkillDialog(dialogOptions, 'SkillDialog');
            const activityToSend = { type: ActivityTypes.Message, attachments: [], entities: [] }; // Activity.CreateMessageActivity()
            activityToSend.deliveryMode = deliveryMode;
            const activityToSendText = 'activityToSendText';
            activityToSend.text = activityToSendText;
            const client = new DialogTestClient(
                Channels.Test,
                dialog,
                { activity: activityToSend },
                undefined,
                conversationState
            );

            assert.strictEqual(dialogOptions.conversationIdFactory.createCount, 0);

            // Send something to the dialog to start it
            await client.sendActivity('irrelevant');

            // Assert results and data sent to the SkillClient for first turn
            assert.strictEqual(fromBotIdSent, dialogOptions.botId);
            assert.strictEqual(toBotIdSent, dialogOptions.skill.appId);
            assert.strictEqual(toUriSent, dialogOptions.skill.skillEndpoint);
            assert.strictEqual(activitySent.text, activityToSendText);
            assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.waiting);
            assert.ok(postActivityStub.calledOnce);

            // Send a second message to continue the dialog
            await client.sendActivity('Second message');

            // Assert results for second turn
            assert.strictEqual(activitySent.text, 'Second message');
            assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.waiting);
            assert.ok(postActivityStub.calledTwice);

            // Send EndOfConversation to the dialog
            await client.sendActivity({ type: ActivityTypes.EndOfConversation }); // Activity.CreateEndOfConversationActivity()

            // Assert we are done.
            assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.complete);
            assert.ok(postActivityStub.calledTwice);

            if (useCreateSkillConversationId) {
                assert.ok(createSkillConversationIdSpy.called);
            }
            assert.strictEqual(
                await dialogOptions.conversationIdFactory.getSkillConversationReference('Convo1'),
                undefined,
                'no test should use TestAdapter ConversationId as SkillConversationId.'
            );
            assert.strictEqual(
                await dialogOptions.conversationIdFactory.getSkillConversationReference(undefined),
                undefined,
                'no test should use TestAdapter ConversationId as SkillConversationId.'
            );
        }

        if (BOTBUILDER !== null && BOTBUILDER_TESTING !== null) {
            it('should delete conversation from conversationIdFactory when receiving EndOfConversation from skill and ExpectReplies is true', async function () {
                const adapter = new TestAdapter(/* logic param not required */);

                const activity = {
                    type: ActivityTypes.Message,
                    deliveryMode: DeliveryModes.ExpectReplies,
                    channelId: Channels.Directline,
                    conversation: { id: '1' },
                };
                const context = new TurnContext(adapter, activity);
                context.turnState.set(adapter.OAuthScopeKey, DEFAULT_OAUTHSCOPE);

                // Create BotFrameworkHttpClient and postActivityStub
                const expectedReply = { type: ActivityTypes.EndOfConversation, attachments: [], entities: [] };
                const expectedReplies = { activities: [expectedReply] };
                const [skillClient] = createSkillClientAndStub(
                    () => {
                        return;
                    },
                    undefined,
                    expectedReplies
                );
                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient, undefined, false);

                const dialog = new SkillDialog(dialogOptions, 'SkillDialog');
                dialog.state = {};
                const dialogState = conversationState.createProperty('dialogState');
                const dialogs = new DialogSet(dialogState);
                dialogs.add(dialog);
                const dc = await dialogs.createContext(context);
                dc.stack = [dialog];

                await dialog.beginDialog(dc, { activity });

                assert.strictEqual(1, dialogOptions.conversationIdFactory.createCount);
                assert.strictEqual(0, dialogOptions.conversationIdFactory._conversationRefs.size);
            });

            // "Data Rows"
            it('when deliveryMode is undefined', async function () {
                await beginDialogShouldCallSkill();
            });

            it('when deliveryMode is DeliveryModes.ExpectReplies', async function () {
                await beginDialogShouldCallSkill(DeliveryModes.ExpectReplies);
            });

            it('calls createSkillConversationId if createSkillConversationIdWithOptions is not implemented', async function () {
                await beginDialogShouldCallSkill(DeliveryModes.ExpectReplies, true);
            });

            it('and handle Invoke activities', async function () {
                let activitySent; // Activity
                let fromBotIdSent; // string
                let toBotIdSent; // string
                let toUriSent; // string (URI)

                // Callback to capture the parameters sent to the skill
                function captureAction(fromBotId, toBotId, toUri, serviceUrl, conversationId, activity) {
                    // Capture values sent to the skill so we can assert the right parameters were used.
                    fromBotIdSent = fromBotId;
                    toBotIdSent = toBotId;
                    toUriSent = toUri;
                    activitySent = activity;
                }

                // Create BotFrameworkHttpClient and postActivityStub
                const [skillClient, postActivityStub] = createSkillClientAndStub(captureAction);

                // Use Memory for conversation state
                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient);

                // Create the SkillDialogInstance and the activity to send.
                const dialog = new SkillDialog(dialogOptions, 'SkillDialog');
                const activityToSend = { type: ActivityTypes.Invoke }; // Activity.CreateInvokeActivity()
                const activityToSendName = 'activityToSendName';
                activityToSend.name = activityToSendName;
                const client = new DialogTestClient(
                    Channels.Test,
                    dialog,
                    { activity: activityToSend },
                    undefined,
                    conversationState
                );

                assert.strictEqual(dialogOptions.conversationIdFactory.createCount, 0);

                // Send something to the dialog to start it
                await client.sendActivity('irrelevant');

                // Assert results and data sent to the SkillClient for first turn
                assert.strictEqual(dialogOptions.conversationIdFactory.createCount, 1);
                assert.strictEqual(fromBotIdSent, dialogOptions.botId);
                assert.strictEqual(toBotIdSent, dialogOptions.skill.appId);
                assert.strictEqual(toUriSent, dialogOptions.skill.skillEndpoint);
                assert.strictEqual(activitySent.name, activityToSendName);
                assert.strictEqual(activitySent.deliveryMode, DeliveryModes.ExpectReplies);
                assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.waiting);
                assert.ok(postActivityStub.calledOnce);

                // Send a second message to continue the dialog
                await client.sendActivity('Second message');
                assert.strictEqual(dialogOptions.conversationIdFactory.createCount, 1);

                // Assert results for second turn
                assert.strictEqual(activitySent.text, 'Second message');
                assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.waiting);
                assert.ok(postActivityStub.calledTwice);

                // Send EndOfConversation to the dialog
                await client.sendActivity({ type: ActivityTypes.EndOfConversation }); // Activity.CreateEndOfConversationActivity()

                // Assert we are done.
                assert.strictEqual(client.dialogTurnResult.status, DialogTurnStatus.complete);
                assert.ok(postActivityStub.calledTwice);
            });
        }
    });

    it('repromptDialog() should call sendToSkill()', async function () {
        const adapter = new TestAdapter(/* logic param not required */);
        const context = new TurnContext(adapter, { type: ActivityTypes.Message, id: 'activity-id' });
        context.turnState.set(adapter.OAuthScopeKey, DEFAULT_OAUTHSCOPE);
        const dialog = new SkillDialog({}, 'SkillDialog');

        let sendToSkillCalled = false;
        dialog.sendToSkill = () => {
            sendToSkillCalled = true;
        };

        await dialog.repromptDialog(context, {});
        assert.ok(sendToSkillCalled, 'sendToSkill not called');
    });

    it('resumeDialog() should call repromptDialog()', async function () {
        const adapter = new TestAdapter(/* logic param not required */);
        const context = new TurnContext(adapter, { type: ActivityTypes.Message, id: 'activity-id' });
        context.turnState.set(adapter.OAuthScopeKey, DEFAULT_OAUTHSCOPE);
        const dialog = new SkillDialog({}, 'SkillDialog');

        let repromptDialogCalled = false;
        dialog.repromptDialog = () => {
            repromptDialogCalled = true;
        };

        const result = await dialog.resumeDialog(context, {});
        assert.ok(repromptDialogCalled, 'sendToSkill not called');
        assert.strictEqual(result, Dialog.EndOfTurn);
    });

    describe('(private) validateBeginDialogArgs()', function () {
        it('should fail if options is falsy', function () {
            const activity = {
                type: ActivityTypes.Message,
                text: 'Hello SkillDialog!',
            };
            const dialog = new SkillDialog({}, 'SkillDialog');
            const validatedArgs = dialog.validateBeginDialogArgs({ activity });
            const validatedActivity = validatedArgs.activity;
            assert.strictEqual(validatedActivity.type, ActivityTypes.Message);
            assert.strictEqual(validatedActivity.text, 'Hello SkillDialog!');
        });

        it('should fail if options is falsy', function () {
            const dialog = new SkillDialog({}, 'SkillDialog');
            assert.throws(() => dialog.validateBeginDialogArgs(), new TypeError('Missing options parameter'));
        });

        it('should fail if dialogArgs.activity is falsy', function () {
            const dialog = new SkillDialog({}, 'SkillDialog');
            assert.throws(
                () => dialog.validateBeginDialogArgs({}),
                new TypeError('"activity" is undefined or null in options.')
            );
        });
    });

    describe('(private) sendToSkill()', function () {
        it('should rethrow the error if its message is not "Not Implemented" error', async function () {
            const adapter = new TestAdapter(/* logic param not required */);
            const activity = { type: ActivityTypes.Message, channelId: Channels.Directline, conversation: { id: '1' } };
            const context = new TurnContext(adapter, activity);
            context.turnState.set(adapter.OAuthScopeKey, DEFAULT_OAUTHSCOPE);
            const dialog = new SkillDialog(
                {
                    botId: 'botId',
                    conversationIdFactory: {
                        createSkillConversationIdWithOptions: async () => {
                            throw new Error('Whoops');
                        },
                    },
                    conversationState: {},
                    skill: {},
                    skillHostEndpoint: 'http://localhost:3980/api/messages',
                },
                'SkillDialog'
            );
            dialog.state = {};

            const conversationState = new ConversationState(new MemoryStorage());
            const dialogState = conversationState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(dialog);
            const dc = await dialogs.createContext(context);
            dc.stack = [dialog];
            await assert.rejects(dialog.beginDialog(dc, { activity }), new Error('Whoops'));
        });

        it('should not rethrow if Error.message is "Not Implemented"', async function () {
            const adapter = new TestAdapter(/* logic param not required */);
            const activity = { type: ActivityTypes.Message, channelId: Channels.Directline, conversation: { id: '1' } };
            const context = new TurnContext(adapter, activity);
            context.turnState.set(adapter.OAuthScopeKey, DEFAULT_OAUTHSCOPE);
            const dialog = new SkillDialog(
                {
                    botId: 'botId',
                    conversationIdFactory: {
                        createSkillConversationIdWithOptions: async () => {
                            throw new Error('Not Implemented');
                        },
                        createSkillConversationId: async () => {},
                    },
                    conversationState: {
                        saveChanges: () => null,
                    },
                    skill: {},
                    skillHostEndpoint: 'http://localhost:3980/api/messages',
                    skillClient: {
                        postActivity: async () => {
                            return { status: 200 };
                        },
                    },
                },
                'SkillDialog'
            );

            dialog.state = {};

            const conversationState = new ConversationState(new MemoryStorage());
            const dialogState = conversationState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(dialog);
            const dc = await dialogs.createContext(context);
            dc.stack = [dialog];

            const result = await dialog.beginDialog(dc, { activity });
            assert.strictEqual(result.status, 'waiting');
        });
    });

    describe('intercepting OAuthCards', function () {
        let BOTBUILDER = null;
        let BOTBUILDER_TESTING = null;
        // Use botbuilder for tests
        try {
            BOTBUILDER = require('../../botbuilder');
            BOTBUILDER_TESTING = require('../../botbuilder-testing');
        } catch (_err) {
            console.warn('=====\nUnable to load botbuilder module. "intercepting OAuthCards" tests will not be run.\n');
        }

        if (BOTBUILDER !== null && BOTBUILDER_TESTING !== null) {
            const { BotFrameworkHttpClient } = BOTBUILDER;
            const { DialogTestClient } = BOTBUILDER_TESTING;

            it('should intercept OAuthCards for SSO', async function () {
                const connectionName = 'connectionName';
                const firstResponse = { activities: [createOAuthCardAttachmentActivity('https://test')] };
                const skillClient = new BotFrameworkHttpClient({});
                const postActivityStub = stub(skillClient, 'postActivity');
                postActivityStub.onFirstCall().returns(Promise.resolve({ status: 200, body: firstResponse }));
                postActivityStub.onSecondCall().returns(Promise.resolve({ status: 200 }));

                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient, connectionName);

                const dialogUnderTest = new SkillDialog(dialogOptions, 'skillDialog');
                const sendTokenExchangeSpy = spy(dialogUnderTest, 'sendTokenExchangeInvokeToSkill');
                const activityToSend = createSendActivity();
                const beginSkillDialogOptions = { activity: activityToSend };

                const client = new DialogTestClient(
                    Channels.Test,
                    dialogUnderTest,
                    beginSkillDialogOptions,
                    [new AutoSaveStateMiddleware(conversationState)],
                    conversationState
                );
                client._testAdapter.addExchangeableToken(
                    connectionName,
                    Channels.Test,
                    'user1',
                    'https://test',
                    'https://test1'
                );

                const finalActivity = await client.sendActivity('irrelevant');
                assert.ok(sendTokenExchangeSpy.calledOnce);
                assert.strictEqual(finalActivity, undefined);
            });

            it('should not intercept OAuthCards for empty ConnectionName', async function () {
                const connectionName = 'connectionName';
                const firstResponse = { activities: [createOAuthCardAttachmentActivity('https://test')] };
                const skillClient = new BotFrameworkHttpClient({});
                const postActivityStub = stub(skillClient, 'postActivity');
                postActivityStub.onFirstCall().returns({ status: 200, body: firstResponse });

                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient);

                const dialogUnderTest = new SkillDialog(dialogOptions, 'skillDialog');
                const sendTokenExchangeSpy = spy(dialogUnderTest, 'sendTokenExchangeInvokeToSkill');
                const activityToSend = createSendActivity();
                const beginSkillDialogOptions = { activity: activityToSend };

                const client = new DialogTestClient(
                    Channels.Test,
                    dialogUnderTest,
                    beginSkillDialogOptions,
                    [new AutoSaveStateMiddleware(conversationState)],
                    conversationState
                );
                client._testAdapter.addExchangeableToken(
                    connectionName,
                    Channels.Test,
                    'user1',
                    'https://test',
                    'https://test1'
                );

                const finalActivity = await client.sendActivity('irrelevant');
                assert.ok(sendTokenExchangeSpy.notCalled);
                assert.ok(finalActivity !== undefined);
                assert.strictEqual(finalActivity.attachments.length, 1);
            });

            it('should not intercept OAuthCards for EmptyToken', async function () {
                const firstResponse = { activities: [createOAuthCardAttachmentActivity('https://test')] };
                const skillClient = new BotFrameworkHttpClient({});
                const postActivityStub = stub(skillClient, 'postActivity');
                postActivityStub.onFirstCall().returns({ status: 200, body: firstResponse });

                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient);

                const dialogUnderTest = new SkillDialog(dialogOptions, 'skillDialog');
                const sendTokenExchangeSpy = spy(dialogUnderTest, 'sendTokenExchangeInvokeToSkill');
                const activityToSend = createSendActivity();
                const beginSkillDialogOptions = { activity: activityToSend };

                const client = new DialogTestClient(
                    Channels.Test,
                    dialogUnderTest,
                    beginSkillDialogOptions,
                    [new AutoSaveStateMiddleware(conversationState)],
                    conversationState
                );
                // dont add exchangeable token to test adapter
                const finalActivity = await client.sendActivity('irrelevant');

                assert.ok(sendTokenExchangeSpy.notCalled);
                assert.ok(finalActivity !== undefined);
                assert.strictEqual(finalActivity.attachments.length, 1);
            });

            it('should not intercept OAuthCards for TokenException', async function () {
                const connectionName = 'connectionName';
                const firstResponse = { activities: [createOAuthCardAttachmentActivity('https://test')] };
                const skillClient = new BotFrameworkHttpClient({});
                const postActivityStub = stub(skillClient, 'postActivity');
                postActivityStub.onFirstCall().returns({ status: 200, body: firstResponse });

                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient, connectionName);

                const dialogUnderTest = new SkillDialog(dialogOptions, 'skillDialog');
                const sendTokenExchangeSpy = spy(dialogUnderTest, 'sendTokenExchangeInvokeToSkill');
                const activityToSend = createSendActivity();
                const beginSkillDialogOptions = { activity: activityToSend };

                const client = new DialogTestClient(
                    Channels.Test,
                    dialogUnderTest,
                    beginSkillDialogOptions,
                    [new AutoSaveStateMiddleware(conversationState)],
                    conversationState
                );
                client._testAdapter.addExchangeableToken(connectionName, Channels.Test, 'user1', 'https://test');

                const finalActivity = await client.sendActivity({ text: 'irrelevant' });
                assert.ok(sendTokenExchangeSpy.notCalled);
                assert.ok(finalActivity !== undefined);
                assert.strictEqual(finalActivity.attachments.length, 1);
            });

            it('should not intercept OAuthCards for BadRequest', async function () {
                const connectionName = 'connectionName';
                const firstResponse = { activities: [createOAuthCardAttachmentActivity('https://test')] };
                const skillClient = new BotFrameworkHttpClient({});
                const postActivityStub = stub(skillClient, 'postActivity');
                postActivityStub.onFirstCall().returns({ status: 200, body: firstResponse });
                // Return a 4xx status code so the OAuthCard is not intercepted.
                postActivityStub.onSecondCall().returns({ status: 409 });

                const conversationState = new ConversationState(new MemoryStorage());
                const dialogOptions = createSkillDialogOptions(conversationState, skillClient, connectionName);

                const dialogUnderTest = new SkillDialog(dialogOptions, 'skillDialog');
                const sendTokenExchangeSpy = spy(dialogUnderTest, 'sendTokenExchangeInvokeToSkill');
                const activityToSend = createSendActivity();
                const beginSkillDialogOptions = { activity: activityToSend };

                const client = new DialogTestClient(
                    Channels.Test,
                    dialogUnderTest,
                    beginSkillDialogOptions,
                    [new AutoSaveStateMiddleware(conversationState)],
                    conversationState
                );
                client._testAdapter.addExchangeableToken(
                    connectionName,
                    Channels.Test,
                    'user1',
                    'https://test',
                    'https://test1'
                );

                const finalActivity = await client.sendActivity('irrelevant');
                assert.ok(sendTokenExchangeSpy.called);
                assert.ok(finalActivity !== undefined);
                assert.strictEqual(finalActivity.attachments.length, 1);
            });
        }
    });
});

/**
 * @remarks
 * captureAction should match the below signature:
 * `(fromBotId: string, toBotId: string, toUrl: string, serviceUrl: string, conversationId: string, activity: Activity) => void`
 * @param {Function} captureAction Callback to capture the parameters sent to the skill.
 * @param {StatusCodes} returnStatusCode Defaults to StatusCodes.OK
 * @returns [BotFrameworkHttpClient, postActivityStub]
 */
function createSkillClientAndStub(captureAction, returnStatusCode = StatusCodes.OK, expectedReplies) {
    // This require should not fail as this method should only be called after verifying that botbuilder is resolvable.
    const { BotFrameworkHttpClient } = require('../../botbuilder');

    if (captureAction && typeof captureAction !== 'function') {
        throw new TypeError(
            `Failed test arrangement - createSkillClientAndStub() received ${typeof captureAction} instead of undefined or a function.`
        );
    }

    // Create ExpectedReplies object for response body
    const dummyActivity = { type: ActivityTypes.Message, attachments: [], entities: [] };
    dummyActivity.text = 'dummy activity';
    const activityList = expectedReplies ? expectedReplies : { activities: [dummyActivity] };

    // Create wrapper for captureAction
    function wrapAction(...args) {
        captureAction(...args);
        return { status: returnStatusCode, body: activityList };
    }
    // Create client and stub
    const skillClient = new BotFrameworkHttpClient({});
    const postActivityStub = stub(skillClient, 'postActivity');

    if (captureAction) {
        postActivityStub.callsFake(wrapAction);
    } else {
        postActivityStub.returns({ status: returnStatusCode, body: activityList });
    }

    return [skillClient, postActivityStub];
}

/**
 *
 * @param {string} uri Uri for the token exchange.
 */
function createOAuthCardAttachmentActivity(uri) {
    const oauthCard = {
        tokenExchangeResource: { uri },
    };

    const attachment = {
        contentType: CardFactory.contentTypes.oauthCard,
        content: oauthCard,
    };

    const attachmentActivity = MessageFactory.attachment(attachment);
    attachmentActivity.conversation = { id: uuid() };
    attachmentActivity.from = { id: 'blah', name: 'name' };

    return attachmentActivity;
}

/**
 * @param {*} conversationState The conversation state object.
 * @param {*} mockSkillClient The skill client mock.
 * @returns A Skill Dialog Options object.
 */
function createSkillDialogOptions(conversationState, mockSkillClient, connectionName, useCreateSkillConversationId) {
    const dialogOptions = {
        botId: 'SkillCallerId',
        connectionName: connectionName,
        skillHostEndpoint: 'http://test.contoso.com/skill/messages',
        conversationIdFactory: new SimpleConversationIdFactory({ useCreateSkillConversationId }),
        conversationState: conversationState,
        skillClient: mockSkillClient,
        skill: {
            appId: 'SkillId',
            skillEndpoint: 'http://testskill.contoso.com/api/messages',
        },
    };

    return dialogOptions;
}

function createSendActivity(deliveryMode = DeliveryModes.ExpectReplies) {
    const activityToSend = {
        type: ActivityTypes.Message,
        attachments: [],
        entities: [],
        deliveryMode,
    };
    activityToSend.text = uuid();
    return activityToSend;
}

class SimpleConversationIdFactory extends SkillConversationIdFactoryBase {
    constructor({ useCreateSkillConversationId = false }) {
        super();
        this._conversationRefs = new Map();
        this.useCreateSkillConversationId = useCreateSkillConversationId;
        this.createCount = 0;
    }

    async createSkillConversationIdWithOptions(options) {
        this.createCount++;

        if (this.useCreateSkillConversationId) {
            return super.createSkillConversationIdWithOptions();
        }
        const key = createHash('md5')
            .update(options.activity.conversation.id + options.activity.serviceUrl)
            .digest('hex');

        const ref = this._conversationRefs.has(key);
        if (!ref) {
            this._conversationRefs.set(key, {
                conversationReference: TurnContext.getConversationReference(options.activity),
                oAuthScope: options.fromBotOAuthScope,
            });
        }
        return key;
    }

    async createSkillConversationId(convRef) {
        this.createCount++;

        const key = createHash('md5')
            .update(convRef.conversation.id + convRef.serviceUrl)
            .digest('hex');

        const ref = this._conversationRefs.has(key);
        if (!ref) {
            this._conversationRefs.set(key, {
                conversationReference: convRef,
            });
        }
        return key;
    }

    async getConversationReference(skillConversationId) {
        return this._conversationRefs.get(skillConversationId);
    }

    async getSkillConversationReference(skillConversationId) {
        return this.getConversationReference(skillConversationId);
    }

    async deleteConversationReference(skillConversationId) {
        if (!this.useCreateSkillConversationId) {
            this._conversationRefs.delete(skillConversationId);
        }
    }
}

/**
 * Create an UUID
 *
 * @remarks
 * Replace `Guid.NewGuid().ToString();` with this function call.
 * @returns UUID string
 */
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
