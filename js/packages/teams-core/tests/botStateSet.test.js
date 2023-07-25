const assert = require('assert');

const { TurnContext, BotStateSet, MemoryStorage, UserState, ConversationState, TestAdapter } = require('../lib');

const receivedMessage = {
    text: 'received',
    type: 'message',
    channelId: 'test',
    from: { id: 'testuser' },
    conversation: { id: 'conv' },
};

describe('BotStateSet', function () {
    this.timeout(5000);

    const adapter = new TestAdapter();
    const turnContext = new TurnContext(adapter, receivedMessage);

    it('should use() and call readAll() on a single BotState plugin.', async function () {
        const memoryStorage = new MemoryStorage();
        const userState = new UserState(memoryStorage);
        const convState = new ConversationState(memoryStorage);

        const botStateSet = new BotStateSet(userState).add(convState);
        assert.equal(botStateSet.botStates.length, 2);
    });

    it('BotStateSet_LoadSave', async function () {
        const memoryStorage = new MemoryStorage();

        {
            const userState = new UserState(memoryStorage);
            const convState = new ConversationState(memoryStorage);
            const botStateSet = new BotStateSet(userState, convState);

            const userProperty = userState.createProperty('userCount');
            const convProperty = convState.createProperty('convCount');

            assert.equal(botStateSet.botStates.length, 2);

            const userCount = await userProperty.get(turnContext, 0);
            assert.equal(userCount, 0);
            const convCount = await convProperty.get(turnContext, 0);
            assert.equal(convCount, 0);

            await userProperty.set(turnContext, 10);
            await convProperty.set(turnContext, 20);

            await botStateSet.saveAllChanges(turnContext);
        }

        {
            const userState = new UserState(memoryStorage);
            const convState = new ConversationState(memoryStorage);
            const botStateSet = new BotStateSet(userState, convState);

            const userProperty = userState.createProperty('userCount');
            const convProperty = convState.createProperty('convCount');

            assert.equal(botStateSet.botStates.length, 2);

            await botStateSet.loadAll(turnContext);

            const userCount = await userProperty.get(turnContext, 0);
            assert.equal(userCount, 10);
            const convCount = await convProperty.get(turnContext, 0);
            assert.equal(convCount, 20);
        }
    });
});
