import sinon from 'sinon';
import { strict as assert } from 'assert';
import { Application } from './Application';
import { createTestInvoke } from './internals';
import {
    ActivityTypes,
    BotConfigAuth,
    CacheInfo,
    Channels,
    ConfigResponseConfig,
    INVOKE_RESPONSE_KEY,
    SuggestedActions,
    TaskModuleContinueResponse,
    TaskModuleMessageResponse,
    TaskModuleResponse,
    TestAdapter,
    TurnContext
} from 'botbuilder';
import { TaskModules, TaskModuleInvokeNames } from './TaskModules';

describe('TaskModules', () => {
    const adapter = new TestAdapter();
    const { FETCH_INVOKE_NAME, SUBMIT_INVOKE_NAME, CONFIG_FETCH_INVOKE_NAME, CONFIG_SUBMIT_INVOKE_NAME } =
        TaskModuleInvokeNames;

    let mockApp: Application;
    beforeEach(() => {
        mockApp = new Application();
        sinon.stub(mockApp, 'adapter').get(() => adapter);
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
                activity: createTestInvoke(FETCH_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            },
            {
                testCase: 'should return a 200 and TaskModuleMessageResponse for an array of verbs',
                testVerb: [TEST_VERB, /TESTVERB/i],
                activity: createTestInvoke(FETCH_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            },
            {
                testCase: 'fetch() with RegExp RouteSelector happy path',
                testVerb: /TESTVERB/i,
                activity: createTestInvoke(FETCH_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            }
        ];

        for (const { testCase, testVerb, activity, expectedResult, handlerReturnValue } of happyPathTestData) {
            activity.channelId = Channels.Msteams;
            it(testCase, async () => {
                mockApp.taskModules.fetch(testVerb, async (_context, _state, _data) => {
                    return handlerReturnValue;
                });

                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
                    const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                    assert.deepEqual(response.value, expectedResult);
                });
            });
        }

        it('fetch() with custom RouteSelector handler result is falsy', async () => {
            const TEST_VERB = 'verbValue';
            const activity = createTestInvoke(FETCH_INVOKE_NAME, {
                data: { verb: TEST_VERB }
            });
            activity.channelId = Channels.Msteams;
            mockApp.taskModules.fetch(TEST_VERB, async (_context, _state, _data) => {
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

        it('fetch() should throw an error when activity.name is incorrect', async () => {
            const activity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.fetch(badRouteSelector, async (_context, _state, _data) => {
                return 'testFailed'; // the test should not reach this point
            });
            await assert.rejects(async () => {
                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });

        it('fetch() with custom RouteSelector unhappy path', async () => {
            const activity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.fetch(badRouteSelector, async (context, _state, _data) => {
                return Promise.resolve('');
            });
            await assert.rejects(async () => {
                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });
    });

    describe(SUBMIT_INVOKE_NAME, () => {
        const TEST_VERB = 'testVerb';

        const happyPathTestData = [
            {
                testCase: 'submit() with custom RouteSelector happy path',
                testVerb: TEST_VERB,
                activity: createTestInvoke(SUBMIT_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            },
            {
                testCase: 'submit() with custom RouteSelector happy path',
                testVerb: [TEST_VERB, /TESTVERB/i],
                activity: createTestInvoke(SUBMIT_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: 'message',
                expectedResult: createExpected200Response({ type: 'message', value: 'message' })
            },
            {
                testCase: 'submit() with object result',
                testVerb: TEST_VERB,
                activity: createTestInvoke(SUBMIT_INVOKE_NAME, {
                    data: { verb: TEST_VERB }
                }),
                handlerReturnValue: {},
                expectedResult: createExpected200Response({ type: 'continue', value: {} })
            }
        ];

        for (const { testCase, testVerb, activity, expectedResult, handlerReturnValue } of happyPathTestData) {
            activity.channelId = Channels.Msteams;
            it(testCase, async () => {
                mockApp.taskModules.submit(testVerb, async (_context, _state, _data) => {
                    return handlerReturnValue;
                });

                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
                    const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                    assert.deepEqual(response.value, expectedResult);
                });
            });
        }

        it('submit() with custom RouteSelector happy path with empty response', async () => {
            const TEST_VERB = 'verbValue';
            const activity = createTestInvoke(SUBMIT_INVOKE_NAME, {
                data: {
                    verb: TEST_VERB
                }
            });
            activity.channelId = Channels.Msteams;
            mockApp.taskModules.submit(TEST_VERB, async (_context, _state, _data) => {
                return undefined;
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.type, ActivityTypes.InvokeResponse);
            });
        });

        it('submit() with custom RouteSelector unhappy path', async () => {
            const activity = { channelId: Channels.Msteams, type: ActivityTypes.Invoke, name: 'incorrectName' };
            const badRouteSelector = (context: TurnContext) => {
                return Promise.resolve(true);
            };

            mockApp.taskModules.submit(badRouteSelector, async (_context, _state, _data) => {
                return undefined;
            });
            await assert.rejects(async () => {
                await adapter.processActivity(activity, async (context) => {
                    await mockApp.run(context);
                });
            });
        });
    });

    describe(CONFIG_FETCH_INVOKE_NAME, () => {
        it('should send a 200 response with BotAuthConfig', async () => {
            const suggestedActions: SuggestedActions = {
                to: ['123Bilbo', '456Frodo'],
                actions: [
                    {
                        type: 'signin',
                        title: 'Sign in',
                        value: 'Sign in'
                    },
                    {
                        type: 'imBack',
                        title: 'Send greeting',
                        value: 'Aloha!'
                    }
                ]
            };
            const configFetchBotAuthConfig: ConfigResponseConfig = {
                type: 'auth',
                suggestedActions: suggestedActions
            };
            const activity = createTestInvoke(CONFIG_FETCH_INVOKE_NAME, {});
            activity.channelId = Channels.Msteams;

            mockApp.taskModules.configFetch(async (_context, _state, _data) => {
                return Promise.resolve(configFetchBotAuthConfig);
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.type, ActivityTypes.InvokeResponse);
                assert.deepEqual(response.value.body, {
                    responseType: 'config',
                    config: configFetchBotAuthConfig
                });
            });
        });

        it(`should send a 200 response with TaskModuleResponse's TaskModuleContinueResponse`, async () => {
            const taskModuleContinueResponse: TaskModuleContinueResponse = {
                value: {
                    title: 'Task Module',
                    height: 200,
                    width: 400,
                    url: 'https://www.example.com/registration'
                }
            };

            const taskModuleResponse: ConfigResponseConfig = {
                task: taskModuleContinueResponse,
                cacheInfo: {
                    cacheType: 'someCache',
                    cacheDuration: 5000
                }
            };
            const activity = createTestInvoke(CONFIG_FETCH_INVOKE_NAME, {});
            activity.channelId = Channels.Msteams;

            mockApp.taskModules.configFetch(async (_context, _state, _data) => {
                return Promise.resolve(taskModuleResponse);
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.type, ActivityTypes.InvokeResponse);
                console.log(JSON.stringify(response.value.body, null, 2));
                assert.deepEqual(response.value.body, {
                    responseType: 'config',
                    config: taskModuleResponse,
                    cacheInfo: taskModuleResponse.cacheInfo
                });
            });
        });
    });

    describe(CONFIG_SUBMIT_INVOKE_NAME, () => {
        it('should send a 200 response with a BotConfigAuth', async () => {
            const activity = createTestInvoke(CONFIG_SUBMIT_INVOKE_NAME, {});
            activity.channelId = Channels.Msteams;
            const botConfigAuth: BotConfigAuth = {
                type: 'auth',
                suggestedActions: {
                    actions: [
                        {
                            type: 'signin',
                            title: 'Sign in',
                            value: 'Sign in'
                        },
                        {
                            type: 'imBack',
                            title: 'Send greeting',
                            value: 'Aloha!'
                        }
                    ],
                    to: ['TestUser1Id', 'TestUser2Id']
                }
            };

            mockApp.taskModules.configSubmit(async (_context, _state, _data) => {
                return botConfigAuth;
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.type, ActivityTypes.InvokeResponse);
                assert.equal(response.value.body.responseType, 'config');
                assert.equal(response.value.body.config, botConfigAuth);
            });
        });

        it('should use cacheInfo from a TaskModuleResponse', async () => {
            const activity = createTestInvoke(CONFIG_SUBMIT_INVOKE_NAME, {});
            activity.channelId = Channels.Msteams;
            const cacheInfo: CacheInfo = {
                cacheType: 'someCache',
                cacheDuration: 5000
            };
            const taskModuleResponse: TaskModuleResponse = {
                cacheInfo,
                task: {
                    type: 'message',
                    value: 'test'
                }
            };

            mockApp.taskModules.configSubmit(async (_context, _state, _data) => {
                return taskModuleResponse;
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.type, ActivityTypes.InvokeResponse);
                assert.equal(response.value.body.responseType, 'config');
                assert.equal(response.value.body.config, taskModuleResponse);
                assert.equal(response.value.body.cacheInfo, cacheInfo);
            });
        });
    });
});
