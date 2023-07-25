const assert = require('assert');
const sinon = require('sinon');
const { BotAdapter, TurnContext } = require('../');

const testMessage = { text: 'test', type: 'message' };

class SimpleAdapter extends BotAdapter {
    processRequest(activity, next) {
        const context = new TurnContext(this, activity);
        return this.runMiddleware(context, next);
    }
}

describe('BotAdapter', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    const getNextFake = () => sinon.fake((_, next) => next());

    const getAdapter = () => new SimpleAdapter();

    describe('middleware handling', function () {
        it('should use() middleware individually', function () {
            const adapter = getAdapter();
            adapter.use(getNextFake()).use(getNextFake());
        });

        it('should use() a list of middleware', function () {
            const adapter = getAdapter();
            adapter.use(getNextFake(), getNextFake(), getNextFake());
        });

        it('should run all middleware', async function () {
            const adapter = getAdapter();

            const middlewares = [getNextFake(), getNextFake()];
            adapter.use(...middlewares);

            const handler = sandbox.fake((context) => {
                assert(context instanceof TurnContext, 'context is a TurnContext instance');
            });

            await adapter.processRequest(testMessage, handler);

            assert(
                middlewares.every((middleware) => middleware.called),
                'every middleware was called'
            );
            assert(handler.called, 'handler was called');
        });
    });

    describe('Get locale from activity', function () {
        it('should have locale', async function () {
            const adapter = getAdapter();
            const activity = testMessage;
            activity.locale = 'de-DE';
            const handler = sandbox.fake((context) => {
                assert('de-DE', context.activity.locale);
                assert('de-DE', context.locale);
            });

            await adapter.processRequest(activity, handler);
        });
    });

    describe('onTurnError', function () {
        const testCases = [
            { label: 'promise is rejected', logic: () => Promise.reject('error') },
            {
                label: 'error is thrown',
                logic: () => {
                    throw new Error();
                },
            },
        ];

        testCases.forEach(({ label, logic }) => {
            it(`should reach onTurnError when a ${label}`, async function () {
                const adapter = getAdapter();

                adapter.onTurnError = sandbox.fake((context, error) => {
                    assert(context instanceof TurnContext, 'context is a TurnContext instance');
                    assert(error, 'error is defined');
                });

                const handler = sandbox.fake(logic);

                await adapter.processRequest(testMessage, handler);

                assert(adapter.onTurnError.called, 'onTurnError was called');
                assert(handler.called, 'handler was called');
            });

            it(`should propagate error when onTurnError is not defined and a ${label}`, async function () {
                const adapter = getAdapter();

                const handler = sandbox.fake(logic);

                await assert.rejects(
                    adapter.processRequest(testMessage, handler),
                    'unhandled handler error should yield promise rejection'
                );

                assert(handler.called, 'handler was called');
            });

            it(`should propagate error if a ${label} in onTurnError when a ${label} in handler`, async function () {
                const adapter = getAdapter();

                adapter.onTurnError = sandbox.fake((context, error) => {
                    assert(context instanceof TurnContext, 'context is a TurnContext instance');
                    assert(error, 'error is defined');
                    return logic();
                });

                const handler = sandbox.fake(logic);

                await assert.rejects(
                    adapter.processRequest(testMessage, handler),
                    'unhandled onTurnError error should yield promise rejection'
                );

                assert(adapter.onTurnError.called, 'onTurnError was called');
                assert(handler.called, 'handler was called');
            });
        });
    });

    describe('proxy context revocation', function () {
        it('should revoke after execution', async function () {
            const adapter = getAdapter();

            const handler = sandbox.fake((context) => {
                assert.doesNotThrow(() => context.activity, 'accessing context property succeeds before it is revoked');
            });

            await adapter.processRequest(testMessage, handler);
            assert(handler.called, 'handler was called');

            const [context] = handler.args[0];
            assert.throws(() => context.activity, 'accessing context property should throw since it has been revoked');
        });

        it('should revoke after onTurnError', async function () {
            const adapter = getAdapter();

            adapter.onTurnError = sandbox.fake((context) => {
                assert.doesNotThrow(() => context.activity, 'accessing context property succeeds before it is revoked');
            });

            const handler = sandbox.fake(() => Promise.reject('error'));
            await adapter.processRequest(testMessage, handler);
            assert(handler.called, 'handler was called');

            assert(adapter.onTurnError.called, 'onTurnError was called');
            const [context] = adapter.onTurnError.args[0];
            assert.throws(() => context.activity, 'accessing context property should throw since it has been revoked');
        });

        it('should revoke after unhandled error', async function () {
            const adapter = getAdapter();

            const handler = sandbox.fake(() => Promise.reject('error'));

            await assert.rejects(
                adapter.processRequest(testMessage, handler),
                'unhandled handler error should yield promise rejection'
            );
            assert(handler.called, 'handler was called');

            const [context] = handler.args[0];
            assert.throws(() => context.activity, 'accessing context property should throw since it has been revoked');
        });
    });
});
