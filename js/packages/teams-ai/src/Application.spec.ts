import { strict as assert } from 'assert';
import {
    Activity,
    ActivityTypes,
    Channels,
    FileConsentCardResponse,
    MemoryStorage,
    MessageReactionTypes,
    O365ConnectorCardActionQuery,
    TestAdapter
} from 'botbuilder';
import {
    Application,
    ApplicationBuilder,
    ConversationUpdateEvents,
    MessageReactionEvents,
    TeamsMessageEvents
} from './Application';
import { AdaptiveCardsOptions } from './AdaptiveCards';
import { AIOptions } from './AI';
import { TaskModulesOptions } from './TaskModules';
import { TurnState } from './TurnState';
import { createTestConversationUpdate, createTestInvoke } from './internals';
import { TestPlanner } from './planners/TestPlanner';

describe('Application', () => {
    const adapter = new TestAdapter();
    const adaptiveCards: AdaptiveCardsOptions = { actionSubmitFilter: 'cardFilter' };
    const ai: AIOptions<TurnState> = {
        planner: new TestPlanner()
    };
    const botAppId = 'testBot';
    const authenticationSettings = {
        settings: {
            testSetting: {
                connectionName: 'testConnectionName',
                title: 'testTitle'
            }
        }
    };
    const longRunningMessages = true;
    const removeRecipientMention = false;
    const startTypingTimer = false;
    const storage = new MemoryStorage();
    const taskModules: TaskModulesOptions = { taskDataFilter: 'taskFilter' };

    describe('constructor()', () => {
        it('should create an Application with default options', () => {
            const app = new Application();
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
                adapter,
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
            assert.equal(app.options.adapter, adapter);
            assert.deepEqual(app.options.adaptiveCards, adaptiveCards);
            assert.deepEqual(app.options.ai, ai);
            assert.equal(app.options.botAppId, botAppId);
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
                        adapter,
                        botAppId: '',
                        longRunningMessages: true
                    }),
                new Error(
                    `The Application.longRunningMessages property is unavailable because no adapter or botAppId was configured.`
                )
            );
        });

        it('should throw an exception if adapter is not configured', () => {
            const app = new Application({
                adapter: undefined,
                botAppId: 'botid'
            });
            assert.throws(
                () => app.adapter,
                new Error(
                    `The Application.adapter property is unavailable because it was not configured when creating the Application.`
                )
            );
        });
    });

    describe('applicationBuilder', () => {
        it('should create an Application with default options', () => {
            const app = new ApplicationBuilder().build();
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, undefined);
            assert.equal(app.options.botAppId, undefined);
            assert.equal(app.options.storage, undefined);
            assert.equal(app.options.ai, undefined);
            assert.equal(app.options.authentication, undefined);
            assert.equal(app.options.adaptiveCards, undefined);
            assert.equal(app.options.taskModules, undefined);
            assert.equal(app.options.removeRecipientMention, true);
            assert.equal(app.options.startTypingTimer, true);
            assert.equal(app.options.longRunningMessages, false);
        });

        it('should create an Application with custom options', () => {
            const app = new ApplicationBuilder()
                .setRemoveRecipientMention(removeRecipientMention)
                .withStorage(storage)
                .withAIOptions(ai)
                .withLongRunningMessages(adapter, botAppId)
                .withAdaptiveCardOptions(adaptiveCards)
                .withAuthentication(adapter, authenticationSettings)
                .withTaskModuleOptions(taskModules)
                .setStartTypingTimer(startTypingTimer)
                .build();
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, adapter);
            assert.equal(app.options.botAppId, botAppId);
            assert.equal(app.options.storage, storage);
            assert.equal(app.options.ai, ai);
            assert.equal(app.options.adaptiveCards, adaptiveCards);
            assert.equal(app.options.authentication, authenticationSettings);
            assert.equal(app.options.taskModules, taskModules);
            assert.equal(app.options.removeRecipientMention, removeRecipientMention);
            assert.equal(app.options.startTypingTimer, startTypingTimer);
            assert.equal(app.options.longRunningMessages, longRunningMessages);
        });

        it('should throw an exception if botId is an empty string for longRunningMessages', () => {
            assert.throws(() => {
                new ApplicationBuilder().withLongRunningMessages(adapter, '').build();
            });
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

            await adapter.sendTextToBot('hello', async (context) => {
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
        it('should return the authentication property', () => {
            const app = new Application({
                adapter,
                botAppId: 'botid',
                authentication: authenticationSettings
            });
            assert.notEqual(app.authentication, undefined);
        });

        it('should throw an exception when getting authentication if it is not configured', () => {
            const app = new Application({
                adapter,
                botAppId: 'botid'
            });
            assert.throws(
                () => app.authentication,
                new Error(
                    `The Application.authentication property is unavailable because no authentication options were configured.`
                )
            );
        });
    });

    describe('meetings', () => {
        it('should return the meetings property', () => {
            const app = new Application();
            assert.notEqual(app.meetings, undefined);
        });
    });

    describe('activity', () => {
        it('should route to an activity handler', async () => {
            let called = false;
            const app = new Application();
            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.notEqual(context, undefined);
                assert.notEqual(state, undefined);
                called = true;
            });

            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

        it("should not route activity if there's no handler", async () => {
            const app = new Application();
            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(handled, false);
            });
        });

        it('should route to first registered activity handler', async () => {
            let called = false;
            const app = new Application();
            app.activity(ActivityTypes.Message, async (context, state) => {
                called = true;
            });
            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.fail('should not be called');
            });

            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

        it('should create a route for an array of activity types', async () => {
            let calledMessage = false;
            let calledEvent = false;
            const app = new Application();
            app.activity([ActivityTypes.Message, ActivityTypes.ConversationUpdate], async (context) => {
                if (context.activity.type === ActivityTypes.Message) {
                    calledMessage = true;
                }
                if (context.activity.type === ActivityTypes.ConversationUpdate) {
                    calledEvent = true;
                }
            });

            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(calledMessage, true);
                assert.equal(handled, true);
            });
            const eventActivity = createTestConversationUpdate();

            await adapter.processActivity(eventActivity, async (context) => {
                const handled = await app.run(context);
                assert.equal(calledEvent, true);
                assert.equal(handled, true);
            });
        });
    });

    describe('conversationUpdate', () => {
        // Optional pre-configured mock Application using Test Adapter. If other mocks are needed, feel free to ignore app and create your own.
        let app: Application;

        beforeEach(() => {
            app = new Application({ adapter });
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

            await adapter.processActivity(activity, async (context) => {
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

            await adapter.processActivity(activity, async (context) => {
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
                await adapter.processActivity(activity, async (context) => {
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

            await adapter.processActivity(activity, async (context) => {
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
        let app: Application;

        beforeEach(() => {
            app = new Application({ adapter });
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

                await adapter.processActivity(testActivity, async (context) => {
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
        it('should route to correct handler for fileConsentAccept', async () => {
            let handlerCalled = false;

            const app = new Application();
            app.fileConsentAccept(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await adapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should fail routing to handler for fileConsentAccept if declined', async () => {
            let handlerCalled = false;
            fileConsentCardResponse.action = 'decline';
            const app = new Application();
            app.fileConsentAccept(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await adapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, false);
            });
        });
    });

    describe('fileConsentDecline', () => {
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
        it('should route to correct handler for fileConsentDecline', async () => {
            let handlerCalled = false;

            const app = new Application();
            app.fileConsentDecline(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'decline');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await adapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should fail routing to handler for fileConsentDecline if accepted', async () => {
            let handlerCalled = false;
            fileConsentCardResponse.action = 'accept';
            const app = new Application();
            app.fileConsentDecline(async (context, _state, fileConsentCardResponse) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'fileConsent/invoke');
                assert.equal(fileConsentCardResponse.action, 'accept');
            });

            const activity = createTestInvoke('fileConsent/invoke', fileConsentCardResponse);

            await adapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, false);
            });
        });
    });

    describe('O365ConnectorCardAction', () => {
        it('should route to correct handler for O365ConnectorCardAction', async () => {
            let handlerCalled = false;

            const o365ConnectorCardActionQuery: O365ConnectorCardActionQuery = {
                body: 'some results',
                actionId: 'actionId'
            };
            const app = new Application();
            app.O365ConnectorCardAction(async (context, _state, O365ConnectorCardActionQuery) => {
                handlerCalled = true;
                assert.equal(context.activity.type, ActivityTypes.Invoke);
                assert.equal(context.activity.name, 'actionableMessage/executeAction');
                assert.equal(O365ConnectorCardActionQuery.body, 'some results');
                assert.equal(O365ConnectorCardActionQuery.actionId, 'actionId');
            });

            const activity = createTestInvoke('actionableMessage/executeAction', o365ConnectorCardActionQuery);

            await adapter.processActivity(activity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('messageUpdate', () => {
        let app: Application;

        beforeEach(() => {
            app = new Application({ adapter });
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

                await adapter.processActivity(testActivity, async (context) => {
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
        let app: Application;

        beforeEach(() => {
            app = new Application({ adapter });
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

            await adapter.processActivity(testActivity, async (context) => {
                await app.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });
});
