const assert = require('assert');
const { ActivityHandlerBase, ActivityTypes, TurnContext, TestAdapter } = require('../lib');

describe('ActivityHandlerBase', function () {
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

    let onTurnActivityCalled = false;
    let onMessageCalled = false;
    let onMessageUpdateActivityCalled = false;
    let onMessageDeleteActivityCalled = false;
    let onConversationUpdateActivityCalled = false;
    let onMessageReactionCalled = false;
    let onEventCalled = false;
    let onEndOfConversationCalled = false;
    let onTypingCalled = false;
    let onInstallationUpdateCalled = false;
    let onUnrecognizedActivity = false;

    afterEach(function () {
        onTurnActivityCalled = false;
        onMessageCalled = false;
        onMessageUpdateActivityCalled = false;
        onMessageDeleteActivityCalled = false;
        onConversationUpdateActivityCalled = false;
        onMessageReactionCalled = false;
        onEventCalled = false;
        onEndOfConversationCalled = false;
        onTypingCalled = false;
        onInstallationUpdateCalled = false;
        onUnrecognizedActivity = false;
    });

    it('should throw an error if context is not passed in', async function () {
        const bot = new ActivityHandlerBase();

        await assert.rejects(bot.run(), Error('Missing TurnContext parameter'));
    });

    it('should throw an error if context.activity is falsey', async function () {
        const bot = new ActivityHandlerBase();

        await assert.rejects(bot.run({}), Error('TurnContext does not include an activity'));
    });

    it('should throw an error if context.activity.type is falsey', async function () {
        const bot = new ActivityHandlerBase();

        await assert.rejects(bot.run({ activity: {} }), Error('Activity is missing its type'));
    });

    class OverrideOnTurnActivity extends ActivityHandlerBase {
        constructor() {
            super();
            this.overrideOnTurnActivityCalled = false;
        }
        async onTurnActivity(context) {
            assert(context, 'context not found');
            this.overrideOnTurnActivityCalled = true;
            super.onTurnActivity(context);
        }
    }
    it('should call onActivity from run()', async function () {
        const bot = new OverrideOnTurnActivity();
        await processActivity({ type: 'any' }, bot);
        assert(bot.overrideOnTurnActivityCalled);
    });

    class UpdatedActivityHandler extends ActivityHandlerBase {
        async onTurnActivity(context) {
            assert(context, 'context not found');
            onTurnActivityCalled = true;
            super.onTurnActivity(context);
        }

        async onMessageActivity(context) {
            assert(context, 'context not found');
            onMessageCalled = true;
        }

        async onMessageUpdateActivity(context) {
            assert(context, 'context not found');
            onMessageUpdateActivityCalled = true;
        }

        async onMessageDeleteActivity(context) {
            assert(context, 'context not found');
            onMessageDeleteActivityCalled = true;
        }

        async onConversationUpdateActivity(context) {
            assert(context, 'context not found');
            onConversationUpdateActivityCalled = true;
        }

        async onMessageReactionActivity(context) {
            assert(context, 'context not found');
            onMessageReactionCalled = true;
        }

        async onEventActivity(context) {
            assert(context, 'context not found');
            onEventCalled = true;
        }

        async onEndOfConversationActivity(context) {
            assert(context, 'context not found');
            onEndOfConversationCalled = true;
        }

        async onTypingActivity(context) {
            assert(context, 'context not found');
            onTypingCalled = true;
        }

        async onInstallationUpdateActivity(context) {
            assert(context, 'context not found');
            onInstallationUpdateCalled = true;
        }

        async onUnrecognizedActivity(context) {
            assert(context, 'context not found');
            onUnrecognizedActivity = true;
        }
    }

    it('should dispatch by ActivityType in onTurnActivity()', async function () {
        const bot = new UpdatedActivityHandler();

        await processActivity({ type: ActivityTypes.Message }, bot);
        await processActivity({ type: ActivityTypes.MessageUpdate }, bot);
        await processActivity({ type: ActivityTypes.MessageDelete }, bot);
        await processActivity({ type: ActivityTypes.ConversationUpdate }, bot);
        await processActivity({ type: ActivityTypes.MessageReaction }, bot);
        await processActivity({ type: ActivityTypes.Event }, bot);
        await processActivity({ type: ActivityTypes.EndOfConversation }, bot);
        await processActivity({ type: ActivityTypes.Typing }, bot);
        await processActivity({ type: ActivityTypes.InstallationUpdate }, bot);
        await processActivity({ type: 'unrecognized' }, bot);

        assert(onTurnActivityCalled, 'onTurnActivity was not called');
        assert(onMessageCalled, 'onMessageActivity was not called');
        assert(onMessageUpdateActivityCalled, 'onMessageUpdateActivity was not called');
        assert(onMessageDeleteActivityCalled, 'onMessageDeleteActivity was not called');
        assert(onConversationUpdateActivityCalled, 'onConversationUpdateActivity was not called');
        assert(onMessageReactionCalled, 'onMessageReactionActivity was not called');
        assert(onEventCalled, 'onEventActivity was not called');
        assert(onEndOfConversationCalled, 'onEndOfConversationCalled was not called');
        assert(onTypingCalled, 'onTypingCalled was not called');
        assert(onInstallationUpdateCalled, 'onInstallationUpdateCalled was not called');
        assert(onUnrecognizedActivity, 'onUnrecognizedActivity was not called');
    });

    describe('onConversationUpdateActivity', function () {
        class ConversationUpdateActivityHandler extends ActivityHandlerBase {
            async onTurnActivity(context) {
                assert(context, 'context not found');
                onTurnActivityCalled = true;
                super.onTurnActivity(context);
            }

            async onConversationUpdateActivity(context) {
                assert(context, 'context not found');
                onConversationUpdateActivityCalled = true;
                super.onConversationUpdateActivity(context);
            }

            async onMembersAddedActivity(membersAdded, context) {
                const value = context.activity.value;
                if (value && value.skipSubtype) {
                    throw new Error('should not have reached onMembersAddedActivity');
                }
                assert(context, 'context not found');
                assert(membersAdded, 'membersAdded not found');
                assert(membersAdded.length === 1, `unexpected number of membersAdded: ${membersAdded.length}`);
                onMembersAddedActivityCalled = true;
            }

            async onMembersRemovedActivity(membersRemoved, context) {
                const value = context.activity.value;
                if (value && value.skipSubtype) {
                    throw new Error('should not have reached onMembersRemovedActivity');
                }
                assert(context, 'context not found');
                assert(membersRemoved, 'membersRemoved not found');
                assert(membersRemoved.length === 1, `unexpected number of membersRemoved: ${membersRemoved.length}`);
                onMembersRemovedActivityCalled = true;
            }
        }

        let onTurnActivityCalled = false;
        let onConversationUpdateActivityCalled = false;
        let onMembersAddedActivityCalled = false;
        let onMembersRemovedActivityCalled = false;

        afterEach(function () {
            onTurnActivityCalled = false;
            onConversationUpdateActivityCalled = false;
            onMembersAddedActivityCalled = false;
            onMembersRemovedActivityCalled = false;
        });

        function createConvUpdateActivity(recipientId, AddedOrRemoved, skipSubtype) {
            const recipient = { id: recipientId };
            const activity = { type: ActivityTypes.ConversationUpdate, recipient, value: {}, ...AddedOrRemoved };
            if (skipSubtype) {
                activity.value.skipSubtype = true;
            }
            return activity;
        }

        it("should call onMembersAddedActivity if the id of the member added does not match the recipient's id", async function () {
            const bot = new ConversationUpdateActivityHandler();
            const activity = createConvUpdateActivity('bot', { membersAdded: [{ id: 'user' }] });

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onConversationUpdateActivityCalled, 'onConversationUpdateActivity was not called');
            assert(onMembersAddedActivityCalled, 'onMembersAddedActivity was not called');
        });

        it("should call onMembersRemovedActivity if the id of the member removed does not match the recipient's id", async function () {
            const bot = new ConversationUpdateActivityHandler();
            const activity = createConvUpdateActivity('bot', { membersRemoved: [{ id: 'user' }] });

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onConversationUpdateActivityCalled, 'onConversationUpdateActivity was not called');
            assert(onMembersRemovedActivityCalled, 'onMembersRemovedActivity was not called');
        });

        it("should not call onMembersAddedActivity if the id of the member added matches the recipient's id", async function () {
            const bot = new ConversationUpdateActivityHandler();
            const activity = createConvUpdateActivity('bot', { membersAdded: [{ id: 'bot' }] }, true);

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onConversationUpdateActivityCalled, 'onConversationUpdateActivity was not called');
        });

        it("should not call onMembersRemovedActivity if the id of the member removed matches the recipient's id", async function () {
            const bot = new ConversationUpdateActivityHandler();
            const activity = createConvUpdateActivity('bot', { membersRemoved: [{ id: 'bot' }] }, true);

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onConversationUpdateActivityCalled, 'onConversationUpdateActivity was not called');
        });
    });

    describe('onMessageReaction', function () {
        class MessageReactionActivityHandler extends ActivityHandlerBase {
            async onTurnActivity(context) {
                assert(context, 'context not found');
                onTurnActivityCalled = true;
                super.onTurnActivity(context);
            }

            async onMessageReactionActivity(context) {
                assert(context, 'context not found');
                onMessageReactionActivityCalled = true;
                super.onMessageReactionActivity(context);
            }

            async onReactionsAddedActivity(reactionsAdded, context) {
                assert(context, 'context not found');
                assert(reactionsAdded, 'membersAdded not found');
                assert(reactionsAdded.length === 1, `unexpected number of reactionsAdded: ${reactionsAdded.length}`);
                onReactionsAddedActivityCalled = true;
            }

            async onReactionsRemovedActivity(reactionsRemoved, context) {
                assert(context, 'context not found');
                assert(reactionsRemoved, 'reactionsRemoved not found');
                assert(
                    reactionsRemoved.length === 1,
                    `unexpected number of reactionsRemoved: ${reactionsRemoved.length}`
                );
                onReactionsRemovedActivityCalled = true;
            }
        }

        let onTurnActivityCalled = false;
        let onMessageReactionActivityCalled = false;
        let onReactionsAddedActivityCalled = false;
        let onReactionsRemovedActivityCalled = false;

        afterEach(function () {
            onTurnActivityCalled = false;
            onMessageReactionActivityCalled = false;
            onReactionsAddedActivityCalled = false;
            onReactionsRemovedActivityCalled = false;
        });

        function createMsgReactActivity(recipientId, AddedOrRemoved) {
            const recipient = { id: recipientId };
            const activity = { type: ActivityTypes.MessageReaction, recipient, ...AddedOrRemoved };
            return activity;
        }

        it('should call onReactionsAddedActivity if reactionsAdded exists and reactionsAdded.length > 0', async function () {
            const bot = new MessageReactionActivityHandler();
            const activity = createMsgReactActivity('bot', { reactionsAdded: [{ type: 'like' }] });

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onMessageReactionActivityCalled, 'onMessageReactionActivity was not called');
            assert(onReactionsAddedActivityCalled, 'onReactionsAddedActivity was not called');
        });

        it('should call onReactionsRemovedActivity if reactionsRemoved exists and reactionsRemoved.length > 0', async function () {
            const bot = new MessageReactionActivityHandler();
            const activity = createMsgReactActivity('bot', { reactionsRemoved: [{ type: 'like' }] });

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onMessageReactionActivityCalled, 'onMessageReactionActivity was not called');
            assert(onReactionsRemovedActivityCalled, 'onReactionsRemovedActivity was not called');
        });

        it('should call onReactionsAddedActivity if reactionsAdded and onReactionsRemovedActivity if reactionsRemoved if they both exist and have items', async function () {
            const bot = new MessageReactionActivityHandler();
            const activity = createMsgReactActivity('bot', {
                reactionsAdded: [{ type: 'laugh' }],
                reactionsRemoved: [{ type: 'like' }],
            });

            await processActivity(activity, bot);

            assert(onTurnActivityCalled, 'onTurnActivity was not called');
            assert(onMessageReactionActivityCalled, 'onMessageReactionActivity was not called');
            assert(onReactionsAddedActivityCalled, 'onReactionsAddedActivity was not called');
            assert(onReactionsRemovedActivityCalled, 'onReactionsRemovedActivity was not called');
        });
    });
});
