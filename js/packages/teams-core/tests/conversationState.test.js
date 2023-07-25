const assert = require('assert');
const { TurnContext, ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('../');

const receivedMessage = { text: 'received', type: 'message', channelId: 'test', conversation: { id: 'convo' } };
const missingChannelId = { text: 'received', type: 'message', conversation: { id: 'convo' } };
const missingConversation = { text: 'received', type: 'message', channelId: 'test' };

describe('ConversationState', function () {
    this.timeout(5000);

    const storage = new MemoryStorage();
    const adapter = new TestAdapter();
    const context = new TurnContext(adapter, receivedMessage);
    const conversationState = new ConversationState(storage);
    it('should load and save state from storage.', async function () {
        // Simulate a "Turn" in a conversation by loading the state,
        // changing it and then saving the changes to state.
        await conversationState.load(context);
        const key = conversationState.getStorageKey(context);
        const state = conversationState.get(context);
        assert(state, 'State not loaded');
        assert(key, 'Key not found');
        state.test = 'foo';
        await conversationState.saveChanges(context);

        // Check the storage to see if the changes to state were saved.
        const items = await storage.read([key]);
        assert(items[key], 'Saved state not found in storage.');
        assert(items[key].test === 'foo', 'Missing test value in stored state.');
    });

    it('should ignore any activities that aren\'t "endOfConversation".', async function () {
        await conversationState.load(context);
        const key = conversationState.getStorageKey(context);
        assert(conversationState.get(context).test === 'foo', 'invalid initial state');
        await context.sendActivity({ type: ActivityTypes.Message, text: 'foo' });

        const items = await storage.read([key]);
        assert(items[key].test != null, "state cleared and shouldn't have been.");
    });

    it('should reject with error if channelId missing.', function () {
        const ctx = new TurnContext(adapter, missingChannelId);
        assert.throws(() => conversationState.load(ctx), Error('missing activity.channelId'));
    });

    it('should reject with error if conversation missing.', function () {
        const ctx = new TurnContext(adapter, missingConversation);
        assert.throws(() => conversationState.load(ctx), Error('missing activity.conversation.id'));
    });

    it('should throw NO_KEY error if getStorageKey() returns falsey value.', async function () {
        conversationState.getStorageKey = (_turnContext) => undefined;
        await assert.rejects(
            conversationState.load(context, true),
            new Error('ConversationState: overridden getStorageKey method did not return a key.')
        );
    });
});
