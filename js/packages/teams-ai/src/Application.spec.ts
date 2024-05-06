import { strict as assert } from 'assert';
import sinon from 'sinon';

import {
    Activity,
    ActivityTypes,
    Channels,
    CloudAdapter,
    CloudAdapterBase,
    MemoryStorage,
    MessageReactionTypes,
    TestAdapter,
    O365ConnectorCardActionQuery,
    FileConsentCardResponse
} from 'botbuilder';

import {
    Application,
    ConversationUpdateEvents,
    FeedbackLoopData,
    MessageReactionEvents,
    TeamsMessageEvents
} from './Application';
import { AdaptiveCardsOptions } from './AdaptiveCards';
import { AIOptions } from './AI';
import { TestPlanner } from './internals/testing/TestPlanner';
import { createTestConversationUpdate, createTestInvoke } from './internals/testing/TestUtilities';
import { TaskModulesOptions } from './TaskModules';
import { TurnState } from './TurnState';
import { TeamsAdapter } from './TeamsAdapter';

class MockUserTokenClient {
    /**
     * Creates a new MockUserTokenClient.
     * @param {boolean} returnMockToken returns a mock TokenResponse when true, undefined when false
     * @param {boolean} getUserTokenError getUserToken throws an error when true
     */
    constructor(
        readonly returnMockToken: boolean = true,
        readonly getUserTokenError = false
    ) {}
    static readonly expectedToken = 'mockToken';
    public async getUserToken(
        _userId: string,
        connectionName: string,
        _channelId: string,
        _magicCode: string
    ): Promise<any> {
        if (this.getUserTokenError) {
            throw new Error('MockUserTokenClient.getUserTokenError is true.');
        }
        if (this.returnMockToken) {
            return {
                channelId: Channels.Msteams,
                connectionName,
                token: MockUserTokenClient.expectedToken,
                expiration: '2050-01-01T00:00:00.000Z'
            };
        } else {
            return undefined;
        }
    }
    public async getSignInResource(_connectionName: string, _activity: Activity, _finalRediect: string): Promise<any> {
        return {};
    }
    public async signOutUser(_userId: string, _connectionName: string, _channelId: string): Promise<void> {
        return;
    }
}

describe('Application', () => {
    let sandbox: sinon.SinonSandbox;
    const testAdapter = new TestAdapter();
    const adaptiveCards: AdaptiveCardsOptions = { actionSubmitFilter: 'cardFilter' };
    const ai: AIOptions<TurnState> = { planner: new TestPlanner() };
    const botAppId = 'testBot';
    const longRunningMessages = true;
    const removeRecipientMention = false;
    const startTypingTimer = false;
    const storage = new MemoryStorage();
    const taskModules: TaskModulesOptions = { taskDataFilter: 'taskFilter' };
    const authenticationSettings = {
        settings: {
            testSetting: {
                connectionName: 'testConnectionName',
                title: 'testTitle'
            }
        }
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor()', () => {
        it('should create an Application with default options', () => {
            const app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);

            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, undefined);
            assert.equal(app.options.adaptiveCards, undefined);
            assert.equal(app.options.ai, undefined);
            assert.equal(app.options.botAppId, undefined);
            assert.equal(app.options.longRunningMessages, false);
            assert.equal(app.options.removeRecipientMention, true);
            assert.equal(app.options.startTypingTimer, true);
            assert.equal(app.options.storage, undefined);
            assert.equal(app.options.taskModules, undefined);
            assert.notEqual(app.options.turnStateFactory, undefined);
        });

        it('should create an Application with custom options', () => {
            const app = new Application({
                adaptiveCards,
                ai,
                botAppId,
                longRunningMessages,
                removeRecipientMention,
                startTypingTimer,
                storage,
                taskModules
            });
            assert.notEqual(app.options, undefined);
            assert.deepEqual(app.options.adaptiveCards, adaptiveCards);
            assert.deepEqual(app.options.ai, ai);
            assert.deepEqual(app.options.botAppId, botAppId);
            assert.equal(app.options.longRunningMessages, longRunningMessages);
            assert.equal(app.options.removeRecipientMention, removeRecipientMention);
            assert.equal(app.options.startTypingTimer, startTypingTimer);
            assert.equal(app.options.storage, storage);
            assert.deepEqual(app.options.taskModules, taskModules);
        });

        it('should throw an exception if botId is an empty string for longRunningMessages', () => {
            assert.throws(
                () =>
                    new Application({
                        botAppId: '',
                        longRunningMessages: true
                    }),
                new Error(
                    `The Application.longRunningMessages property is unavailable because no adapter or botAppId was configured.`
                )
            );
        });

        it('should throw an exception if adapter is not configured', () => {
            const app = new Application();
            assert.throws(
                () => app.adapter,
                new Error(
                    `The Application.adapter property is unavailable because it was not configured when creating the Application.`
                )
            );
        });

        it('should have a configured adapter', () => {
            const app = new Application({
                adapter: new TeamsAdapter({}, undefined, undefined, {})
            });

            assert.doesNotThrow(() => app.adapter);
        });
    });

    describe('botAuthentication', () => {
        const app = new Application({
            adapter: new TeamsAdapter()
        });

        it('should initialize `CloudAdapter`', () => {
            assert.doesNotThrow(() => app.adapter);
            assert.equal(app.adapter instanceof CloudAdapter, true);
        });
    });

    describe('adaptiveCards', () => {
        it('should return the adaptiveCards property', () => {
            const app = new Application();
            assert.notEqual(app.adaptiveCards, undefined);
        });
    });

    describe('ai', () => {
        it('should throw exception if ai not configured', () => {
            const app = new Application();
            assert.throws(() => app.ai);
        });

        it('should return the ai property', () => {
            const app = new Application({
                ai
            });
            assert.notEqual(app.ai, undefined);
        });
    });

    describe('message', () => {
        it('should return the message property', () => {
            const app = new Application();
            assert.notEqual(app.message, undefined);
        });

        it("should not route activity if there's no handler", async () => {
            const app = new Application();

            app.message('/\\?/reset/i', async (context) => {
                const handled = await app.run(context);
                assert.equal(handled, false);
            });
        });

        it('should route to an activity handler for an array of keywords', async () => {
            const messages = ['hello', 'hi', 'who are you?'];
            let called = false;
            const app = new Application();
            app.message(messages, async (context, state) => {
                assert.notEqual(context, undefined);
                assert.notEqual(state, undefined);
                called = true;
            });

            await testAdapter.sendTextToBot('hello', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });
    });

    describe('messageExtensions', () => {
        it('should return the messageExtensions property', () => {
            const app = new Application();
            assert.notEqual(app.messageExtensions, undefined);
        });
    });

    describe('taskModules', () => {
        it('should return the taskModules property', () => {
            const app = new Application();
            assert.notEqual(app.taskModules, undefined);
        });
    });

    describe('authentication', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application({
                adapter: new TeamsAdapter(),
                authentication: authenticationSettings
            });

            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should return the authentication property', () => {
            assert.notEqual(app.authentication, undefined);
        });

        it('should throw an exception when getting authentication if it is not configured', () => {
            const app = new Application();
            assert.throws(
                () => app.authentication,
                new Error(
                    `The Application.authentication property is unavailable because no authentication options were configured.`
                )
            );
        });

        it('should start signin flow', async () => {
            const authSettings = { ...authenticationSettings, autoSignIn: true };
            const app = new Application({
                adapter: new TeamsAdapter(),
                authentication: authSettings
            });

            sandbox.stub(app, 'adapter').get(() => testAdapter);

            await testAdapter.sendTextToBot('signin', async (context) => {
                // Set MockUserTokenClient on TurnState
                context.turnState.set(
                    (context.adapter as CloudAdapterBase).UserTokenClientKey,
                    new MockUserTokenClient(false)
                );
                const handled = await app.run(context);
                // Returns false because of 'pending' in response.status
                assert.equal(handled, false);
            });
        });

        it('should skip signin flow when user is already signed in.', async () => {
            // Register a message handler for the 'signin' Text Activity
            // so that app.run() resolves to true.
            // Additionally, check to see that the user's token was set in TState by setTokenInState.
            let signinMessageHandlerCalled: boolean = false;
            app.message('signin', async (_context, state) => {
                assert.equal(state.temp.authTokens[app.authentication.default], MockUserTokenClient.expectedToken);
                signinMessageHandlerCalled = true;
            });
            await testAdapter.sendTextToBot('signin', async (context) => {
                // Set MockUserTokenClient on context.turnState.
                // Otherwise UserTokenAccess will throw an "OAuth prompt not supported" error
                // and the test will fail.
                context.turnState.set(
                    (context.adapter as CloudAdapterBase).UserTokenClientKey,
                    new MockUserTokenClient()
                );
                const handled = await app.run(context);
                assert.equal(handled, true);
                assert.equal(signinMessageHandlerCalled, true);
            });
        });

        it('should throw an error when Authentication.signUserIn() throws an error.', async () => {
            await testAdapter.sendTextToBot('signin', async (context) => {
                // Set MockUserTokenClient on context.turnState.
                // Otherwise UserTokenAccess will throw an "OAuth prompt not supported" error
                // and the test will fail.
                context.turnState.set(
                    (context.adapter as CloudAdapterBase).UserTokenClientKey,
                    // The second constructor parameter is true, which causes getUserToken() to throw an error.
                    new MockUserTokenClient(undefined, true)
                );
                await assert.rejects(
                    () => app.run(context),
                    new Error('MockUserTokenClient.getUserTokenError is true.')
                );
            });
        });
    });

    describe('meetings', () => {
        it('should return the meetings property', () => {
            const app = new Application();
            assert.notEqual(app.meetings, undefined);
        });
    });

    describe('activity', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to an activity handler', async () => {
            let called = false;

            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.notEqual(context, undefined);
                assert.notEqual(state, undefined);
                called = true;
            });

            await testAdapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

        it("should not route activity if there's no handler", async () => {
            await testAdapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(handled, false);
            });
        });

        it('should route to first registered activity handler', async () => {
            let called = false;

            app.activity(ActivityTypes.Message, async (context, state) => {
                called = true;
            });
            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.fail('should not be called');
            });

            await testAdapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

        it('should create a route for an array of activity types', async () => {
            let calledMessage = false;
            let calledEvent = false;

            app.activity([ActivityTypes.Message, ActivityTypes.ConversationUpdate], async (context) => {
                if (context.activity.type === ActivityTypes.Message) {
                    calledMessage = true;
                }
                if (context.activity.type === ActivityTypes.ConversationUpdate) {
                    calledEvent = true;
                }
            });

            await testAdapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(calledMessage, true);
                assert.equal(handled, true);
            });
            const eventActivity = createTestConversationUpdate();

            await testAdapter.processActivity(eventActivity, async (context) => {
                const handled = await app.run(context);
                assert.equal(calledEvent, true);
                assert.equal(handled, true);
            });
        });
    });

    describe('conversationUpdate', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to an instantiated conversationUpdate handler when channelId is Teams', async () => {
            let handlerCalled = false;
            app.conversationUpdate('membersAdded', async (context, _state) => {
                handlerCalled = true;
                assert.equal(context.activity.membersAdded && context.activity.membersAdded.length, 2);
            });

            const activity = createTestConversationUpdate();
            activity.channelId = Channels.Msteams;
            activity.membersAdded = [
                { id: '123', name: 'Member One' },
                { id: '42', name: "Don't Panic" }
            ];

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should route to an instantiated conversationUpdate handler when channelId is not defined', async () => {
            let handlerCalled = false;
            app.conversationUpdate('membersAdded', async (context, _state) => {
                handlerCalled = true;
                assert.equal(context.activity.membersAdded && context.activity.membersAdded.length, 2);
            });

            const activity = createTestConversationUpdate();
            activity.membersAdded = [
                { id: '123', name: 'Member One' },
                { id: '42', name: "Don't Panic" }
            ];

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        const testData = [
            {
                event: 'channelCreated',
                channelData: {
                    channel: { id: 'mockChannelId' },
                    team: { id: 'mockTeamId' },
                    eventType: 'channelCreated'
                }
            },
            {
                event: 'channelDeleted',
                channelData: {
                    channel: { id: 'mockChannelId' },
                    team: { id: 'mockTeamId' },
                    eventType: 'channelDeleted'
                }
            },
            {
                event: 'teamRenamed',
                channelData: { team: { id: 'mockTeamId' }, eventType: 'teamRenamed' }
            },
            {
                event: 'teamDeleted',
                channelData: { team: { id: 'mockTeamId' }, eventType: 'teamDeleted' }
            }
        ];

        for (const { event, channelData } of testData) {
            it(`should route to correct handler for '${event}'`, async () => {
                let handlerCalled = false;
                app.conversationUpdate(event as ConversationUpdateEvents, async (context, _state) => {
                    handlerCalled = true;
                    assert.equal(context.activity.channelData.eventType, event);
                    assert.deepEqual(context.activity.channelData, channelData);
                });

                const activity = createTestConversationUpdate(channelData);
                activity.channelId = Channels.Msteams;
                await testAdapter.processActivity(activity, async (context) => {
                    await app.run(context);
                    assert.equal(handlerCalled, true);
                });
            });
        }

        it('should route to channel* events for correct eventType and when channel and team exist', async () => {
            let handlerCalled = false;
            const team = { id: 'mockTeamId' };
            const channel = { id: 'mockChannelId' };
            const activity = createTestConversationUpdate({ channel, eventType: 'channelCreated', team });
            activity.channelId = Channels.Msteams;

            app.conversationUpdate('channelCreated', async (context, _state) => {
                handlerCalled = true;
                assert.equal(typeof context.activity.channelData, 'object');
                assert.equal(context.activity.channelData.eventType, 'channelCreated');
                assert.deepEqual(context.activity.channelData.channel, channel);
                assert.deepEqual(context.activity.channelData.team, team);
            });

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should throw an error if handler is not a function', () => {
            assert.throws(
                () => app.conversationUpdate('membersRemoved', {} as any),
                new Error(
                    `ConversationUpdate 'handler' for membersRemoved is object. Type of 'handler' must be a function.`
                )
            );
        });
    });

    describe('messageReactions', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        const messageReactions: { event: MessageReactionEvents; testActivity: Partial<Activity> }[] = [
            {
                event: 'reactionsAdded',
                testActivity: {
                    type: ActivityTypes.MessageReaction,
                    reactionsAdded: [{ type: MessageReactionTypes.Like }]
                }
            },
            {
                event: 'reactionsRemoved',
                testActivity: {
                    type: ActivityTypes.MessageReaction,
                    reactionsRemoved: [{ type: MessageReactionTypes.Like }]
                }
            }
        ];

        for (const { event, testActivity } of messageReactions) {
            it(`should route to correct handler for ${event}`, async () => {
                let handlerCalled = false;
                app.messageReactions(event, async (context, _state) => {
                    handlerCalled = true;
                    assert.equal(context.activity.type, ActivityTypes.MessageReaction);
                    switch (event) {
                        case 'reactionsAdded':
                            assert.deepEqual(context.activity?.reactionsAdded, testActivity.reactionsAdded);
                            break;
                        case 'reactionsRemoved':
                            assert.deepEqual(context.activity?.reactionsRemoved, testActivity.reactionsRemoved);
                            break;
                        default:
                            throw new Error(`Test setup error. Unknown event: ${event}`);
                    }
                });

                await testAdapter.processActivity(testActivity, async (context) => {
                    await app.run(context);
                    assert.equal(handlerCalled, true);
                });
            });
        }

        it(`should throw an error when event is not known case`, () => {
            assert.throws(
                () =>
                    app.messageEventUpdate('test' as any, async (_context, _state) => {
                        assert.fail('should not be called');
                    }),
                new Error(`Invalid TeamsMessageEvent type: test`)
            );
        });
    });

    describe('fileConsentAccept', () => {
        let app = new Application();
        const fileConsentCardResponse: FileConsentCardResponse = {
            action: 'accept',
            context: {
                theme: 'dark',
                consentId: '1234567890'
            },
            uploadInfo: {
                name: 'test.txt',
                uploadUrl: 'https://test.com',
                contentUrl: 'https://test.com',
                uniqueId: '1234567890'
            }
        };

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to correct handler for fileConsentAccept', async () => {
            let handlerCalled = false;

            app.fileConsentAccept(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should fail routing to handler for fileConsentAccept if declined', async () => {
            let handlerCalled = false;
            fileConsentCardResponse.action = 'decline';

            app.fileConsentAccept(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, false);
            });
        });
    });

    describe('fileConsentDecline', () => {
        let app = new Application();
        const fileConsentCardResponse: FileConsentCardResponse = {
            action: 'decline',
            context: {
                theme: 'dark',
                consentId: '1234567890'
            },
            uploadInfo: {
                name: 'test.txt',
                uploadUrl: 'https://test.com',
                contentUrl: 'https://test.com',
                uniqueId: '1234567890'
            }
        };

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to correct handler for fileConsentDecline', async () => {
            let handlerCalled = false;

            app.fileConsentDecline(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'decline');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should fail routing to handler for fileConsentDecline if accepted', async () => {
            let handlerCalled = false;
            fileConsentCardResponse.action = 'accept';

            app.fileConsentDecline(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, false);
            });
        });
    });

    describe('O365ConnectorCardAction', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to correct handler for O365ConnectorCardAction', async () => {
            let handlerCalled = false;

            const o365ConnectorCardActionQuery: O365ConnectorCardActionQuery = {
                body: 'some results',
                actionId: 'actionId'
            };

            app.O365ConnectorCardAction(async (context, _state, O365ConnectorCardActionQuery) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'actionableMessage/executeAction');
                assert.equal(O365ConnectorCardActionQuery.body, 'some results');
                assert.equal(O365ConnectorCardActionQuery.actionId, 'actionId');
            });

            const activity = createTestInvoke('actionableMessage/executeAction', o365ConnectorCardActionQuery);

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('handoff', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to correct handler for handoff', async () => {
            let handlerCalled = false;

            app.handoff(async (context, _state, token) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'handoff/action');
                assert.equal(token, 'test');
            });

            const activity = createTestInvoke('handoff/action', { continuation: 'test' });

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('messageUpdate', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        const messageUpdateEvents: { event: TeamsMessageEvents; testActivity: Partial<Activity> }[] = [
            {
                event: 'editMessage',
                testActivity: {
                    type: ActivityTypes.MessageUpdate,
                    channelData: { eventType: 'editMessage' }
                }
            },
            {
                event: 'softDeleteMessage',
                testActivity: {
                    type: ActivityTypes.MessageDelete,
                    channelData: { eventType: 'softDeleteMessage' }
                }
            },
            {
                event: 'undeleteMessage',
                testActivity: {
                    type: ActivityTypes.MessageUpdate,
                    channelData: { eventType: 'undeleteMessage' }
                }
            }
        ];

        for (const { event, testActivity } of messageUpdateEvents) {
            it(`should route to correct handler for ${event}`, async () => {
                let handlerCalled = false;
                app.messageEventUpdate(event, async (context, _state) => {
                    handlerCalled = true;
                    switch (event) {
                        case 'editMessage':
                        case 'undeleteMessage':
                            assert.equal(context.activity.type, ActivityTypes.MessageUpdate);
                            assert.deepEqual(context.activity?.channelData, testActivity.channelData);
                            break;
                        case 'softDeleteMessage':
                            assert.equal(context.activity.type, ActivityTypes.MessageDelete);
                            assert.deepEqual(context.activity?.channelData, testActivity.channelData);
                            break;
                        default:
                            throw new Error(`Test setup error. Unknown event: ${event}`);
                    }
                });

                await testAdapter.processActivity(testActivity, async (context) => {
                    await app.run(context);
                    assert.equal(handlerCalled, true);
                });
            });
        }

        it('should throw an error when handler is not a function', () => {
            assert.throws(
                () => app.messageEventUpdate('editMessage', 1 as any),
                new Error(`MessageUpdate 'handler' for editMessage is number. Type of 'handler' must be a function.`)
            );
        });
    });

    describe('teamsReadReceipt', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });

        it('should route to correct handler for teamsReadReceipt', async () => {
            let handlerCalled = false;
            app.teamsReadReceipt(async (context, _state, readReceiptInfo) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Event);
                assert.equal(context.activity.name, 'application/vnd.microsoft/readReceipt');
            });

            const testActivity = {
                channelId: Channels.Msteams,
                name: 'application/vnd.microsoft/readReceipt',
                type: ActivityTypes.Event,
                value: {
                    lastReadMessageId: '000000000000-0000-0000-0000-000000000000'
                }
            };

            await testAdapter.processActivity(testActivity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('feedbackLoop', () => {
        let app = new Application();

        beforeEach(() => {
            app = new Application();
            sandbox.stub(app, 'adapter').get(() => testAdapter);
        });
        it('should route to correct handler for feedbackLoop', async () => {
            let handlerCalled = false;

            app.feedbackLoop(async (context, _state, feedbackLoopData) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'message/submitAction');
                assert.equal(feedbackLoopData.actionValue.reaction, 'like');
                assert.notEqual(feedbackLoopData.actionValue.feedback, undefined);
                assert.notEqual(feedbackLoopData.replyToId, undefined);
            });

            const channelData = {
                feedbackLoopEnabled: true
            };

            const feedback: FeedbackLoopData = {
                actionName: 'feedback',
                actionValue: {
                    reaction: 'like',
                    feedback: 'this response is helpful'
                },
                replyToId: '1234567890'
            };

            const activity = createTestInvoke('message/submitAction', feedback, channelData);
            activity.replyToId = '1234567890';

            await testAdapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });
});
