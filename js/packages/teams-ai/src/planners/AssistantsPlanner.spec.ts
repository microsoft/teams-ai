import {
    Assistant,
    AssistantThread,
    AssistantThreadCreationOptions,
    AssistantsClient,
    CreateMessageOptions,
    CreateRunOptions,
    CreateRunRequestOptions,
    CreateThreadOptions,
    GetRunOptions,
    ListMessagesOptions,
    ListResponseOf,
    ListRunsOptions,
    MessageRole,
    OpenAIKeyCredential,
    RequiredAction,
    RequiredFunctionToolCall,
    SubmitToolOutputsToRunOptions,
    ThreadMessage,
    ThreadRun,
    ToolOutput
} from '@azure/openai-assistants';
import { TestAdapter, TurnContext } from 'botbuilder-core';
import { Activity } from 'botframework-schema';
import { TurnState } from '../TurnState';
import { AssistantsPlanner, AssistantsPlannerOptions } from './AssistantsPlanner';
import { AI, AIOptions } from '../AI';
import assert from 'assert';
import { PredictedDoCommand, PredictedSayCommand } from './Planner';

describe('AssistantsPlanner', () => {
    const createTurnContextAndState = async (activity: Partial<Activity>): Promise<[TurnContext, TurnState]> => {
        const testAdapter = new TestAdapter();
        const context = new TurnContext(testAdapter, {
            channelId: 'msteams',
            recipient: {
                id: 'bot',
                name: 'bot'
            },
            from: {
                id: 'user',
                name: 'user'
            },
            conversation: {
                id: 'convo',
                isGroup: false,
                conversationType: 'personal',
                name: 'convo'
            },
            ...activity
        });
        const state: TurnState = new TurnState();
        await state.load(context);
        state.temp = {
            input: '',
            inputFiles: [],
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    describe('beginTask', async () => {
        it('expects a single reply', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 1);
            assert.equal(plan.commands[0].type, 'SAY');
            assert.equal('welcome', (plan.commands[0] as PredictedSayCommand).response.content);
        });

        it('waits for current run', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('in_progress');
            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 1);
            assert.equal(plan.commands[0].type, 'SAY');
            assert.equal('welcome', (plan.commands[0] as PredictedSayCommand).response.content);
        });

        it('waits for previous run', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('failed');
            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const thread = await testClient.createThread({});
            await testClient.createRun(thread.id, { assistantId: 'assistant_id' });
            state.setValue('conversation.assistants_state', { threadId: thread.id });

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 1);
            assert.equal(plan.commands[0].type, 'SAY');
            assert.equal('welcome', (plan.commands[0] as PredictedSayCommand).response.content);
        });

        it('run cancelled', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('cancelled');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 0);
        });

        it('run expired', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('expired');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 1);
            assert.equal(plan.commands[0].type, 'DO');
            assert.equal((plan.commands[0] as PredictedDoCommand).action, AI.TooManyStepsActionName);
        });

        it('run failed', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('failed');
            testClient.remainingMessages.push('welcome');

            try {
                await planner.beginTask(context, state, ai);
            } catch (e) {
                assert((e as Error).message.indexOf('Run failed') >= 0);
                return;
            }

            assert.fail();
        });
    });

    describe('continueTask()', () => {
        it('requires action', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            const functionToolCall: RequiredFunctionToolCall = {
                type: 'function',
                id: 'test-tool-id',
                function: {
                    name: 'test-action',
                    arguments: '{}',
                    output: null
                }
            };
            const requiredAction: RequiredAction = {
                type: 'submit_tool_outputs',
                submitToolOutputs: {
                    toolCalls: [functionToolCall]
                }
            };

            testClient.remainingActions.push(requiredAction);
            testClient.remainingRunStatus.push('requires_action');
            testClient.remainingRunStatus.push('in_progress');
            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const plan1 = await planner.continueTask(context, state, ai);
            state.temp.actionOutputs['test-action'] = 'test-output';
            const plan2 = await planner.continueTask(context, state, ai);

            assert(plan1);
            assert(plan1.commands);
            assert.equal(plan1.commands.length, 1);
            assert.equal(plan1.commands[0].type, 'DO');
            assert.equal((plan1.commands[0] as PredictedDoCommand).action, 'test-action');
            assert(plan2);
            assert(plan2.commands);
            assert.equal(plan2.commands[0].type, 'SAY');
            assert.equal((plan2.commands[0] as PredictedSayCommand).response.content, 'welcome');

            const toolMap: { [key: string]: string } = state.getValue('temp.submit_tool_map');
            assert(toolMap);
            assert.equal(Object.keys(toolMap).length, 1);
            assert('test-action' in toolMap);
            assert(toolMap['test-action'], 'test-tool_id');
        });

        it('ignores redundant action', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';
            state.temp.actionOutputs['other-action'] = 'should not be used';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            const functionToolCall: RequiredFunctionToolCall = {
                type: 'function',
                id: 'test-tool-id',
                function: {
                    name: 'test-action',
                    arguments: '{}',
                    output: null
                }
            };
            const requiredAction: RequiredAction = {
                type: 'submit_tool_outputs',
                submitToolOutputs: {
                    toolCalls: [functionToolCall]
                }
            };

            testClient.remainingActions.push(requiredAction);
            testClient.remainingRunStatus.push('requires_action');
            testClient.remainingRunStatus.push('in_progress');
            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const plan1 = await planner.continueTask(context, state, ai);
            state.temp.actionOutputs['test-action'] = 'test-output';
            const plan2 = await planner.continueTask(context, state, ai);

            assert(plan1);
            assert(plan1.commands);
            assert.equal(plan1.commands.length, 1);
            assert.equal(plan1.commands[0].type, 'DO');
            assert.equal((plan1.commands[0] as PredictedDoCommand).action, 'test-action');
            assert(plan2);
            assert(plan2.commands);
            assert.equal(plan2.commands[0].type, 'SAY');
            assert.equal((plan2.commands[0] as PredictedSayCommand).response.content, 'welcome');

            const toolMap: { [key: string]: string } = state.getValue('temp.submit_tool_map');
            assert(toolMap);
            assert.equal(Object.keys(toolMap).length, 1);
            assert('test-action' in toolMap);
            assert(toolMap['test-action'], 'test-tool_id');
        });

        it('handles multiple messages', async () => {
            const testClient = new TestAssistantsClient();
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';
            state.temp.actionOutputs['other-action'] = 'should not be used';

            const aiOptions: AIOptions<TurnState> = {
                planner: planner
            };
            const ai = new AI<TurnState>(aiOptions);

            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('message 2');
            testClient.remainingMessages.push('message 1');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.continueTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 3);
            assert.equal(plan.commands[0].type, 'SAY');
            assert.equal((plan.commands[0] as PredictedSayCommand).response.content, 'message 2');
            assert.equal((plan.commands[1] as PredictedSayCommand).response.content, 'message 1');
            assert.equal((plan.commands[2] as PredictedSayCommand).response.content, 'welcome');
        });
    });
});

class TestAssistantsPlanner<TState extends TurnState = TurnState> extends AssistantsPlanner<TState> {
    public constructor(options: AssistantsPlannerOptions, client: AssistantsClient) {
        options.polling_interval = 2;
        super(options);
        this._client = client;
    }
}

class TestAssistantsClient extends AssistantsClient {
    private _threads: AssistantThread[];
    private _messages: { [key: string]: ThreadMessage[] };
    private _runs: { [key: string]: ThreadRun[] };
    public remainingActions: RequiredAction[];
    public remainingRunStatus: string[];
    public remainingMessages: string[];

    private _assistant: Assistant;

    public constructor() {
        super(new OpenAIKeyCredential('api-key'));
        this._threads = [];
        this._messages = {};
        this._runs = {};
        this.remainingActions = [];
        this.remainingRunStatus = [];
        this.remainingMessages = [];
        this._assistant = {
            id: 'assistant_id',
            createdAt: new Date(),
            name: 'test assistant',
            description: 'test assistant description',
            model: 'test model',
            instructions: 'test instructions',
            tools: [],
            fileIds: [],
            metadata: null
        };
    }

    public override async createMessage(
        threadId: string,
        role: MessageRole,
        content: string,
        options?: CreateMessageOptions
    ): Promise<ThreadMessage> {
        const newMessage: ThreadMessage = {
            id: Date.now().toString(),
            createdAt: new Date(),
            threadId: threadId,
            role: role,
            content: [{ type: 'text', text: { value: content, annotations: [] } }],
            assistantId: this._assistant?.id,
            runId: '',
            fileIds: options?.fileIds,
            metadata: null
        };

        if (threadId in this._messages) {
            this._messages[threadId].push(newMessage);
        } else {
            this._messages[threadId] = [newMessage];
        }

        return newMessage;
    }

    public override async createThread(
        body?: AssistantThreadCreationOptions,
        options?: CreateThreadOptions
    ): Promise<AssistantThread> {
        const newThread: AssistantThread = {
            id: Date.now().toString(),
            createdAt: new Date(),
            metadata: body!.metadata ?? null
        };

        const newMessages: ThreadMessage[] = [];
        const len = body?.messages?.length ?? 0;
        for (let i = 0; i < len; i++) {
            const m = body!.messages![i];
            const newMessage: ThreadMessage = {
                role: m.role,
                id: Date.now.toString(),
                createdAt: new Date(),
                threadId: newThread.id,
                content: [{ type: 'text', text: { value: m.content, annotations: [] } }],
                assistantId: this._assistant?.id,
                runId: '',
                fileIds: [],
                metadata: null
            };
            newMessages.push(newMessage);
        }

        this._messages[newThread.id] = newMessages;
        this._threads.push(newThread);
        return Promise.resolve(newThread);
    }

    public override async listMessages(
        thread_id: string,
        options?: ListMessagesOptions
    ): Promise<ListResponseOf<ThreadMessage>> {
        while (this.remainingMessages.length > 0) {
            const nextMessage = this.remainingMessages.shift(); // Removes the first element from the list
            this.createMessage(thread_id, 'user', nextMessage!);
        }

        const lastMessageId = options?.before;
        const i = this._messages[thread_id].findIndex((m) => m.id == lastMessageId);
        const filteredMessages = this._messages[thread_id].slice(i + 1);

        // the elements are in ascending order of the creation timestamp
        filteredMessages.reverse();

        return Promise.resolve({
            data: filteredMessages,
            firstId: '',
            lastId: '',
            hasMore: false
        });
    }

    public async createRun(
        thread_id: string,
        createRunOptions: CreateRunOptions,
        options?: CreateRunRequestOptions
    ): Promise<ThreadRun> {
        let remainingActions: RequiredAction;

        if (this.remainingActions.length > 0) {
            remainingActions = this.remainingActions.shift()!;
        }

        const newRun: ThreadRun = {
            id: Date.now().toString(),
            threadId: thread_id,
            assistantId: this._assistant!.id,
            status: 'in_progress',
            requiredAction: remainingActions!,
            model: this._assistant?.model ?? 'test-model',
            instructions: this._assistant?.instructions ?? 'instructions',
            tools: this._assistant?.tools ?? [],
            fileIds: [],
            createdAt: new Date(),
            expiresAt: new Date(),
            startedAt: new Date(),
            completedAt: new Date(),
            cancelledAt: new Date(),
            failedAt: new Date(),
            metadata: null
        };

        if (thread_id in this._runs) {
            this._runs[thread_id].push(newRun);
        } else {
            this._runs[thread_id] = [newRun];
        }

        return Promise.resolve(newRun);
    }

    public override async getRun(threadId: string, runId: string, options?: GetRunOptions): Promise<ThreadRun> {
        if (this._runs[threadId].length == 0) {
            return Promise.reject();
        }

        const runStatus = this.remainingRunStatus.shift(); // dequeue
        const i = this._runs[threadId].findIndex((r) => r.id == runId);

        const run = this._runs[threadId][i];
        run.status = runStatus!;

        return Promise.resolve(run);
    }

    public override async listRuns(threadId: string, options?: ListRunsOptions): Promise<ListResponseOf<ThreadRun>> {
        const runs = this._runs[threadId] ?? [];
        return {
            data: runs,
            firstId: '',
            lastId: '',
            hasMore: false
        };
    }

    public override async submitToolOutputsToRun(
        threadId: string,
        runId: string,
        toolOutputs: ToolOutput[],
        options?: SubmitToolOutputsToRunOptions
    ): Promise<ThreadRun> {
        return Promise.resolve(this.getRun(threadId, runId));
    }
}
