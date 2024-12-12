/// <reference types="mocha" />

import assert from 'assert';
import OpenAI from 'openai';
import { TurnContext, TestAdapter } from 'botbuilder-core';
import sinon from 'sinon';

import { TurnState } from '../TurnState';
import { AssistantsPlanner, AssistantsPlannerOptions } from './AssistantsPlanner';
import { AI } from '../AI';
import { PredictedDoCommand, PredictedSayCommand } from './Planner';

describe('AssistantsPlanner', () => {
    let planner: AssistantsPlanner<TurnState>;
    let openAIStub: sinon.SinonStubbedInstance<OpenAI>;
    let context: TurnContext;
    let state: TurnState;
    let ai: AI<TurnState>;

    beforeEach(async () => {
        openAIStub = sinon.createStubInstance(OpenAI);
        openAIStub.beta = {
            threads: {
                create: sinon.stub().resolves({ id: 'test-thread-id' }),
                runs: {
                    create: sinon.stub().resolves({ id: 'test-run-id', status: 'completed' }),
                    createAndPoll: sinon.stub().resolves({ id: 'test-run-id', status: 'completed' }),
                    retrieve: sinon.stub().resolves({ id: 'test-run-id', status: 'completed' }),
                    submitToolOutputs: sinon.stub().resolves({ id: 'test-run-id', status: 'completed' }),
                    submitToolOutputsAndPoll: sinon.stub().resolves({ id: 'test-run-id', status: 'completed' }),
                    list: sinon.stub().resolves({
                        data: [
                            {
                                id: 'test-run-id',
                                status: 'completed'
                            }
                        ]
                    })
                },
                messages: {
                    create: sinon.stub().resolves({ id: 'test-message-id' }),
                    list: sinon.stub().resolves({
                        data: [
                            {
                                id: 'test-message-id',
                                content: [{ type: 'text', text: { value: 'Test response' } }]
                            }
                        ]
                    })
                }
            }
        } as unknown as OpenAI['beta'];

        const options: AssistantsPlannerOptions = {
            apiKey: 'test-key',
            assistant_id: 'test-assistant-id',
            api_version: '2024-02-15'
        };

        planner = new AssistantsPlanner<TurnState>(options);
        (planner as any)._client = openAIStub;

        const testAdapter = new TestAdapter();
        context = new TurnContext(testAdapter, {
            type: 'message',
            text: 'test input',
            channelId: 'test',
            from: { id: 'user', name: 'User' },
            recipient: { id: 'bot', name: 'Bot' },
            conversation: { id: 'conversation', isGroup: false, conversationType: 'personal', name: 'Conversation' },
            channelData: {}
        });

        state = new TurnState();
        await state.load(context);
        state.temp = {
            input: 'test input',
            inputFiles: [],
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        ai = new AI<TurnState>({ planner });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('beginTask', () => {
        it('should create a thread and run, then return a plan', async () => {
            (openAIStub.beta.threads.messages.list as sinon.SinonStub).resolves({
                data: [
                    {
                        id: 'test-message-id-2',
                        content: [{ type: 'text', text: { value: 'New response' } }]
                    },
                    {
                        id: 'test-message-id',
                        content: [{ type: 'text', text: { value: 'Test response' } }]
                    }
                ]
            });

            const plan = await planner.beginTask(context, state, ai);

            sinon.assert.calledOnce(openAIStub.beta.threads.create as sinon.SinonStub);
            sinon.assert.calledWith(openAIStub.beta.threads.messages.create as sinon.SinonStub, 'test-thread-id', {
                role: 'user',
                content: 'test input'
            });
            sinon.assert.calledWith(openAIStub.beta.threads.runs.createAndPoll as sinon.SinonStub, 'test-thread-id', {
                assistant_id: 'test-assistant-id'
            });

            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 1);
            assert.strictEqual(plan.commands[0].type, 'SAY');
            assert.strictEqual((plan.commands[0] as PredictedSayCommand).response.content, 'New response');
        });

        it('should handle run cancellation', async () => {
            (openAIStub.beta.threads.runs.retrieve as sinon.SinonStub).resolves({
                id: 'test-run-id',
                status: 'cancelled'
            });

            const plan = await planner.beginTask(context, state, ai);

            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 0);
        });

        it('should handle run expiration', async () => {
            (openAIStub.beta.threads.runs.retrieve as sinon.SinonStub).resolves({
                id: 'test-run-id',
                status: 'expired'
            });

            const plan = await planner.beginTask(context, state, ai);

            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 1);
            assert.strictEqual(plan.commands[0].type, 'DO');
            assert.strictEqual((plan.commands[0] as PredictedDoCommand).action, AI.TooManyStepsActionName);
        });

        it('should throw an error on run failure', async () => {
            (openAIStub.beta.threads.runs.retrieve as sinon.SinonStub).resolves({
                id: 'test-run-id',
                status: 'failed',
                last_error: { code: 'test_error', message: 'Test error message' }
            });

            await assert.rejects(
                () => planner.beginTask(context, state, ai),
                /Run failed failed. ErrorCode: test_error. ErrorMessage: Test error message/
            );
        });
    });

    describe('continueTask', () => {
        it('should continue an existing thread and run', async () => {
            // Setup the initial state
            state.setValue('conversation.assistants_state', {
                thread_id: 'existing-thread-id',
                run_id: 'existing-run-id',
                last_message_id: 'existing-message-id'
            });

            // Setup action outputs
            state.temp.actionOutputs = { test_function: 'test output' };
            state.setValue('temp.submitToolMap', { test_function: 'test-tool-call-id' });
            state.setValue('temp.submitToolOutputs', true);

            // Mock messages list response
            (openAIStub.beta.threads.messages.list as sinon.SinonStub).resolves({
                data: [
                    {
                        id: 'new-message-id',
                        content: [{ type: 'text', text: { value: 'New response' } }]
                    },
                    {
                        id: 'existing-message-id',
                        content: [{ type: 'text', text: { value: 'Old response' } }]
                    }
                ]
            });

            const plan = await planner.continueTask(context, state, ai);

            // Verify submitToolOutputsAndPoll was called with correct arguments
            sinon.assert.calledWith(
                openAIStub.beta.threads.runs.submitToolOutputsAndPoll as sinon.SinonStub,
                'existing-thread-id',
                'existing-run-id',
                {
                    tool_outputs: [
                        {
                            tool_call_id: 'test-tool-call-id',
                            output: 'test output'
                        }
                    ]
                }
            );

            // Verify the plan structure
            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 1);
            assert.strictEqual(plan.commands[0].type, 'SAY');
            assert.strictEqual((plan.commands[0] as PredictedSayCommand).response.content, 'New response');
        });

        it('should handle required actions', async () => {
            (openAIStub.beta.threads.runs.retrieve as sinon.SinonStub).resolves({
                id: 'test-run-id',
                status: 'requires_action',
                required_action: {
                    type: 'submit_tool_outputs',
                    submit_tool_outputs: {
                        tool_calls: [
                            {
                                id: 'test-tool-call-id',
                                type: 'function',
                                function: {
                                    name: 'test_function',
                                    arguments: '{"arg1": "value1"}'
                                }
                            }
                        ]
                    }
                }
            });

            const plan = await planner.continueTask(context, state, ai);

            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 1);
            assert.strictEqual(plan.commands[0].type, 'DO');
            assert.strictEqual((plan.commands[0] as PredictedDoCommand).action, 'test_function');
            assert.deepStrictEqual((plan.commands[0] as PredictedDoCommand).parameters, { arg1: 'value1' });
        });
    });

    describe('submitActionResults', () => {
        it('should submit action results and return a plan', async () => {
            // Setup the initial state
            state.setValue('conversation.assistants_state', {
                thread_id: 'test-thread-id',
                run_id: 'test-run-id',
                last_message_id: 'test-message-id'
            });

            // Setup action outputs
            state.temp.actionOutputs = { test_function: 'test output' };
            state.setValue('temp.submitToolMap', { test_function: 'test-tool-call-id' });

            // Mock messages list response with messages before last_message_id
            (openAIStub.beta.threads.messages.list as sinon.SinonStub).resolves({
                data: [
                    {
                        id: 'new-message-id',
                        content: [{ type: 'text', text: { value: 'New response' } }]
                    },
                    {
                        id: 'test-message-id',
                        content: [{ type: 'text', text: { value: 'Old response' } }]
                    }
                ]
            });

            // Mock the run completion
            (openAIStub.beta.threads.runs.submitToolOutputsAndPoll as sinon.SinonStub).resolves({
                id: 'test-run-id',
                status: 'completed'
            });

            const plan = await (planner as any).submitActionResults(context, state, ai);

            // Verify submitToolOutputsAndPoll was called with correct arguments
            sinon.assert.calledWith(
                openAIStub.beta.threads.runs.submitToolOutputsAndPoll as sinon.SinonStub,
                'test-thread-id',
                'test-run-id',
                {
                    tool_outputs: [
                        {
                            tool_call_id: 'test-tool-call-id',
                            output: 'test output'
                        }
                    ]
                }
            );

            // Verify the plan structure
            assert.strictEqual(plan.type, 'plan');
            assert.strictEqual(plan.commands.length, 1);
            assert.strictEqual(plan.commands[0].type, 'SAY');
            assert.strictEqual((plan.commands[0] as PredictedSayCommand).response.content, 'New response');
        });
    });

    describe('blockOnInProgressRuns', () => {
        it('should wait for in-progress runs to complete', async () => {
            (openAIStub.beta.threads.runs.list as sinon.SinonStub)
                .onFirstCall()
                .resolves({
                    data: [{ id: 'run-1', status: 'in_progress' }]
                })
                .onSecondCall()
                .resolves({
                    data: [{ id: 'run-1', status: 'completed' }]
                });

            await (planner as any).blockOnInProgressRuns('test-thread-id');

            sinon.assert.calledWith(openAIStub.beta.threads.runs.list as sinon.SinonStub, 'test-thread-id');
        });
    });
});
