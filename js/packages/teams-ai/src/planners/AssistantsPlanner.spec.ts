/// <reference types="mocha" />

import assert from 'assert';
import OpenAI from 'openai';
import { Activity } from 'botframework-schema';
import { TestAdapter, TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';
import { AssistantsPlanner, AssistantsPlannerOptions } from './AssistantsPlanner';
import { AI } from '../AI';
import { Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';

describe('AssistantsPlanner', () => {
    const createTurnContextAndState = async (activity: Partial<Activity>): Promise<[TurnContext, TurnState]> => {
        const testAdapter = new TestAdapter();
        const context = new TurnContext(testAdapter, {
            channelId: 'msteams',
            recipient: { id: 'bot', name: 'bot' },
            from: { id: 'user', name: 'user' },
            conversation: { id: 'convo', isGroup: false, conversationType: 'personal', name: 'convo' },
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
        it('expects a single reply', async function () {
            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

            testClient.remainingRunStatus.push('completed');
            testClient.remainingMessages.push('welcome');

            const thread = await testClient.beta.threads.create({});
            state.setValue('conversation.assistants_state', {
                thread_id: thread.id,
                run_id: null,
                last_message_id: null
            });

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 1);
            assert.equal(plan.commands[0].type, 'SAY');
            assert.equal('welcome', (plan.commands[0] as PredictedSayCommand).response.content);
        });

        it('waits for current run', async function () {
            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

            testClient.remainingRunStatus.push('in_progress', 'in_progress', 'completed');
            testClient.remainingMessages.push('welcome');

            const thread = await testClient.beta.threads.create({});
            await testClient.beta.threads.runs.create(thread.id, { assistant_id: 'test-assistant-id' });
            state.setValue('conversation.assistants_state', {
                thread_id: thread.id,
                run_id: null,
                last_message_id: null
            });

            await planner.testBlockOnInProgressRuns(thread.id);

            const plan = await planner.beginTask(context, state, ai);

            assert(plan, 'Plan should not be null');
            assert(plan.commands, 'Plan should have commands');
            assert.equal(plan.commands.length, 1, 'Plan should have one command');
            assert.equal(plan.commands[0].type, 'SAY', 'Command should be of type SAY');
            assert.equal(
                (plan.commands[0] as PredictedSayCommand).response.content,
                'welcome',
                'Command content should be "welcome"'
            );
        });

        it('waits for previous run', async function () {
            this.timeout(2500);

            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

            testClient.remainingRunStatus.push('in_progress', 'failed', 'in_progress', 'completed');
            testClient.remainingMessages.push('welcome');

            const thread = await testClient.beta.threads.create({});
            const previousRun = await testClient.beta.threads.runs.create(thread.id, { assistant_id: 'assistant_id' });
            state.setValue('conversation.assistants_state', {
                thread_id: thread.id,
                run_id: previousRun.id,
                last_message_id: null
            });

            await planner.testBlockOnInProgressRuns(thread.id);

            const plan = await planner.beginTask(context, state, ai);

            assert(plan, 'Plan should not be null');
            assert(plan.commands, 'Plan should have commands');
            assert.equal(plan.commands.length, 1, 'Plan should have one command');
            assert.equal(plan.commands[0].type, 'SAY', 'Command should be of type SAY');
            assert.equal(
                (plan.commands[0] as PredictedSayCommand).response.content,
                'welcome',
                'Command content should be "welcome"'
            );
        });

        it('run cancelled', async () => {
            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

            testClient.remainingRunStatus.push('cancelled');
            testClient.remainingMessages.push('welcome');

            const plan = await planner.beginTask(context, state, ai);

            assert(plan);
            assert(plan.commands);
            assert.equal(plan.commands.length, 0);
        });

        it('run expired', async () => {
            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

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
            const testClient = new TestAssistantsClient('test-api-key');
            const planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            const [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            const ai = new AI<TurnState>({ planner: planner });

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
        let testClient: TestAssistantsClient;
        let planner: TestAssistantsPlanner<TurnState>;
        let context: TurnContext;
        let state: TurnState;
        let ai: AI<TurnState>;

        beforeEach(async () => {
            testClient = new TestAssistantsClient('test-api-key');
            planner = new TestAssistantsPlanner<TurnState>(
                { apiKey: 'test-key', assistant_id: 'test-assistant-id' },
                testClient
            );
            [context, state] = await createTurnContextAndState({});
            state.temp.input = 'hello';

            ai = new AI<TurnState>({ planner: planner });
        });

        describe('when action is required', () => {
            let functionToolCall: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall;
            let requiredAction: OpenAI.Beta.Threads.Run['required_action'];

            beforeEach(() => {
                functionToolCall = {
                    id: 'test-tool-id',
                    type: 'function',
                    function: {
                        name: 'test-action',
                        arguments: '{}'
                    }
                };
                requiredAction = {
                    type: 'submit_tool_outputs',
                    submit_tool_outputs: {
                        tool_calls: [functionToolCall]
                    }
                };

                testClient.remainingActions = [requiredAction];
                testClient.remainingRunStatus = ['requires_action'];
            });

            it('should return a DO command', async () => {
                const thread = await testClient.beta.threads.create({});
                const run = await testClient.beta.threads.runs.create(thread.id, { assistant_id: 'test-assistant-id' });
                state.setValue('conversation.assistants_state', {
                    thread_id: thread.id,
                    run_id: run.id,
                    last_message_id: null
                });
                state.setValue('temp.submitToolOutputs', true);
                state.setValue('temp.submitToolMap', { 'test-action': 'test-tool-id' });

                const plan = await planner.continueTask(context, state, ai);

                assert(plan, 'Plan should not be null');
                assert(plan.commands, 'Plan should have commands');
                assert.equal(plan.commands.length, 1, 'Plan should have exactly one command');
                assert.equal(plan.commands[0].type, 'DO', 'Command should be of type DO');
                assert.equal((plan.commands[0] as PredictedDoCommand).action, 'test-action', 'Command action should be test-action');
            });

            it('should update the tool map', async () => {
                const thread = await testClient.beta.threads.create({});
                const run = await testClient.beta.threads.runs.create(thread.id, { assistant_id: 'test-assistant-id' });
                state.setValue('conversation.assistants_state', {
                    thread_id: thread.id,
                    run_id: run.id,
                    last_message_id: null
                });
                state.setValue('temp.submitToolOutputs', true);

                await planner.continueTask(context, state, ai);

                const toolMap: { [key: string]: string } = state.getValue('temp.submitToolMap');
                assert(toolMap, 'Tool map should exist');
                assert.equal(Object.keys(toolMap).length, 1, 'Tool map should have one entry');
                assert('test-action' in toolMap, 'Tool map should contain test-action');
                assert.equal(toolMap['test-action'], 'test-tool-id', 'Tool map should map test-action to test-tool-id');
            });
        });

        describe('when action is completed', () => {
            beforeEach(() => {
                testClient.remainingRunStatus = ['completed'];
                testClient.remainingMessages = ['welcome'];
            });

            it('should return a SAY command', async function() {
                this.timeout(5000);

                const thread = await testClient.beta.threads.create({});
                const run = await testClient.beta.threads.runs.create(thread.id, { assistant_id: 'test-assistant-id' });
                state.setValue('conversation.assistants_state', {
                    thread_id: thread.id,
                    run_id: run.id,
                    last_message_id: null
                });
                state.temp.actionOutputs['test-action'] = 'test-output';
                state.setValue('temp.submitToolOutputs', false);

                const plan = await planner.continueTask(context, state, ai);

                assert(plan, 'Plan should not be null');
                assert(plan.commands, 'Plan should have commands');
                assert.equal(plan.commands.length, 1, 'Plan should have exactly one command');
                assert.equal(plan.commands[0].type, 'SAY', 'Command should be of type SAY');
                assert.equal((plan.commands[0] as PredictedSayCommand).response.content, 'welcome', 'Command content should be "welcome"');
            });
        });
    });
});

interface TestOpenAI extends Partial<Omit<OpenAI, 'beta'>> {
    beta: Partial<Omit<OpenAI['beta'], 'threads'>> & {
        threads: {
            create: (params?: Partial<OpenAI.Beta.Threads.ThreadCreateParams>) => Promise<OpenAI.Beta.Threads.Thread>;
            runs: {
                create: (
                    threadId: string,
                    params: Partial<OpenAI.Beta.Threads.RunCreateParams>
                ) => Promise<OpenAI.Beta.Threads.Run>;
                retrieve: (threadId: string, runId: string) => Promise<OpenAI.Beta.Threads.Run>;
                submitToolOutputs: (
                    threadId: string,
                    runId: string,
                    params: OpenAI.Beta.Threads.RunSubmitToolOutputsParams
                ) => Promise<OpenAI.Beta.Threads.Run>;
                list: (threadId: string) => Promise<OpenAI.Beta.Threads.RunsPage>;
            };
            messages: {
                create: (
                    threadId: string,
                    params: Partial<OpenAI.Beta.Threads.MessageCreateParams>
                ) => Promise<OpenAI.Beta.Threads.Message>;
                list: (threadId: string) => Promise<OpenAI.Beta.Threads.MessagesPage>;
            };
        };
    };
}

class TestAssistantsClient implements TestOpenAI {
    public remainingActions: OpenAI.Beta.Threads.Run['required_action'][] = [];
    public remainingRunStatus: OpenAI.Beta.Threads.Run['status'][] = [];
    public remainingMessages: string[] = [];

    private _threads = new Map<string, Partial<OpenAI.Beta.Threads.Thread>>();
    private _messages = new Map<string, Partial<OpenAI.Beta.Threads.Message>[]>();
    private _runs = new Map<string, Partial<OpenAI.Beta.Threads.Run>[]>();

    constructor(public apiKey: string = 'test-key') {}

    beta: TestOpenAI['beta'] = {
        threads: {
            create: async (params?: Partial<OpenAI.Beta.Threads.ThreadCreateParams>) => {
                const thread = { id: `thread_${Date.now()}`, ...params } as OpenAI.Beta.Threads.Thread;
                this._threads.set(thread.id, thread);
                return thread;
            },
            runs: {
                create: async (thread_id: string, params: Partial<OpenAI.Beta.Threads.RunCreateParams>) => {
                    const run = { id: `run_${Date.now()}`, thread_id: thread_id, ...params } as OpenAI.Beta.Threads.Run;
                    this._runs.set(thread_id, [...(this._runs.get(thread_id) || []), run]);
                    return run;
                },
                retrieve: async (thread_id: string, run_id: string) => {
                    const run = this._runs.get(thread_id)?.find((r) => r.id === run_id);
                    if (!run) throw new Error('Run not found');
                    if (this.remainingRunStatus.length > 0) {
                        run.status = this.remainingRunStatus.shift()!;
                    } else if (run.status !== 'completed') {
                        run.status = 'completed';
                    }
                    if (run.status === 'requires_action' && this.remainingActions.length > 0) {
                        run.required_action = this.remainingActions.shift()!;
                    } else {
                        run.required_action = null;
                    }
                    return run as OpenAI.Beta.Threads.Run;
                },
                submitToolOutputs: async (
                    thread_id: string,
                    run_id: string,
                    params: OpenAI.Beta.Threads.RunSubmitToolOutputsParams
                ) => {
                    return this.beta.threads.runs.retrieve(thread_id, run_id);
                },
                list: async (thread_id: string) => {
                    return {
                        data: this._runs.get(thread_id) || [],
                        hasNextPage: () => false,
                        getNextPage: () => Promise.resolve({} as OpenAI.Beta.Threads.RunsPage)
                    } as OpenAI.Beta.Threads.RunsPage;
                }
            },
            messages: {
                create: async (thread_id: string, params: Partial<OpenAI.Beta.Threads.MessageCreateParams>) => {
                    const content = Array.isArray(params.content)
                        ? params.content
                        : [{ type: 'text', text: { value: params.content as string } }];
                    const message = {
                        id: `msg_${Date.now()}`,
                        thread_id: thread_id,
                        role: params.role,
                        content: content
                    } as OpenAI.Beta.Threads.Message;
                    this._messages.set(thread_id, [...(this._messages.get(thread_id) || []), message]);
                    return message;
                },
                list: async (thread_id: string) => {
                    let messages = this._messages.get(thread_id) || [];
                    if (this.remainingMessages.length > 0) {
                        const content = this.remainingMessages.shift()!;
                        const message = await this.beta.threads.messages.create(thread_id, {
                            role: 'assistant',
                            content
                        });
                        messages = [message];
                    }
                    return {
                        data: messages,
                        hasNextPage: () => false,
                        getNextPage: () => Promise.resolve({} as OpenAI.Beta.Threads.MessagesPage)
                    } as OpenAI.Beta.Threads.MessagesPage;
                }
            }
        }
    };
}

class TestAssistantsPlanner<TState extends TurnState = TurnState> extends AssistantsPlanner<TState> {
    public testClient: TestAssistantsClient;

    constructor(options: AssistantsPlannerOptions, testClient: TestAssistantsClient) {
        super(options);
        this._client = testClient as unknown as OpenAI;
        this.testClient = testClient;
    }

    public async testBlockOnInProgressRuns(thread_id: string): Promise<void> {
        const testClient = this._client as unknown as TestAssistantsClient;
        const startTime = Date.now();
        const timeout = 5000;

        while (Date.now() - startTime < timeout) {
            const runs = await testClient.beta.threads!.runs!.list!(thread_id);
            if (!runs.data.length || this.testIsRunCompleted(runs.data[0] as OpenAI.Beta.Threads.Run)) {
                return;
            }
            await this.testWaitForRun(thread_id, runs.data[0].id!);
        }
        throw new Error('Run did not complete within the expected time');
    }

    private async testWaitForRun(thread_id: string, run_id: string): Promise<void> {
        const testClient = this._client as unknown as TestAssistantsClient;
        const startTime = Date.now();
        const timeout = 3000;

        while (Date.now() - startTime < timeout) {
            const run = await testClient.beta.threads!.runs!.retrieve!(thread_id, run_id);
            if (this.testIsRunCompleted(run)) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Run ${run_id} did not complete within the expected time`);
    }

    private testIsRunCompleted(run: OpenAI.Beta.Threads.Run): boolean {
        return ['completed', 'failed', 'cancelled', 'expired'].includes(run.status);
    }

    protected async submitActionResults(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        const toolMap = state.getValue('temp.submitToolMap') as { [key: string]: string } | undefined;

        const plan: Plan = { type: 'plan', commands: [] };
        if (this.testClient.remainingActions.length > 0) {
            const action = this.testClient.remainingActions[0];
            if (action!.type === 'submit_tool_outputs' && action!.submit_tool_outputs.tool_calls.length > 0) {
                const toolCall = action!.submit_tool_outputs.tool_calls[0] as OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall;
                plan.commands.push({
                    type: 'DO',
                    action: toolCall.function.name,
                    parameters: JSON.parse(toolCall.function.arguments)
                } as PredictedDoCommand);

                const newToolMap = { ...toolMap, [toolCall.function.name]: toolCall.id };
                state.setValue('temp.submitToolMap', newToolMap);
            }
        }

        return plan;
    }
}
