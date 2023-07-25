const assert = require('assert');
const { BotState, MemoryStorage, TestAdapter, TurnContext } = require('../');

const storageKey = 'stateKey';

describe('BotStatePropertyAccessor', function () {
    this.timeout(5000);

    const receivedActivity = { text: 'received', type: 'message' };
    const storage = new MemoryStorage();
    const adapter = new TestAdapter();
    const botState = new BotState(storage, (context) => {
        assert(context, 'context not passed into storage stateKey factory.');
        return storageKey;
    });
    const staticContext = new TurnContext(adapter, receivedActivity);

    it('should use default value when a default value is assigned.', async function () {
        const USER_COUNT = 'userCount';
        const userProperty = botState.createProperty(USER_COUNT);

        const tAdapter = new TestAdapter(async (context) => {
            const userCount = await userProperty.get(context, 100);
            assert(userCount === 100, 'default value for PropertyAccessor was not used.');
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should return undefined when default value is not assigned.', async function () {
        const NO_DEFAULT_VALUE = 'noValue';
        const testProperty = botState.createProperty(NO_DEFAULT_VALUE);

        const tAdapter = new TestAdapter(async (context) => {
            const testValue = await testProperty.get(context);
            assert(testValue === undefined, "PropertyAccessor's value was not undefined.");
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should save changes to registered Property multiple times.', async function () {
        const MESSAGE_COUNT = 'messageCount';
        const messageProperty = botState.createProperty(MESSAGE_COUNT);

        const tAdapter = new TestAdapter(async (context) => {
            let messageCount = await messageProperty.get(context, 0);
            messageCount++;
            await messageProperty.set(context, messageCount);
            await context.sendActivity(messageCount.toString());
            await botState.saveChanges(context);
        });

        await tAdapter
            .test('Hello world!', '1', 'messageCount was not incremented.')
            .test('Hello world!', '2', 'messageCount was not properly saved.');
    });

    it('should delete property value on state.', async function () {
        const BOOLEAN_PROPERTY = 'booleanProperty';
        const booleanProperty = botState.createProperty(BOOLEAN_PROPERTY);

        const tAdapter = new TestAdapter(async (context) => {
            // Retrieve the property value, change it to true, then set it in state.
            let booleanValue = await booleanProperty.get(context);
            booleanValue = true;
            await booleanProperty.set(context, booleanValue);

            // Retrieve the property value which should be true.
            const retrievedValue = await booleanProperty.get(context);
            assert(retrievedValue, 'value for PropertyAccessor was not properly saved.');

            // Delete the value from state, and verify that the value is now undefined.
            await booleanProperty.delete(context);
            const noPropertyValue = await booleanProperty.get(context);
            assert(noPropertyValue === undefined, 'value for PropertyAccessor was not properly deleted.');
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should not delete anything if property not found in current state.', async function () {
        const DOES_NOT_EXIST = 'doesNotExist';
        const doesNotExistProperty = botState.createProperty(DOES_NOT_EXIST);

        const tAdapter = new TestAdapter(async (context) => {
            // Call delete on the doesNotExistProperty which has not been registered to the state on staticContext.
            // This should not blow up.
            await doesNotExistProperty.delete(staticContext);
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should successfully set default value if default value is an Array.', async function () {
        const NUMBERS_PROPERTY = 'numbersProperty';
        const numbersProperty = botState.createProperty(NUMBERS_PROPERTY);

        const tAdapter = new TestAdapter(async (context) => {
            const numbersValue = await numbersProperty.get(context, [1]);
            assert(Array.isArray(numbersValue), 'default value for PropertyAccessor was not properly set.');
            assert(numbersValue.length === 1, `numbersValue.length should be 1, not ${numbersValue.length}.`);
            assert(numbersValue[0] === 1, `numbersValue[0] should be 1, not ${numbersValue[0]}.`);
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should successfully set default value if default value is an Object.', async function () {
        const ADDRESS_PROPERTY = 'addressProperty';
        const addressProperty = botState.createProperty(ADDRESS_PROPERTY);

        const tAdapter = new TestAdapter(async (context) => {
            const addressValue = await addressProperty.get(context, {
                street: '1 Microsoft Way',
                zipCode: 98052,
                state: 'WA',
            });
            assert(typeof addressValue === 'object', 'default value for PropertyAccessor was not properly set.');
            assert(
                addressValue.street === '1 Microsoft Way',
                'default value for PropertyAccessor was not properly set.'
            );
            assert(addressValue.zipCode === 98052, 'default value for PropertyAccessor was not properly set.');
            assert(addressValue.state === 'WA', 'default value for PropertyAccessor was not properly set.');
            await botState.saveChanges(context);
        });

        await tAdapter.receiveActivity('Hello world!');
    });

    it('should get() initial default value when a second get() with a second default value is called.', async function () {
        const testState = new BotState(storage, (context) => {
            assert(context, 'context was not passed into storage stateKey factory.');
            return 'testState';
        });
        const WORD_PROPERTY = 'word';
        const wordProperty = testState.createProperty(WORD_PROPERTY);

        const tAdapter = new TestAdapter(async (turnContext) => {
            let word = await wordProperty.get(turnContext, 'word');
            assert(word === 'word', 'default value for "wordProperty" was not properly set.');

            word = await wordProperty.get(turnContext, 'second');
            assert(word === 'word', `expected value of "word" for word, received "${word}".`);
        });

        await tAdapter.receiveActivity('Hello world!');
    });
});
