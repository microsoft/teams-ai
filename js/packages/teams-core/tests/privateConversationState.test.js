const assert = require('assert');
const { TurnContext, ActivityTypes, PrivateConversationState, MemoryStorage, TestAdapter } = require('../');

const receivedMessage = {
    text: 'received',
    type: 'message',
    channelId: 'test',
    conversation: { id: 'convo' },
    from: { id: 'user' },
};
const missingChannelId = { text: 'received', type: 'message', conversation: { id: 'convo' }, from: { id: 'user' } };
const missingConversation = { text: 'received', type: 'message', channelId: 'test', from: { id: 'user' } };
const missingFrom = { text: 'received', type: 'message', channelId: 'test', conversation: { id: 'convo' } };

describe('PrivateConversationState', function () {
    this.timeout(5000);

    const storage = new MemoryStorage();
    const adapter = new TestAdapter();
    const context = new TurnContext(adapter, receivedMessage);
    const privateConversationState = new PrivateConversationState(storage);
    it('should load and save state from storage.', async function () {
        // Simulate a "Turn" in a conversation by loading the state,
        // changing it and then saving the changes to state.
        await privateConversationState.load(context);
        const key = privateConversationState.getStorageKey(context);
        const state = privateConversationState.get(context);
        assert(state, 'State not loaded');
        assert(key, 'Key not found');
        state.test = 'foo';
        await privateConversationState.saveChanges(context);

        // Check the storage to see if the changes to state were saved.
        const items = await storage.read([key]);
        assert(items[key] != null, 'Saved state not found in storage.');
        assert(items[key].test === 'foo', 'Missing test value in stored state.');
    });

    it('should ignore any activities that aren\'t "endOfConversation".', async function () {
        await privateConversationState.load(context);
        const key = privateConversationState.getStorageKey(context);
        assert(privateConversationState.get(context).test === 'foo', 'invalid initial state');
        await context.sendActivity({ type: ActivityTypes.Message, text: 'foo' });

        const items = await storage.read([key]);
        assert(items[key].test != null, "state cleared and shouldn't have been.");
    });

    it('should reject with error if channelId missing.', async function () {
        const ctx = new TurnContext(adapter, missingChannelId);
        assert.throws(() => privateConversationState.load(ctx), Error('missing activity.channelId'));
    });

    it('should reject with error if conversation missing.', async function () {
        const ctx = new TurnContext(adapter, missingConversation);
        assert.throws(() => privateConversationState.load(ctx), Error('missing activity.conversation.id'));
    });

    it('should reject with error if from missing.', async function () {
        const ctx = new TurnContext(adapter, missingFrom);
        assert.throws(() => privateConversationState.load(ctx), Error('missing activity.from.id'));
    });

    it('should throw NO_KEY error if getStorageKey() returns falsey value.', async function () {
        privateConversationState.getStorageKey = (_turnContext) => undefined;
        await assert.rejects(
            privateConversationState.load(context, true),
            new Error('PrivateConversationState: overridden getStorageKey method did not return a key.')
        );
    });
});
