import { strict as assert } from 'assert';
import { Application, Query } from './Application';
import { createTestInvoke } from './TestUtils';
import { MessageExtensions, TestMessageExtensionsInvokeTypes } from './MessageExtensions';
import {
    INVOKE_RESPONSE_KEY,
    MessagingExtensionResult,
    TaskModuleTaskInfo,
    TestAdapter,
    TurnContext
} from 'botbuilder';

const {
    ANONYMOUS_QUERY_LINK_INVOKE_NAME,
    CONFIGURE_SETTINGS,
    FETCH_TASK_INVOKE_NAME,
    // QUERY_CARD_BUTTON_CLICKED,
    QUERY_INVOKE_NAME,
    // QUERY_LINK_INVOKE_NAME,
    // QUERY_SETTING_URL,
    // SELECT_ITEM_INVOKE_NAME,
    SUBMIT_ACTION_INVOKE_NAME
} = TestMessageExtensionsInvokeTypes;

describe('MessageExtensions', () => {
    const testAdapter = new TestAdapter();
    let mockApp: Application;
    beforeEach(() => {
        mockApp = new Application({ adapter: testAdapter });
    });
    it('should exist when Application is instantiated', () => {
        assert.notEqual(mockApp.messageExtensions, undefined);
        assert.equal(mockApp.messageExtensions instanceof MessageExtensions, true);
    });

    describe(`${ANONYMOUS_QUERY_LINK_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with an unfurled link in the response', async () => {
            const activity = createTestInvoke(ANONYMOUS_QUERY_LINK_INVOKE_NAME, {
                url: 'https://www.youtube.com/watch?v=971YIvosuUk&ab_channel=MicrosoftDeveloper'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            // Set up the anonymousQueryLink handler
            mockApp.messageExtensions.anonymousQueryLink(async () => {
                return {
                    type: 'result',
                    attachmentLayout: 'list',
                    attachments: [
                        {
                            contentType: 'application/vnd.microsoft.card.thumbnail',
                            content: {
                                title: 'Microsoft Developer',
                                buttons: [
                                    {
                                        type: 'openUrl',
                                        title: 'Open in YouTube',
                                        value: activity.value.url
                                    }
                                ]
                            }
                        }
                    ]
                };
            });
            await testAdapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);

                assert.deepEqual(response.value, {
                    status: 200,
                    body: {
                        composeExtension: {
                            type: 'result',
                            attachmentLayout: 'list',
                            attachments: [
                                {
                                    contentType: 'application/vnd.microsoft.card.thumbnail',
                                    content: {
                                        title: 'Microsoft Developer',
                                        buttons: [
                                            {
                                                type: 'openUrl',
                                                title: 'Open in YouTube',
                                                value: activity.value.url
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });
            });
        });
    });

    describe(`${FETCH_TASK_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with the task invoke card', async () => {
            const activity = createTestInvoke(FETCH_TASK_INVOKE_NAME, { commandId: 'showTaskModule' });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.fetchTask('showTaskModule', async (context: TurnContext, _state) => {
                return {
                    title: activity.value.commandId,
                    width: 'medium',
                    height: 'medium',
                    card: {
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: {
                            type: 'AdaptiveCard',
                            body: [
                                {
                                    type: 'TextBlock',
                                    text: 'Fetched task module card'
                                }
                            ]
                        }
                    }
                } as TaskModuleTaskInfo;
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {
                    task: {
                        type: 'continue',
                        value: {
                            title: 'showTaskModule',
                            width: 'medium',
                            height: 'medium',
                            card: {
                                contentType: 'application/vnd.microsoft.card.adaptive',
                                content: {
                                    type: 'AdaptiveCard',
                                    body: [
                                        {
                                            type: 'TextBlock',
                                            text: 'Fetched task module card'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                });
            });
        });

        it('should return InvokeResponse with status code 200 with a string message', async () => {
            const activity = createTestInvoke(FETCH_TASK_INVOKE_NAME, { commandId: 'showMessage' });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.fetchTask('showMessage', async (context: TurnContext, _state) => {
                return 'Fetch task string';
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.deepEqual(response.value, {
                    status: 200,
                    body: {
                        task: {
                            type: 'message',
                            value: 'Fetch task string'
                        }
                    }
                });
            });
        });

        it('should throw an error when the routeSelector routes incorrectly', async () => {
            // Incorrect invoke
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'Create',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });

            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            mockApp.messageExtensions.fetchTask(
                async (context) => {
                    return context.activity.name === SUBMIT_ACTION_INVOKE_NAME;
                },
                async (context: TurnContext, _state) => {
                    assert.fail('should not have reached this point');
                }
            );
            await testAdapter.processActivity(activity, async (context) => {
                assert.rejects(
                    () => mockApp.run(context),
                    new Error('Unexpected MessageExtensions.fetchTask() triggered for activity type: invoke')
                );
            });
        });
    });

    describe(`${CONFIGURE_SETTINGS}`, () => {
        it('should return InvokeResponse with status code 200 with the configure setting invoke name', async () => {
            const activity = createTestInvoke(CONFIGURE_SETTINGS, { theme: 'dark' });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.configureSettings(async (context: TurnContext, _state, value) => {
                assert.equal(value.theme, 'dark');
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.value.body, undefined);
            });
        });
    });

    describe(`${SUBMIT_ACTION_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with the submit action invoke name', async () => {
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'Create Preview',
                botActivityPreview: [1],
                botMessagePreviewAction: 'send'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            mockApp.messageExtensions.botMessagePreviewSend(
                'Create Preview',
                async (context: TurnContext, _state, previewActivity) => {
                    assert.equal(previewActivity, activity.value.botActivityPreview[0]);
                }
            );

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {});
            });
        });
        it('should throw an error when the routeSelector routes incorrectly', async () => {
            // Incorrect invoke
            const activity = createTestInvoke(FETCH_TASK_INVOKE_NAME, {
                commandId: 'Create',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });

            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            mockApp.messageExtensions.botMessagePreviewSend(
                async (context) => {
                    return context.activity.name === FETCH_TASK_INVOKE_NAME;
                },
                async (context: TurnContext, _state, previewActivity) => {
                    assert.fail('should not have reached this point');
                }
            );
            await testAdapter.processActivity(activity, async (context) => {
                assert.rejects(
                    () => mockApp.run(context),
                    new Error(
                        'Unexpected MessageExtensions.botMessagePreviewSend() triggered for activity type: invoke'
                    )
                );
            });
        });
    });

    describe(`${QUERY_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with the query invoke name', async () => {
            const activity = createTestInvoke(QUERY_INVOKE_NAME, { commandId: 'showQuery' });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            interface MyParams {}

            mockApp.messageExtensions.query(
                'showQuery',
                async (context: TurnContext, _state, query: Query<MyParams>) => {
                    return {
                        commandId: 'showQuery',
                        ...query
                    } as MessagingExtensionResult;
                }
            );

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {
                    composeExtension: {
                        commandId: 'showQuery',
                        count: 25,
                        parameters: {},
                        skip: 0
                    }
                });
            });
        });
    });

    // describe(`${QUERY_LINK_INVOKE_NAME}`, () => {});

    // describe(`${SELECT_ITEM_INVOKE_NAME}`, () => {});

    // describe(`${QUERY_SETTING_URL}`, () => {
    //     console.log(QUERY_SETTING_URL);
    // });

    // describe(`${QUERY_CARD_BUTTON_CLICKED}`, () => {
    //     console.log(QUERY_CARD_BUTTON_CLICKED);
    // });
});
