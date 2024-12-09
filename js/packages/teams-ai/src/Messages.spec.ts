import sinon from 'sinon';
import { strict as assert } from 'assert';
import { ActivityTypes, Channels, INVOKE_RESPONSE_KEY, TestAdapter } from 'botbuilder';

import { Application } from './Application';
import { createTestInvoke } from './internals/testing/TestUtilities';
import { MessageInvokeNames, Messages } from './Messages';

describe('Messages', () => {
    const adapter = new TestAdapter();
    let mockApp: Application;

    beforeEach(() => {
        mockApp = new Application();
        sinon.stub(mockApp, 'adapter').get(() => adapter);
    });

    it('should exist when Application is instantiated', () => {
        assert.notEqual(mockApp.messages, undefined);
        assert.equal(mockApp.messages instanceof Messages, true);
    });

    describe(MessageInvokeNames.FETCH_INVOKE_NAME, () => {
        it('fetch() with custom RouteSelector handler result is falsy', async () => {
            const activity = createTestInvoke(MessageInvokeNames.FETCH_INVOKE_NAME, {});
            activity.channelId = Channels.Msteams;
            mockApp.messages.fetch(async (_context, _state, _data) => {
                return {};
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.deepEqual(response.value, {
                    status: 200,
                    body: { task: { type: 'continue', value: {} } }
                });
            });
        });

        it('fetch() with custom RouteSelector unhappy path', async () => {
            const activity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const spy = sinon.spy(async (context, _state, _data) => {
                return Promise.resolve('');
            });

            mockApp.messages.fetch(spy);

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
            });

            assert.equal(spy.called, false);
        });
    });
});
