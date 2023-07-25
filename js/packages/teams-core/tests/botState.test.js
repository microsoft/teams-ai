const assert = require('assert');
const {
    TurnContext,
    BotState,
    MemoryStorage,
    TestAdapter,
    CACHED_BOT_STATE_SKIP_PROPERTIES_HANDLER_KEY,
} = require('../');

const receivedMessage = { text: 'received', type: 'message' };
const storageKey = 'stateKey';

const houseSectionsSample = {
    house: {
        kitchen: {
            refrigerator: {
                fridge: 1,
                freezer: 1,
            },
            chair: 6,
            table: 1,
        },
        bathroom: {
            toilet: 1,
            shower: {
                showerhead: 1,
                bathtub: 1,
                shampoo: 2,
                towel: 3,
            },
        },
        bedroom: {
            chair: 1,
            bed: {
                pillow: 3,
                sheet: 1,
                duvet: 1,
            },
            closet: {
                hanger: {
                    shirt: 6,
                },
                shoes: 4,
                pants: 5,
            },
        },
    },
};

function cachedState(context, stateKey) {
    const cached = context.turnState.get(stateKey);
    return cached ? cached.state : undefined;
}

describe('BotState', function () {
    this.timeout(5000);

    const storage = new MemoryStorage();
    const adapter = new TestAdapter();
    const context = new TurnContext(adapter, receivedMessage);
    const botState = new BotState(storage, (context) => {
        assert(context, 'context not passed into storage stateKey factory.');
        return storageKey;
    });
    it('should return undefined from get() if nothing cached.', async function () {
        const state = botState.get(context);
        assert(state === undefined, 'state returned.');
    });

    it('should load and save state from storage.', async function () {
        await botState.load(context);
        const state = cachedState(context, botState.stateKey);
        assert(state, 'State not loaded');
        state.test = 'foo';
        await botState.saveChanges(context);

        const items = await storage.read([storageKey]);
        assert(Object.prototype.hasOwnProperty.call(items, storageKey), 'Saved state not found in storage.');
        assert(items[storageKey].test === 'foo', 'Missing test value in stored state.');
    });

    it('should force load() of state from storage.', async function () {
        await botState.load(context);
        const state = cachedState(context, botState.stateKey);
        assert(state.test === 'foo', 'invalid initial state');
        delete state.test === 'foo';
        await botState.load(context, true);
        assert(cachedState(context, botState.stateKey).test === 'foo', 'state not reloaded');
    });

    it('should clear() state storage.', async function () {
        await botState.load(context);
        assert(cachedState(context, botState.stateKey).test === 'foo', 'invalid initial state');
        await botState.clear(context);
        assert(
            !Object.prototype.hasOwnProperty.call(cachedState(context, botState.stateKey), 'test'),
            'state not cleared on context.'
        );
        await botState.saveChanges(context);

        const items = await storage.read([storageKey]);
        assert(items[storageKey], 'state removed from storage.');
        assert(!Object.prototype.hasOwnProperty.call(items[storageKey], 'test'), 'state not cleared from storage.');
    });

    it('should delete() state storage.', async function () {
        await botState.load(context);
        assert(cachedState(context, botState.stateKey), 'invalid initial state');
        await botState.delete(context);
        assert(!cachedState(context, botState.stateKey), 'state not cleared on context.');

        const items = await storage.read([storageKey]);
        assert(!Object.prototype.hasOwnProperty.call(items, storageKey), 'state not removed from storage.');
    });

    it('should force immediate saveChanges() of state to storage.', async function () {
        await botState.load(context);
        const state = cachedState(context, botState.stateKey);
        assert(!Object.prototype.hasOwnProperty.call(state, 'foo'), 'invalid initial state');
        state.test = 'foo';
        await botState.saveChanges(context, true);
        const items = await storage.read([storageKey]);
        assert(items[storageKey].test === 'foo', 'state not immediately flushed.');
    });

    it('should load() from storage if cached state missing.', async function () {
        context.turnState.set(botState.stateKey, undefined);
        const state = await botState.load(context);
        assert(state.test === 'foo', 'state not loaded.');
    });

    it('should load() from storage if cached.state missing.', async function () {
        context.turnState.set(botState.stateKey, {});
        const state = await botState.load(context);
        assert(state.test === 'foo', 'state not loaded.');
    });

    it('should force saveChanges() to storage of an empty state object.', async function () {
        context.turnState.set(botState.stateKey, undefined);
        await botState.saveChanges(context, true);
    });

    it('should no-op calls to clear() when nothing cached.', async function () {
        context.turnState.set(botState.stateKey, undefined);
        await botState.clear(context);
    });

    it('should create new PropertyAccessors', async function () {
        const count = botState.createProperty('count', 1);
        assert(count !== undefined, 'did not successfully create PropertyAccessor.');
    });

    it('should skip properties in saveChanges()', async function () {
        // Setup storage base changes.
        const clone = JSON.parse(JSON.stringify(houseSectionsSample));
        delete clone.house.kitchen.refrigerator;
        delete clone.house.kitchen.table;
        delete clone.house.bedroom.closet.pants;
        delete clone.house.kitchen.chair;
        delete clone.house.bedroom.chair;
        await storage.write({ [storageKey]: clone });
        await botState.load(context, true);

        // Update bot state.
        const oldState = context.turnState.get(botState.stateKey);
        const newState = { ...oldState, state: houseSectionsSample };
        context.turnState.set(botState.stateKey, newState);

        // Save changes into storage.
        const skipProperties = context.turnState.get(CACHED_BOT_STATE_SKIP_PROPERTIES_HANDLER_KEY);
        skipProperties('house', ['refrigerator', 'table', 'pants']); // Multiple props.
        skipProperties('chair'); // Single prop (key used as prop).
        await botState.saveChanges(context);
        const updatedState = context.turnState.get(botState.stateKey);
        const storageState = await storage.read([storageKey]);

        // Hash state and storage info shouldn't have changed.
        const expectedStorage = storageState[storageKey];
        delete expectedStorage.eTag;
        assert.equal(oldState.hash, updatedState.hash);
        assert.deepStrictEqual(clone, expectedStorage);
    });
});
