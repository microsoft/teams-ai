const assert = require('assert');
const { TurnContext, UserState, MemoryStorage, TestAdapter } = require('../');

const receivedMessage = { text: 'received', type: 'message', channelId: 'test', from: { id: 'user' } };
const missingChannelId = { text: 'received', type: 'message', from: { id: 'user' } };
const missingFrom = { text: 'received', type: 'message', channelId: 'test' };

describe('UserState', function () {
    this.timeout(5000);

    const storage = new MemoryStorage();
    const adapter = new TestAdapter();
    const context = new TurnContext(adapter, receivedMessage);
    const userState = new UserState(storage);
    it('should load and save state from storage.', async function () {
        // Simulate a "Turn" in a conversation by loading the state,
        // changing it and then saving the changes to state.
        await userState.load(context);
        const key = userState.getStorageKey(context);
        const state = userState.get(context);
        assert(state, 'State not loaded');
        assert(key, 'Key not found');
        state.test = 'foo';
        await userState.saveChanges(context);

        // Check the storage to see if the changes to state were saved.
        const items = await storage.read([key]);
        assert(Object.prototype.hasOwnProperty.call(items, key), 'Saved state not found in storage.');
        assert(items[key].test === 'foo', 'Missing test value in stored state.');
    });

    it('should reject with error if channelId missing.', function () {
        const ctx = new TurnContext(adapter, missingChannelId);
        assert.throws(() => userState.load(ctx), Error('missing activity.channelId'));
    });

    it('should reject with error if from missing.', function () {
        const ctx = new TurnContext(adapter, missingFrom);
        assert.throws(() => userState.load(ctx), Error('missing activity.from.id'));
    });

    it('should throw NO_KEY error if getStorageKey() returns falsey value.', async function () {
        userState.getStorageKey = (_turnContext) => undefined;
        await assert.rejects(
            userState.load(context, true),
            new Error('UserState: overridden getStorageKey method did not return a key.')
        );
    });
});
