import { strict as assert } from 'assert';
import { Application } from './Application';
import { createTestInvoke } from './internals';
import {
    ActivityTypes,
    Channels,
    INVOKE_RESPONSE_KEY,
    TaskModuleContinueResponse,
    TaskModuleMessageResponse,
    TestAdapter,
    TurnContext
} from 'botbuilder';
import { TaskModules } from './TaskModules';

describe('TaskModules', () => {
    const adapter = new TestAdapter();
    const FETCH_INVOKE_NAME = `task/fetch`;
    const SUBMIT_INVOKE_NAME = `task/submit`;

    let mockApp: Application;
    beforeEach(() => {
        mockApp = new Application({ adapter });
    });

    const createExpected200Response = (taskModuleResponse: TaskModuleContinueResponse | TaskModuleMessageResponse) => {
        if (taskModuleResponse.type != 'continue' && taskModuleResponse.type != 'message') {
            throw new Error(
                `Test setup failed. TaskModuleResponse.type must be either 'continue' or 'message', not ${taskModuleResponse.type}`
            );
        }

        if (typeof taskModuleResponse.value != 'string' && typeof taskModuleResponse.value != 'object') {
            throw new Error(
                `Test setup faiiled. TaskModuleResponse.value type must be either a string or an object, not ${typeof taskModuleResponse.value}`
            );
        }
        return {
            status: 200,
            body: { task: taskModuleResponse }
        };
    };

    it('should exist when Application is instantiated', () => {
        assert.notEqual(mockApp.taskModules, undefined);
        assert.equal(mockApp.taskModules instanceof TaskModules, true);
    });

    describe(FETCH_INVOKE_NAME, () => {
        const TEST_VERB = 'testVerb';
        const happyPathTestData = [
            {
                testCase: 'should return a 200 and TaskModuleMessageResponse for a returned string',
                testVerb: TEST_VERB,
                testActivity: createTestInvoke(FETCH_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            }
        ];

        for (const { testCase, testVerb, testActivity, expectedResult, handlerReturnValue } of happyPathTestData) {
            testActivity.channelId = Channels.Msteams;
            it(testCase, async () => {
                mockApp.taskModules.fetch(testVerb, async (_context, _state, _data) => {
                    return handlerReturnValue;
                });

                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                    const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                    assert.deepEqual(response.value, expectedResult);
                });
            });
        }

        it('fetch() with custom RouteSelector happy path', async () => {
            const expectedVerbValue = 'verbValue';
            const testActivity = createTestInvoke(FETCH_INVOKE_NAME, {
                data: { verb: expectedVerbValue }
            });
            testActivity.channelId = Channels.Msteams;
            const messageResult = 'messageResult';
            mockApp.taskModules.fetch(expectedVerbValue, async (_context, _state, _data) => {
                return messageResult;
            });

            await adapter.processActivity(testActivity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.deepEqual(response.value, {
                    status: 200,
                    body: { task: { type: 'message', value: messageResult } }
                });
            });
        });

        it('fetch() with custom RouteSelector handler result is falsy', async () => {
            const expectedVerbValue = 'verbValue';
            const testActivity = createTestInvoke(FETCH_INVOKE_NAME, {
                data: { verb: expectedVerbValue }
            });
            testActivity.channelId = Channels.Msteams;
            mockApp.taskModules.fetch(expectedVerbValue, async (_context, _state, _data) => {
                return {};
            });

            await adapter.processActivity(testActivity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.deepEqual(response.value, {
                    status: 200,
                    body: { task: { type: 'continue', value: {} } }
                });
            });
        });

        it('fetch() should throw an error when activity.name is incorrect', async () => {
            const testActivity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.fetch(badRouteSelector, async (_context, _state, _data) => {
                return 'testFailed'; // the test should not reach this point
            });
            await assert.rejects(async () => {
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });
        it('fetch() with custom RouteSelector unhappy path', async () => {
            const testActivity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.fetch(badRouteSelector, async (context, _state, _data) => {
                return Promise.resolve('');
            });
            await assert.rejects(async () => {
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });
    });

    describe(SUBMIT_INVOKE_NAME, () => {
        it('submit() with custom RouteSelector happy path', async () => {
            const expectedVerbValue = 'verbValue';
            const testActivity = createTestInvoke(SUBMIT_INVOKE_NAME, {
                data: { verb: expectedVerbValue }
            });
            testActivity.channelId = Channels.Msteams;
            const messageResult = 'messageResult';
            mockApp.taskModules.submit(expectedVerbValue, async (_context, _state, _data) => {
                return messageResult;
            });

            await adapter.processActivity(testActivity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.deepEqual(response.value, {
                    status: 200,
                    body: { task: { type: 'message', value: messageResult } }
                });
            });
        });

        it('submit() with custom RouteSelector unhappy path', async () => {
            const testActivity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.submit(badRouteSelector, async (_context, _state, _data) => {
                return Promise.resolve(undefined);
            });
            await assert.rejects(async () => {
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });
    });
});
