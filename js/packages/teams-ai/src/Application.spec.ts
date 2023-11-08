import { strict as assert } from 'assert';
import { ActivityTypes, Channels, MemoryStorage, TestAdapter } from 'botbuilder';
import { Application, ApplicationBuilder, ConversationUpdateEvents } from './Application';
import { TestPlanner } from './planners';
import { AdaptiveCardsOptions } from './AdaptiveCards';
import { AIOptions } from './AI';
import { TaskModulesOptions } from './TaskModules';
import { TurnState } from './TurnState';
import { createTestConversationUpdate } from './internals';

describe('Application', () => {
    const adapter = new TestAdapter();
    const adaptiveCards: AdaptiveCardsOptions = { actionSubmitFilter: 'cardFilter' };
    const ai: AIOptions<TurnState> = {
        planner: new TestPlanner()
    };
    const botAppId = 'testBot';
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
    });

    describe('applicationBuilder', () => {
        it('should create an Application with default options', () => {
            const app = new ApplicationBuilder().build();
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, undefined);
            assert.equal(app.options.botAppId, undefined);
            assert.equal(app.options.storage, undefined);
            assert.equal(app.options.ai, undefined);
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
                .withTaskModuleOptions(taskModules)
                .setStartTypingTimer(startTypingTimer)
                .build();
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, adapter);
            assert.equal(app.options.botAppId, botAppId);
            assert.equal(app.options.storage, storage);
            assert.equal(app.options.ai, ai);
            assert.equal(app.options.adaptiveCards, adaptiveCards);
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
    });

    describe('conversationUpdate', () => {
        // Optional pre-configured mock Application using Test Adapter. If other mocks are needed, feel free to ignore mockApp and create your own.
        let mockApp: Application;

        beforeEach(() => {
            mockApp = new Application({ adapter });
        });

        it('should route to an instantiated conversationUpdate handler when channelId is Teams', async () => {
            let handlerCalled = false;
            mockApp.conversationUpdate('membersAdded', async (context, _state) => {
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
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should route to an instantiated conversationUpdate handler when channelId is not defined', async () => {
            let handlerCalled = false;
            mockApp.conversationUpdate('membersAdded', async (context, _state) => {
                handlerCalled = true;
                assert.equal(context.activity.membersAdded && context.activity.membersAdded.length, 2);
            });

            const activity = createTestConversationUpdate();
            activity.membersAdded = [
                { id: '123', name: 'Member One' },
                { id: '42', name: "Don't Panic" }
            ];

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
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
                mockApp.conversationUpdate(event as ConversationUpdateEvents, async (context, _state) => {
                    handlerCalled = true;
                    assert.equal(context.activity.channelData.eventType, event);
                    assert.deepEqual(context.activity.channelData, channelData);
                });

                const activity = createTestConversationUpdate(channelData);
                activity.channelId = Channels.Msteams;
                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
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

            mockApp.conversationUpdate('channelCreated', async (context, _state) => {
                handlerCalled = true;
                assert.equal(typeof context.activity.channelData, 'object');
                assert.equal(context.activity.channelData.eventType, 'channelCreated');
                assert.deepEqual(context.activity.channelData.channel, channel);
                assert.deepEqual(context.activity.channelData.team, team);
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });

        it('should throw an error if handler is not a function', () => {
            assert.throws(
                () => mockApp.conversationUpdate('membersRemoved', {} as any),
                new Error(
                    `ConversationUpdate 'handler' for membersRemoved is object. Type of 'handler' must be a function.`
                )
            );
        });
    });
});
