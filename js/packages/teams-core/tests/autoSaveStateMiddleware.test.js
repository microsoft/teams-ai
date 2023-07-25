const assert = require('assert');
const { TurnContext, AutoSaveStateMiddleware, TestAdapter } = require('../lib');

const receivedMessage = { text: 'received', type: 'message' };

class BotStateMock {
    constructor(state) {
        this.state = state || {};
        this.assertForce = false;
        this.readCalled = false;
        this.writeCalled = false;
    }
    load(context, force) {
        assert(context, 'BotStateMock.load() not passed context.');
        if (this.assertForce) assert(force, 'BotStateMock.load(): force not set.');
        this.readCalled = true;
        return new Promise((resolve, _reject) => {
            setTimeout(() => resolve(this.state), Math.random() * 50);
        });
    }

    saveChanges(context, force) {
        assert(context, 'BotStateMock.saveChanges() not passed context.');
        if (this.assertForce) assert(force, 'BotStateMock.saveChanges(): force not set.');
        this.writeCalled = true;
        return new Promise((resolve, _reject) => {
            setTimeout(() => resolve(), Math.random() * 50);
        });
    }
}

describe('AutoSaveStateMiddleware', function () {
    this.timeout(5000);

    const adapter = new TestAdapter();
    const context = new TurnContext(adapter, receivedMessage);
    const fooState = new BotStateMock({ foo: 'bar' });
    const barState = new BotStateMock({ bar: 'foo' });

    it('should add() and call loadAll() on a single BotState plugin.', async function () {
        const set = new AutoSaveStateMiddleware().add(fooState);
        await set.botStateSet.loadAll(context);
    });

    it('should add() and call loadAll() on multiple BotState plugins.', async function () {
        const set = new AutoSaveStateMiddleware().add(fooState, barState);
        await set.botStateSet.loadAll(context);
    });

    it('should add() and call saveAllChanges() on a single BotState plugin.', async function () {
        const set = new AutoSaveStateMiddleware().add(fooState);
        await set.botStateSet.saveAllChanges(context);
        assert(fooState.writeCalled, 'write not called for plugin.');
    });

    it('should add() and call saveAllChanges() on multiple BotState plugins.', async function () {
        const set = new AutoSaveStateMiddleware().add(fooState, barState);
        await set.botStateSet.saveAllChanges(context);
        assert(fooState.writeCalled || barState.writeCalled, 'write not called for either plugin.');
        assert(fooState.writeCalled, "write not called for 'fooState' plugin.");
        assert(barState.writeCalled, "write not called for 'barState' plugin.");
    });

    it("should pass 'force' flag through in loadAll() call.", async function () {
        const fooState = new BotStateMock({ foo: 'bar' });
        fooState.assertForce = true;
        const set = new AutoSaveStateMiddleware().add(fooState);
        await set.botStateSet.loadAll(context, true);
    });

    it("should pass 'force' flag through in saveAllChanges() call.", async function () {
        const fooState = new BotStateMock({ foo: 'bar' });
        fooState.assertForce = true;
        const set = new AutoSaveStateMiddleware().add(fooState);
        await set.botStateSet.saveAllChanges(context, true);
    });

    it('should work as a middleware plugin.', async function () {
        const set = new AutoSaveStateMiddleware().add(fooState);
        await set.onTurn(context, () => Promise.resolve());
        assert(fooState.writeCalled, 'saveAllChanges() not called.');
    });

    it('should support plugins passed to constructor.', async function () {
        const set = new AutoSaveStateMiddleware(fooState);
        await set.onTurn(context, () => Promise.resolve());
        assert(fooState.writeCalled, 'saveAllChanges() not called.');
    });

    it('should throw exception if invalid plugin passed in.', function () {
        assert.throws(
            () => new AutoSaveStateMiddleware(fooState, { read: () => {} }),
            new Error("BotStateSet: a object was added that isn't an instance of BotState.")
        );
    });

    it('should not add any BotState on construction if none are passed in.', async function () {
        const middleware = new AutoSaveStateMiddleware();
        assert(middleware.botStateSet.botStates.length === 0, 'should not have added any BotState.');
    });
});
