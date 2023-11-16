import { strict as assert } from 'assert';
import { Application, Query } from './Application';
import { createTestInvoke } from './internals/TestUtilities';
import { MessageExtensions, MessageExtensionInvokeNames } from './MessageExtensions';
import {
    Channels,
    INVOKE_RESPONSE_KEY,
    MessagingExtensionResult,
    TaskModuleTaskInfo,
    TestAdapter,
    TurnContext
} from 'botbuilder';

const {
    ANONYMOUS_QUERY_LINK_INVOKE,
    FETCH_TASK_INVOKE,
    QUERY_INVOKE,
    QUERY_LINK_INVOKE,
    SELECT_ITEM_INVOKE,
    SUBMIT_ACTION_INVOKE,
    QUERY_SETTING_URL,
    CONFIGURE_SETTINGS,
    QUERY_CARD_BUTTON_CLICKED
} = MessageExtensionInvokeNames;
describe('MessageExtensions', () => {
    const adapter = new TestAdapter();
    let mockApp: Application;
    beforeEach(() => {
        mockApp = new Application({ adapter });
    });
    it('should exist when Application is instantiated', () => {
        assert.notEqual(mockApp.messageExtensions, undefined);
        assert.equal(mockApp.messageExtensions instanceof MessageExtensions, true);
    });

    describe(`${ANONYMOUS_QUERY_LINK_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with an unfurled link in the response', async () => {
            const activity = createTestInvoke(ANONYMOUS_QUERY_LINK_INVOKE, {
                url: 'https://www.youtube.com/watch?v=971YIvosuUk&ab_channel=MicrosoftDeveloper'
            });
            activity.channelId = Channels.Msteams;
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
            await adapter.processActivity(activity, async (context: TurnContext) => {
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
        it('should return InvokeResponse with status code 200 with the configure setting invoke name', async () => {
            const activity = createTestInvoke(CONFIGURE_SETTINGS, { theme: 'dark' });
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.configureSettings(async (context: TurnContext, _state, value) => {
                assert.equal(value.theme, 'dark');
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.equal(response.value.body, undefined);
            });
        });
    });

    describe(`${FETCH_TASK_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with the task invoke card', async () => {
            const activity = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'showTaskModule'
            });
            activity.channelId = Channels.Msteams;

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

            await adapter.processActivity(activity, async (context) => {
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
            const activity = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'showMessage'
            });
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.fetchTask('showMessage', async (context: TurnContext, _state) => {
                return 'Fetch task string';
            });

            await adapter.processActivity(activity, async (context) => {
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
            const activity = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'showTaskModule'
            });
            activity.channelId = Channels.Msteams;
            const regexp = new RegExp(/show$/, 'i');
            const activity2 = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'Show'
            });
            activity2.channelId = Channels.Msteams;

            const activity3 = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'show task module'
            });
            activity3.channelId = Channels.Msteams;

            const activity4 = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'show task'
            });
            activity4.channelId = Channels.Msteams;

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

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.body.task.value.commandId, 'showTaskModule');
            });

            await adapter.processActivity(activity2, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);

                assert.match(response.value.body.task.value.commandId, regexp);
            });

            await adapter.processActivity(activity3, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);

                assert.equal(response.value.body.task.value.commandId, 'show task module');
            });
            await adapter.processActivity(activity4, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.body.task.value.commandId, 'show task');
            });
        });

        it('should throw an error when the routeSelector routes incorrectly', async () => {
            // Incorrect invoke
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE, {
                commandId: 'Create',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });

            mockApp.messageExtensions.fetchTask(
                async (context) => {
                    return context.activity.name === SUBMIT_ACTION_INVOKE;
                },
                async (context: TurnContext, _state) => {
                    assert.fail('should not have reached this point');
                }
            );
            await adapter.processActivity(activity, async (context) => {
                assert.rejects(
                    () => mockApp.run(context),
                    new Error('Unexpected MessageExtensions.fetchTask() triggered for activity type: invoke')
                );
            });
        });
    });

    describe(`${SUBMIT_ACTION_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with the submit action invoke name for submitAction', async () => {
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE, {
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
            activity.channelId = Channels.Msteams;

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

            await adapter.processActivity(activity, async (context: TurnContext) => {
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
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE, {
                commandId: 'Create Preview',
                botActivityPreview: [1],
                botMessagePreviewAction: 'send'
            });
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.botMessagePreviewSend(
                'Create Preview',
                async (context: TurnContext, _state, previewActivity) => {
                    assert.equal(previewActivity, activity.value.botActivityPreview[0]);
                }
            );

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, {});
            });
        });

        it('should return InvokeResponse with status code 200 with the submit action invoke name for botMessagePreviewEdit', async () => {
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE, {
                commandId: 'Create Preview',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.botMessagePreviewEdit(
                'Create Preview',
                async (context: TurnContext, _state, previewActivity) => {
                    assert.equal(previewActivity, activity.value.botActivityPreview[0]);
                    return 'edit';
                }
            );

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body.task.value, 'edit');
            });
        });

        it('should call the same handler among an array of commandIds for botMessagePreviewSend', async () => {
            // commandId: ['create preview', 'preview']
            const activity = createTestInvoke(SUBMIT_ACTION_INVOKE, {
                commandId: 'create preview',
                botActivityPreview: ['create preview'],
                botMessagePreviewAction: 'send'
            });
            activity.channelId = Channels.Msteams;

            const activity2 = createTestInvoke(SUBMIT_ACTION_INVOKE, {
                commandId: 'preview',
                botActivityPreview: ['preview'],
                botMessagePreviewAction: 'send'
            });
            activity2.channelId = Channels.Msteams;

            mockApp.messageExtensions.botMessagePreviewSend(
                ['create preview', 'preview'],
                async (context, _state, previewActivity) => {
                    assert.equal(context.activity.value.commandId, previewActivity);
                }
            );

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.notEqual(response, undefined);
            });

            await adapter.processActivity(activity2, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.notEqual(response, undefined);
            });
        });

        it('should throw an error when the routeSelector routes incorrectly for botMessagePreviewSend', async () => {
            // Incorrect invoke
            const activity = createTestInvoke(FETCH_TASK_INVOKE, {
                commandId: 'Create',
                botActivityPreview: [1],
                botMessagePreviewAction: 'edit'
            });
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.botMessagePreviewSend(
                async (context) => {
                    return context.activity.name === FETCH_TASK_INVOKE;
                },
                async (context: TurnContext, _state, previewActivity) => {
                    assert.fail('should not have reached this point');
                }
            );
            await adapter.processActivity(activity, async (context) => {
                assert.rejects(
                    () => mockApp.run(context),
                    new Error(
                        'Unexpected MessageExtensions.botMessagePreviewSend() triggered for activity type: invoke'
                    )
                );
            });
        });
    });

    describe(`${QUERY_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with the query invoke name', async () => {
            const activity = createTestInvoke(QUERY_INVOKE, { commandId: 'showQuery' });
            activity.channelId = Channels.Msteams;

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

            await adapter.processActivity(activity, async (context) => {
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
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.handleOnButtonClicked(async (context: TurnContext, _state, data) => {
                assert.equal(data.title, 'Query button');
                assert.equal(data.displayText, 'Yes');
                assert.equal(data.value, 'Yes');
            });

            await adapter.processActivity(activity, async (context) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body, undefined);
            });
        });
    });

    describe(`${QUERY_LINK_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with an unfurled link in the response', async () => {
            const activity = createTestInvoke(QUERY_LINK_INVOKE, {
                url: 'https://www.youtube.com/watch?v=971YIvosuUk&ab_channel=MicrosoftDeveloper'
            });
            activity.channelId = Channels.Msteams;

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
            await adapter.processActivity(activity, async (context: TurnContext) => {
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
            activity.channelId = Channels.Msteams;

            mockApp.messageExtensions.queryUrlSetting(async (context: TurnContext, _state) => {
                return {
                    value: 'https://fake-url'
                } as MessagingExtensionResult;
            });

            await adapter.processActivity(activity, async (context: TurnContext) => {
                await mockApp.run(context);
                const response = context.turnState.get(INVOKE_RESPONSE_KEY);
                assert.equal(response.value.status, 200);
                assert.deepEqual(response.value.body.composeExtension.value, 'https://fake-url');
            });
        });
    });

    describe(`${SELECT_ITEM_INVOKE}`, () => {
        it('should return InvokeResponse with status code 200 with selected item in the response', async () => {
            const activity = createTestInvoke(SELECT_ITEM_INVOKE, {
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
            activity.channelId = Channels.Msteams;

            // Set up the selectItem handler
            mockApp.messageExtensions.selectItem(async (_context, _state, item) => {
                return item as MessagingExtensionResult;
            });
            await adapter.processActivity(activity, async (context: TurnContext) => {
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
