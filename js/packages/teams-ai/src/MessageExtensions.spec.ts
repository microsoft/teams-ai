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
    QUERY_CARD_BUTTON_CLICKED,
    QUERY_INVOKE_NAME,
    QUERY_LINK_INVOKE_NAME,
    QUERY_SETTING_URL,
    SELECT_ITEM_INVOKE_NAME,
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

    describe(`${CONFIGURE_SETTINGS}`, () => {
        it('should send 500 when the handler fails', async () => {
            const activity = createTestInvoke(CONFIGURE_SETTINGS, {});
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.configureSettings(async (context: TurnContext, _state, value) => {
                throw new Error('handler try failed');
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 500);
                assert.equal(response.value.body, `${CONFIGURE_SETTINGS} invoke failed. \n handler try failed`);
            });
        });

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

        it('should call the same handler among an array of commandIds', async () => {
            // commandId: ['showTaskModule', 'show', 'show task module']
            const activity = createTestInvoke(FETCH_TASK_INVOKE_NAME, {
                commandId: 'showTaskModule'
            });
            const regexp = new RegExp(/show$/, 'i');
            const activity2 = createTestInvoke(FETCH_TASK_INVOKE_NAME, {
                commandId: 'Show'
            });
            const activity3 = createTestInvoke(FETCH_TASK_INVOKE_NAME, {
                commandId: 'show task module'
            });
            const activity4 = createTestInvoke(FETCH_TASK_INVOKE_NAME, {
                commandId: 'show task'
            });

            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            activity2.deliveryMode = 'expectReplies';
            activity3.deliveryMode = 'expectReplies';
            activity4.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.fetchTask(
                [
                    'showTaskModule',
                    regexp,
                    'show task module',
                    async (context: TurnContext) => {
                        return context.activity.value.commandId === 'show task';
                    }
                ],
                async (context, _state) => {
                    return context.activity.value;
                }
            );

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.body.task.value.commandId, 'showTaskModule');
            });

            await testAdapter.processActivity(activity2, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);

                assert.match(response.value.body.task.value.commandId, regexp);
            });

            await testAdapter.processActivity(activity3, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);

                assert.equal(response.value.body.task.value.commandId, 'show task module');
            });
            await testAdapter.processActivity(activity4, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.body.task.value.commandId, 'show task');
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

    describe(`${SUBMIT_ACTION_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with the submit action invoke name for submitAction', async () => {
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'giveKudos',
                commandContext: 'compose',
                context: {
                    theme: 'default'
                },
                data: {
                    id: 'submitButton',
                    formField1: 'formField1_value',
                    formField2: 'formField2_value',
                    formField3: 'formField3_value'
                }
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            mockApp.messageExtensions.submitAction('giveKudos', async (context: TurnContext, _state, value) => {
                return {
                    type: 'result',
                    attachmentLayout: 'list',
                    attachments: [
                        {
                            preview: {
                                contentType: 'application/vnd.microsoft.card.hero',
                                content: {
                                    title: 'formField1_value',
                                    subtitle: 'formField2_value',
                                    text: 'formField3_value'
                                }
                            },
                            contentType: 'application/vnd.microsoft.card.hero',
                            content: {
                                title: 'formField1_value',
                                subtitle: 'formField2_value',
                                text: 'formField3_value'
                            }
                        }
                    ]
                } as MessagingExtensionResult;
            });

            await testAdapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {
                    composeExtension: {
                        type: 'result',
                        attachmentLayout: 'list',
                        attachments: [
                            {
                                preview: {
                                    contentType: 'application/vnd.microsoft.card.hero',
                                    content: {
                                        title: 'formField1_value',
                                        subtitle: 'formField2_value',
                                        text: 'formField3_value'
                                    }
                                },
                                contentType: 'application/vnd.microsoft.card.hero',
                                content: {
                                    title: 'formField1_value',
                                    subtitle: 'formField2_value',
                                    text: 'formField3_value'
                                }
                            }
                        ]
                    }
                });
            });
        });

        it('should return InvokeResponse with status code 200 with the submit action invoke name for botMessagePreviewSend', async () => {
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

        it('should return InvokeResponse with status code 200 with the submit action invoke name for botMessagePreviewEdit', async () => {
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'Create Preview',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            mockApp.messageExtensions.botMessagePreviewEdit(
                'Create Preview',
                async (context: TurnContext, _state, previewActivity) => {
                    assert.equal(previewActivity, activity.value.botActivityPreview[0]);
                    return 'edit';
                }
            );

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body.task.value, 'edit');
            });
        });

        it('should call the same handler among an array of commandIds for botMessagePreviewSend', async () => {
            // commandId: ['create preview', 'preview']
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'create preview',
                botActivityPreview: ['create preview'],
                botMessagePreviewAction: 'send'
            });
            const activity2 = createTestInvoke(SUBMIT_ACTION_INVOKE_NAME, {
                commandId: 'preview',
                botActivityPreview: ['preview'],
                botMessagePreviewAction: 'send'
            });

            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';
            activity2.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.botMessagePreviewSend(
                ['create preview', 'preview'],
                async (context, _state, previewActivity) => {
                    assert.equal(context.activity.value.commandId, previewActivity);
                }
            );

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.notEqual(response, undefined);
            });

            await testAdapter.processActivity(activity2, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.notEqual(response, undefined);
            });
        });

        it('should throw an error when the routeSelector routes incorrectly for botMessagePreviewSend', async () => {
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

    describe(`${QUERY_CARD_BUTTON_CLICKED}`, () => {
        it('should return InvokeResponse with status code 200 with the query card button clicked invoke name', async () => {
            const activity = createTestInvoke(QUERY_CARD_BUTTON_CLICKED, {
                title: 'Query button',
                displayText: 'Yes',
                value: 'Yes'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.handleOnButtonClicked(async (context: TurnContext, _state, button) => {
                assert.equal(button.title, 'Query button');
                assert.equal(button.displayText, 'Yes');
                assert.equal(button.value, 'Yes');
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, undefined);
            });
        });
        it('should send 500 when the handler fails', async () => {
            const activity = createTestInvoke(QUERY_CARD_BUTTON_CLICKED, {});
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.handleOnButtonClicked(async (context: TurnContext, _state, value) => {
                throw new Error('handler try failed');
            });

            await testAdapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 500);
                assert.equal(response.value.body, `${QUERY_CARD_BUTTON_CLICKED} invoke failed. \n handler try failed`);
            });
        });
    });

    describe(`${QUERY_LINK_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with an unfurled link in the response', async () => {
            const activity = createTestInvoke(QUERY_LINK_INVOKE_NAME, {
                url: 'https://www.youtube.com/watch?v=971YIvosuUk&ab_channel=MicrosoftDeveloper'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            // Set up the queryLink handler
            mockApp.messageExtensions.queryLink(async () => {
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

    describe(`${QUERY_SETTING_URL}`, async () => {
        it('should return InvokeResponse with status code 200 when querySettingUrl is invoked', async () => {
            const activity = createTestInvoke(QUERY_SETTING_URL, {});
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.queryUrlSetting(async (context: TurnContext, _state) => {
                console.log('queryUrlSetting does not return a value');
            });

            await testAdapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, undefined);
            });
        });

        it('should return InvokeResponse with status code 500 when querySettingUrl fails to invoke', async () => {
            const activity = createTestInvoke(QUERY_SETTING_URL, {});
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            mockApp.messageExtensions.queryUrlSetting(async (context: TurnContext, _state) => {
                throw new Error('queryUrlSetting failed');
            });

            await testAdapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 500);
                assert.deepEqual(response.value.body, `${QUERY_SETTING_URL} invoke failed. \n queryUrlSetting failed`);
            });
        });
    });

    describe(`${SELECT_ITEM_INVOKE_NAME}`, () => {
        it('should return InvokeResponse with status code 200 with selected item in the response', async () => {
            const activity = createTestInvoke(SELECT_ITEM_INVOKE_NAME, {
                attachmentLayout: 'list',
                attachments: [
                    {
                        contentType: 'application/vnd.microsoft.card.thumbnail',
                        content: {
                            title: 'Microsoft Pets',
                            buttons: [
                                {
                                    type: 'Action.OpenUrl',
                                    title: 'Dog',
                                    url: `https://fake-url.dog`
                                },
                                {
                                    type: 'Action.OpenUrl',
                                    title: 'Cat',
                                    url: `https://fake-url.cat`
                                }
                            ]
                        }
                    }
                ],
                type: 'result'
            });
            // Not sure why but without this line, the test adapter sends back an empty response.
            activity.deliveryMode = 'expectReplies';

            // Set up the selectItem handler
            mockApp.messageExtensions.selectItem(async (_context, _state, item) => {
                return item as MessagingExtensionResult;
            });
            await testAdapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {
                    composeExtension: {
                        attachmentLayout: 'list',
                        attachments: [
                            {
                                content: {
                                    buttons: [
                                        {
                                            title: 'Dog',
                                            type: 'Action.OpenUrl',
                                            url: 'https://fake-url.dog'
                                        },
                                        {
                                            title: 'Cat',
                                            type: 'Action.OpenUrl',
                                            url: 'https://fake-url.cat'
                                        }
                                    ],
                                    title: 'Microsoft Pets'
                                },
                                contentType: 'application/vnd.microsoft.card.thumbnail'
                            }
                        ],
                        type: 'result'
                    }
                });
            });
        });
    });
});
