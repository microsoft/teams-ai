const assert = require('assert');
const {
    ActivityHandler,
    ActivityTypes,
    Channels,
    TestAdapter,
    tokenResponseEventName,
    TurnContext,
} = require('../lib');

describe('ActivityHandler', function () {
    const adapter = new TestAdapter();

    async function processActivity(activity, bot) {
        if (!activity) {
            throw new Error('Missing activity');
        }

        if (!bot) {
            throw new Error('Missing bot');
        }

        const context = new TurnContext(adapter, activity);
        await bot.run(context);
    }

    it('should fire onTurn for any inbound activity', async function () {
        const bot = new ActivityHandler();

        let onTurnCalled = false;
        bot.onTurn(async (context, next) => {
            onTurnCalled = true;
            await next();
        });

        await processActivity({ type: 'any' }, bot);
        assert(onTurnCalled);
    });

    it('should fire onMessage for any message activities', async function () {
        const bot = new ActivityHandler();

        let onMessageCalled = false;
        bot.onMessage(async (context, next) => {
            onMessageCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.Message }, bot);
        assert(onMessageCalled);
    });

    it('calling  next allows following events to firing', async function () {
        const bot = new ActivityHandler();

        let onTurnCalled = false;
        bot.onTurn(async (context, next) => {
            onTurnCalled = true;
            await next();
        });

        let onMessageCalled = false;
        bot.onMessage(async (context, next) => {
            onMessageCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.Message }, bot);
        assert(onTurnCalled);
        assert(onMessageCalled);
    });

    it('omitting call to next prevents following events from firing', async function () {
        const bot = new ActivityHandler();

        let onTurnCalled = false;
        bot.onTurn(async (_context, _next) => {
            onTurnCalled = true;
        });

        let onMessageCalled = false;
        bot.onMessage(async (context, next) => {
            onMessageCalled = false;
            await next();
        });

        await processActivity({ type: ActivityTypes.Message }, bot);
        assert(onTurnCalled);
        assert(!onMessageCalled);
    });

    it('binding 2 methods to the same event both fire', async function () {
        const bot = new ActivityHandler();
        let count = 0;

        let onMessageCalled = false;
        bot.onMessage(async (_context, next) => {
            onMessageCalled = true;
            count++;
            await next();
        });

        let onMessageCalledAgain = false;
        bot.onMessage(async (_context, next) => {
            onMessageCalledAgain = true;
            count++;
            await next();
        });

        await processActivity({ type: ActivityTypes.Message }, bot);
        assert(onMessageCalled);
        assert(onMessageCalledAgain);
        assert(count === 2, 'all events did fire');
    });

    it('should fire onMessageUpdate', async function () {
        const bot = new ActivityHandler();

        let onMessageUpdate = false;
        bot.onMessageUpdate(async (context, next) => {
            onMessageUpdate = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.MessageUpdate }, bot);
        assert(onMessageUpdate);
    });

    it('should fire onMessageDelete', async function () {
        const bot = new ActivityHandler();

        let onMessageDelete = false;
        bot.onMessageDelete(async (context, next) => {
            onMessageDelete = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.MessageDelete }, bot);
        assert(onMessageDelete);
    });

    it('should fire onConversationUpdate', async function () {
        const bot = new ActivityHandler();

        let onConversationUpdateCalled = false;
        bot.onConversationUpdate(async (context, next) => {
            onConversationUpdateCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.ConversationUpdate }, bot);
        assert(onConversationUpdateCalled);
    });

    it('should fire onMembersAdded', async function () {
        const bot = new ActivityHandler();

        let onMembersAddedCalled = false;
        bot.onMembersAdded(async (context, next) => {
            onMembersAddedCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.ConversationUpdate, membersAdded: [{ id: 1 }] }, bot);
        assert(onMembersAddedCalled);
    });

    it('should fire onMembersRemoved', async function () {
        const bot = new ActivityHandler();

        let onMembersRemovedCalled = false;
        bot.onMembersRemoved(async (context, next) => {
            onMembersRemovedCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.ConversationUpdate, membersRemoved: [{ id: 1 }] }, bot);
        assert(onMembersRemovedCalled);
    });

    it('should fire onMessageReaction', async function () {
        const bot = new ActivityHandler();

        let onMessageReactionCalled = false;
        bot.onMessageReaction(async (context, next) => {
            onMessageReactionCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.MessageReaction }, bot);
        assert(onMessageReactionCalled);
    });

    it('should fire onReactionsAdded', async function () {
        const bot = new ActivityHandler();

        let onReactionsAddedCalled = false;
        bot.onReactionsAdded(async (context, next) => {
            onReactionsAddedCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.MessageReaction, reactionsAdded: [{ type: 'like' }] }, bot);
        assert(onReactionsAddedCalled);
    });

    it('should fire onReactionsRemoved', async function () {
        const bot = new ActivityHandler();

        let onReactionsRemovedCalled = false;
        bot.onReactionsRemoved(async (context, next) => {
            onReactionsRemovedCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.MessageReaction, reactionsRemoved: [{ type: 'like' }] }, bot);
        assert(onReactionsRemovedCalled);
    });

    it('should fire onEvent', async function () {
        const bot = new ActivityHandler();

        let onEventCalled = false;
        bot.onEvent(async (context, next) => {
            onEventCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.Event }, bot);
        assert(onEventCalled);
    });

    it('should fire onEndOfConversation', async function () {
        const bot = new ActivityHandler();

        let onEndConversationCalled = false;
        bot.onEndOfConversation(async (context, next) => {
            onEndConversationCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.EndOfConversation }, bot);
        assert(onEndConversationCalled);
    });

    it('should fire onTyping', async function () {
        const bot = new ActivityHandler();

        let onTypingCalled = false;
        bot.onTyping(async (context, next) => {
            onTypingCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.Typing }, bot);
        assert(onTypingCalled);
    });

    it('should fire onInstallationUpdate', async function () {
        const bot = new ActivityHandler();

        let onInstallationUpdateCalled = false;
        bot.onInstallationUpdate(async (context, next) => {
            onInstallationUpdateCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.InstallationUpdate }, bot);
        assert(onInstallationUpdateCalled);
    });

    it('should fire onInstallationUpdateAdd', async function () {
        const bot = new ActivityHandler();

        let onInstallationUpdateAddCalled = false;
        bot.onInstallationUpdateAdd(async (context, next) => {
            onInstallationUpdateAddCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.InstallationUpdate, action: 'add' }, bot);
        assert(onInstallationUpdateAddCalled);
    });

    it('should fire onInstallationUpdateAddUpgrade', async function () {
        const bot = new ActivityHandler();

        let onInstallationUpdateAddCalled = false;
        bot.onInstallationUpdateAdd(async (context, next) => {
            onInstallationUpdateAddCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.InstallationUpdate, action: 'add-upgrade' }, bot);
        assert(onInstallationUpdateAddCalled);
    });

    it('should fire onInstallationUpdateRemove', async function () {
        const bot = new ActivityHandler();

        let onInstallationUpdateRemoveCalled = false;
        bot.onInstallationUpdateRemove(async (context, next) => {
            onInstallationUpdateRemoveCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.InstallationUpdate, action: 'remove' }, bot);
        assert(onInstallationUpdateRemoveCalled);
    });

    it('should fire onInstallationUpdateRemoveUpgrade', async function () {
        const bot = new ActivityHandler();

        let onInstallationUpdateRemoveCalled = false;
        bot.onInstallationUpdateRemove(async (context, next) => {
            onInstallationUpdateRemoveCalled = true;
            await next();
        });

        await processActivity({ type: ActivityTypes.InstallationUpdate, action: 'remove-upgrade' }, bot);
        assert(onInstallationUpdateRemoveCalled);
    });

    it('should fire onAdaptiveCardInvoke', async function () {
        const bot = new ActivityHandler();

        let onAdpativeCardInvokeCalled = false;
        bot.onAdaptiveCardInvoke = async () => {
            onAdpativeCardInvokeCalled = true;
            return { statusCode: 200, value: 'called' };
        };

        await processActivity(
            {
                type: ActivityTypes.Invoke,
                name: 'adaptiveCard/action',
                value: {
                    action: {
                        type: 'Action.Execute',
                    },
                },
            },
            bot
        );
        assert(onAdpativeCardInvokeCalled);
    });

    it('should fire onUnrecognizedActivityType', async function () {
        const bot = new ActivityHandler();

        let onUnrecognizedActivityTypeCalled = false;
        bot.onUnrecognizedActivityType(async (context, next) => {
            onUnrecognizedActivityTypeCalled = true;
            await next();
        });

        await processActivity({ type: 'foo' }, bot);
        assert(onUnrecognizedActivityTypeCalled);
    });

    it('should fire onDialog', async function () {
        const bot = new ActivityHandler();

        let onDialogCalled = false;
        bot.onDialog(async (context, next) => {
            onDialogCalled = true;
            await next();
        });

        await processActivity({ type: 'foo' }, bot);
        assert(onDialogCalled);
    });

    describe('ActivityHandler.onSearchInvoke', function () {
        it('should fire onSearchInvoke', async function () {
            const activity = {
                type: ActivityTypes.Invoke,
                name: 'application/search',
                value: {
                    kind: 'search',
                    queryText: 'test bot',
                    queryOptions: {
                        skip: 5,
                        top: 10,
                    },
                    context: 'bot framework',
                },
            };

            await assertonSearchInvoke(activity, activity.value.kind);
        });

        it('should throw on onSearchInvoke activity missing value', async function () {
            const activity = {
                type: ActivityTypes.Invoke,
                name: 'application/search',
            };

            await assertSearchResultError(activity, 'Missing value property for search');
        });

        it('should throw on onSearchInvoke activity missing kind', async function () {
            const activity = {
                type: ActivityTypes.Invoke,
                name: 'application/search',
                value: {
                    queryText: 'test bot',
                },
            };

            await assertSearchResultError(activity, 'Missing kind property for search.');
        });

        it('should not throw on onSearchInvoke activity missing kind when channel is msTeams', async function () {
            const activity = {
                type: ActivityTypes.Invoke,
                name: 'application/search',
                channelId: Channels.Msteams,
                value: {
                    queryText: 'test bot',
                    queryOptions: {
                        skip: 5,
                        top: 10,
                    },
                },
            };

            await assertonSearchInvoke(activity, 'search');
        });

        it('should throw on onSearchInvoke activity missing queryText', async function () {
            const activity = {
                type: ActivityTypes.Invoke,
                name: 'application/search',
                value: {
                    kind: 'search',
                },
            };

            await assertSearchResultError(activity, 'Missing queryText for search.');
        });

        async function assertonSearchInvoke(activity, expectedKind) {
            const bot = new ActivityHandler();
            const testAdapter = new TestAdapter();

            let onSearchInvokeCalled = false;
            let value = null;
            bot.onSearchInvoke = async (context, invokeValue) => {
                onSearchInvokeCalled = true;
                value = invokeValue;
                return { statusCode: 200, value: 'called' };
            };

            const context = new TurnContext(testAdapter, activity);
            await bot.run(context);

            assert(onSearchInvokeCalled);
            assert.equal(activity.value.queryText, value.queryText, 'missing query text');
            assert.equal(expectedKind, value.kind, 'missing kind');
            assert.equal(activity.value.queryOptions.skip, value.queryOptions.skip, 'missing skip');
            assert.equal(activity.value.queryOptions.top, value.queryOptions.top, 'missing top');
            assert.equal(activity.value.context, value.context, 'missing context');
        }

        async function assertSearchResultError(activity, errorMessage) {
            const bot = new ActivityHandler();
            const testAdapter = new TestAdapter();

            let onSearchInvokeCalled = false;
            bot.onSearchInvoke = async (_context, _invokeValue) => {
                onSearchInvokeCalled = true;
                return { statusCode: 200, value: 'called' };
            };

            const context = new TurnContext(testAdapter, activity);
            await bot.run(context);

            assert(!onSearchInvokeCalled, 'Search should fail to be called due to invalid activity.value');
            const responseValue = testAdapter.activeQueue[0].value;
            assert.equal(400, responseValue.status);
            assert.equal('application/vnd.microsoft.error', responseValue.body.type);
            assert.equal('BadRequest', responseValue.body.value.code);
            assert.equal(errorMessage, responseValue.body.value.message);
        }
    });

    describe('should by default', function () {
        let onTurnCalled = false;
        let onMessageCalled = false;
        let onMessageUpdateCalled = false;
        let onMessageDeleteCalled = false;
        let onCommandActivityCalled = false;
        let onCommandResultActivityCalled = false;
        let onConversationUpdateCalled = false;
        let onMembersAddedCalled = false;
        let onMembersRemovedCalled = false;
        let onMessageReactionCalled = false;
        let onReactionsAddedCalled = false;
        let onReactionsRemovedCalled = false;
        let onEventCalled = false;
        let onTokenResponseEventCalled = false;
        let onUnrecognizedActivityTypeCalled = false;
        let onDialogCalled = false;

        afterEach(function () {
            onTurnCalled = false;
            onMessageCalled = false;
            onMessageUpdateCalled = false;
            onMessageDeleteCalled = false;
            onCommandActivityCalled = false;
            onCommandResultActivityCalled = false;
            onConversationUpdateCalled = false;
            onMembersAddedCalled = false;
            onMembersRemovedCalled = false;
            onMessageReactionCalled = false;
            onReactionsAddedCalled = false;
            onReactionsRemovedCalled = false;
            onEventCalled = false;
            onTokenResponseEventCalled = false;
            onUnrecognizedActivityTypeCalled = false;
            onDialogCalled = false;
        });

        function assertContextAndNext(context, next) {
            assert(context, 'context not found');
            assert(next, 'next not found');
        }

        function assertFalseFlag(flag, ...args) {
            assert(!flag, `${args[0]}Called should not be true before the ${args.join(', ')} handlers are called.`);
        }

        function assertTrueFlag(flag, ...args) {
            assert(flag, `${args[0]}Called should be true after the ${args[0]} handlers are called.`);
        }

        it('call "onTurn" handlers then dispatch by Activity Type "Message"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onConversationUpdateCalled, 'onMessage', 'onTurn');
                await next();
            });

            bot.onMessage(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onConversationUpdateCalled, 'onMessage', 'onTurn');
                assert(!onMessageCalled, 'onMessage should not be true before onTurn and onMessage handlers complete.');
                onMessageCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.Message }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onMessageCalled, 'onMessage');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "Command"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onCommandActivityCalled, 'onCommandActivity', 'onTurn');
                await next();
            });

            bot.onCommand(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onCommandActivityCalled, 'onCommandActivity', 'onTurn');
                onCommandActivityCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.Command }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onCommandActivityCalled, 'onCommandActivity');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "CommandResult"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onCommandResultActivityCalled, 'onCommandResultActivity', 'onTurn');
                await next();
            });

            bot.onCommandResult(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onCommandResultActivityCalled, 'onCommandResultActivity', 'onTurn');
                onCommandResultActivityCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.CommandResult }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onCommandResultActivityCalled, 'onCommandResultActivity');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "MessageUpdate"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMessageUpdateCalled, 'onMessageUpdate', 'onTurn');
                await next();
            });

            bot.onMessageUpdate(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMessageUpdateCalled, 'onMessageUpdate', 'onTurn');
                onMessageUpdateCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageUpdate }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onMessageUpdateCalled, 'onMessageUpdate');
        });

        it('call "MessageUpdate" then dispatch the its respective subtypes', async function () {
            let dispatchMessageUpdateActivityCalled = false;
            class MessageUpdateActivityHandler extends ActivityHandler {
                dispatchMessageUpdateActivity(context) {
                    assert(context, 'context not found');
                    assertTrueFlag(onMessageUpdateCalled, 'onMessageUpdate');
                    assertFalseFlag(
                        dispatchMessageUpdateActivityCalled,
                        'dispatchMessageUpdateActivity',
                        'onMessageUpdate'
                    );
                    dispatchMessageUpdateActivityCalled = true;
                }
            }

            const bot = new MessageUpdateActivityHandler();

            bot.onMessageUpdate(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onMessageUpdateCalled, 'onMessageUpdate', 'onTurn');
                onMessageUpdateCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageUpdate }, bot);
            assertTrueFlag(onMessageUpdateCalled, 'onMessageUpdate');
            assertTrueFlag(dispatchMessageUpdateActivityCalled, 'dispatchMessageUpdateActivity');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "MessageDelete"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMessageDeleteCalled, 'onMessageDelete', 'onTurn');
                await next();
            });

            bot.onMessageDelete(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMessageDeleteCalled, 'onMessageDelete', 'onTurn');
                onMessageDeleteCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageDelete }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onMessageDeleteCalled, 'onMessageDelete');
        });

        it('call "MessageDelete" then dispatch the its respective subtypes', async function () {
            let dispatchMessageDeleteActivityCalled = false;
            class MessageDeleteActivityHandler extends ActivityHandler {
                dispatchMessageDeleteActivity(context) {
                    assert(context, 'context not found');
                    assertTrueFlag(onMessageDeleteCalled, 'onMessageDelete');
                    assertFalseFlag(
                        dispatchMessageDeleteActivityCalled,
                        'dispatchMessageDeleteActivity',
                        'onMessageDelete'
                    );
                    dispatchMessageDeleteActivityCalled = true;
                }
            }

            const bot = new MessageDeleteActivityHandler();

            bot.onMessageDelete(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onMessageDeleteCalled, 'onMessageDelete', 'onTurn');
                onMessageDeleteCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageDelete }, bot);
            assertTrueFlag(onMessageDeleteCalled, 'onMessageDelete');
            assertTrueFlag(dispatchMessageDeleteActivityCalled, 'dispatchMessageDeleteActivity');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "ConversationUpdate"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onConversationUpdateCalled, 'onConversationUpdate', 'onTurn');
                await next();
            });

            bot.onConversationUpdate(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onConversationUpdateCalled, 'onConversationUpdate', 'onTurn');
                onConversationUpdateCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.ConversationUpdate }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onConversationUpdateCalled, 'onConversationUpdate');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "ConversationUpdate"-subtype "MembersAdded"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMembersAddedCalled, 'onMembersAdded', 'onTurn');
                await next();
            });

            bot.onMembersAdded(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMembersAddedCalled, 'onMembersAdded', 'onTurn');
                onMembersAddedCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.ConversationUpdate, membersAdded: [{ id: 1 }] }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn', 'onMembersAdded');
            assertTrueFlag(onMembersAddedCalled, 'onMembersAdded', 'onTurn');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "ConversationUpdate"-subtype "MembersRemoved"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMembersRemovedCalled, 'onMembersRemoved', 'onTurn');
                await next();
            });

            bot.onMembersRemoved(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMembersRemovedCalled, 'onMembersRemoved', 'onTurn');
                onMembersRemovedCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.ConversationUpdate, membersRemoved: [{ id: 1 }] }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn', 'onMembersRemoved');
            assertTrueFlag(onMembersRemovedCalled, 'onMembersRemoved', 'onTurn');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "MessageReaction"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                await next();
            });

            bot.onMessageReaction(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                onMessageReactionCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageReaction, reactionsRemoved: [{ type: 'like' }] }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn', 'onMembersAdded');
            assertTrueFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "MessageReaction"-subtype "ReactionsAdded"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                assertFalseFlag(onReactionsRemovedCalled, 'onReactionsRemoved', 'onMessageReaction', 'onTurn');
                await next();
            });

            bot.onMessageReaction(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                onMessageReactionCalled = true;
                assertFalseFlag(onReactionsRemovedCalled, 'onReactionsRemoved', 'onMessageReaction', 'onTurn');
                await next();
            });

            bot.onReactionsAdded(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertTrueFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                assertFalseFlag(onReactionsAddedCalled, 'onReactionsAdded', 'onMessageReaction', 'onTurn');
                onReactionsAddedCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageReaction, reactionsAdded: [{ type: 'like' }] }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn', 'onMembersAdded');
            assertTrueFlag(onMessageReactionCalled, 'onMessageReaction');
            assertTrueFlag(onReactionsAddedCalled, 'onReactionsAdded', 'onMessageReaction', 'onTurn');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "MessageReaction"-subtype "ReactionsRemoved"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                assertFalseFlag(onReactionsRemovedCalled, 'onReactionsRemoved', 'onMessageReaction', 'onTurn');
                await next();
            });

            bot.onMessageReaction(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                onMessageReactionCalled = true;
                assertFalseFlag(onReactionsRemovedCalled, 'onReactionsRemoved', 'onMessageReaction', 'onTurn');
                await next();
            });

            bot.onReactionsRemoved(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertTrueFlag(onMessageReactionCalled, 'onMessageReaction', 'onTurn');
                assertFalseFlag(onReactionsRemovedCalled, 'onReactionsRemoved', 'onMessageReaction', 'onTurn');
                onReactionsRemovedCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.MessageReaction, reactionsRemoved: [{ type: 'like' }] }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn', 'onMembersAdded');
            assertTrueFlag(onMessageReactionCalled, 'onMessageReaction');
            assertTrueFlag(onReactionsRemovedCalled, 'onReactionsRemoved');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "event"', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onEventCalled, 'onEvent', 'onTurn');
                await next();
            });

            bot.onEvent(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onEventCalled, 'onEvent', 'onTurn');
                assert(!onEventCalled, 'onEvent should not be true before onTurn and onEvent handlers complete.');
                onEventCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.Event }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onEventCalled, 'onEvent');
        });

        it('call "onTurn" handlers then dispatch by Activity Type "event" with name "healthtokens/responseCheck', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onEventCalled, 'onEvent', 'onTurn');
                assertFalseFlag(onTokenResponseEventCalled, 'onTokenResponseEvent', 'onTurn', 'onEvent');
                await next();
            });

            bot.onEvent(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onEventCalled, 'onEvent', 'onTurn');
                onEventCalled = true;
                assertFalseFlag(onTokenResponseEventCalled, 'onTokenResponseEvent', 'onTurn', 'onEvent');
                await next();
            });

            bot.onTokenResponseEvent(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertTrueFlag(onEventCalled, 'onEvent');
                assertFalseFlag(onTokenResponseEventCalled, 'onTokenResponseEvent', 'onTurn', 'onEvent');
                assert(
                    !onTokenResponseEventCalled,
                    'onEvent should not be true before onTurn and onEvent handlers complete.'
                );
                onTokenResponseEventCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.Event, name: tokenResponseEventName }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onEventCalled, 'onEvent');
            assertTrueFlag(onTokenResponseEventCalled, 'onTokenResponseEvent');
        });

        it('call "onTurn" handlers then dispatch for unrecognized ActivityTypes', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onUnrecognizedActivityTypeCalled, 'onUnrecognizedActivityType', 'onTurn');
                await next();
            });

            bot.onUnrecognizedActivityType(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onUnrecognizedActivityTypeCalled, 'onUnrecognizedActivityType', 'onTurn');
                assert(
                    !onUnrecognizedActivityTypeCalled,
                    'onUnrecognizedActivityType should not be true before onTurn and onUnrecognizedActivityType handlers complete.'
                );
                onUnrecognizedActivityTypeCalled = true;
                await next();
            });

            await processActivity({ type: 'not-a-real-type' }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onUnrecognizedActivityTypeCalled, 'onUnrecognizedActivityType');
        });

        it('call "onTurn" handlers then by default dispatch to onDialog for all ActivityTypes', async function () {
            const bot = new ActivityHandler();
            bot.onTurn(async (context, next) => {
                assertContextAndNext(context, next);
                assertFalseFlag(onTurnCalled, 'onTurn');
                onTurnCalled = true;
                assertFalseFlag(onDialogCalled, 'onDialog', 'onTurn');
                await next();
            });

            bot.onDialog(async (context, next) => {
                assertContextAndNext(context, next);
                assertTrueFlag(onTurnCalled, 'onTurn');
                assertFalseFlag(onDialogCalled, 'onDialog', 'onTurn');
                assert(!onDialogCalled, 'onDialog should not be true before onTurn and onDialog handlers complete.');
                onDialogCalled = true;
                await next();
            });

            await processActivity({ type: ActivityTypes.Event }, bot);
            assertTrueFlag(onTurnCalled, 'onTurn');
            assertTrueFlag(onDialogCalled, 'onDialog');
        });
    });
});
