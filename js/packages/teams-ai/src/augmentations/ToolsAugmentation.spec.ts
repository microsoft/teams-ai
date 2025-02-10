import assert from 'assert';
import { TestAdapter } from 'botbuilder';

import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPTTokenizer } from '../tokenizers';
import { ActionCall, PromptResponse } from '../types';

import { ToolsAugmentation } from './ToolsAugmentation';
import { PredictedDoCommand } from '../planners';

describe('ToolsAugmentation', () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPTTokenizer();
    let toolsAugmentation: ToolsAugmentation;

    before(() => {
        toolsAugmentation = new ToolsAugmentation();
    });

    describe('constructor', () => {
        it('should create a ToolsAugmentation', () => {
            assert.notEqual(toolsAugmentation, undefined);
        });
    });

    describe('createPromptSection', () => {
        it('should render an undefined prompt section', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const section = await toolsAugmentation.createPromptSection();
                assert.equal(section, undefined);
            });
        });
    });

    describe('validateResponse', () => {
        it('should pass a valid response', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const response = await toolsAugmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: 'Hello! I am a friendly assistant' } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, true);
            });
        });
    });

    describe('createPlanFromResponse', () => {
        it('should create a plan with a single SAY command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const plan = await toolsAugmentation.createPlanFromResponse(context, state, {
                    status: 'success',
                    message: { role: 'assistant', content: 'Hello! I am a friendly assistant' }
                });
                assert.notEqual(plan, undefined);
                assert.equal(plan.type, 'plan');
                assert.equal(plan.commands.length, 1);
                assert.deepEqual(plan.commands[0], {
                    type: 'SAY',
                    response: { role: 'assistant', content: 'Hello! I am a friendly assistant' }
                });
            });
        });

        it('should create a plan from response containing an action', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const actionCalls: ActionCall[] = [
                    {
                        type: 'function',
                        id: '123',
                        function: {
                            name: 'LightsOn',
                            arguments: ''
                        }
                    }
                ];
                const response: PromptResponse<string | ActionCall[]> = {
                    status: 'success',
                    input: {
                        role: 'user',
                        content: 'Turn on lights'
                    },
                    message: { role: 'assistant', content: '', action_calls: actionCalls }
                };
                const state = await TestTurnState.create(context);
                const plan = await toolsAugmentation.createPlanFromResponse(context, state, response);

                assert(plan.type === 'plan');
                assert(plan.commands.length === 1);
                assert(plan.commands[0].type === 'DO');
                assert((plan.commands[0] as PredictedDoCommand).action === 'LightsOn');
                assert.deepEqual((plan.commands[0] as PredictedDoCommand).parameters, {});
            });
        });

        it('should create a plan from response containing two actions with the second action paused', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const actionCalls: ActionCall[] = [
                    {
                        type: 'function',
                        id: '123',
                        function: {
                            name: 'LightsOn',
                            arguments: ''
                        }
                    },
                    {
                        type: 'function',
                        id: '124',
                        function: {
                            name: 'Pause',
                            arguments: '{ "time": 10 }'
                        }
                    }
                ];
                const response: PromptResponse<string | ActionCall[]> = {
                    status: 'success',
                    input: {
                        role: 'user',
                        content: 'Perform actions'
                    },
                    message: { role: 'assistant', content: '', action_calls: actionCalls }
                };
                const state = await TestTurnState.create(context);
                const plan = await toolsAugmentation.createPlanFromResponse(context, state, response);

                assert(plan.type === 'plan');
                assert(plan.commands.length === 2);
                assert(plan.commands[0].type === 'DO');
                assert((plan.commands[0] as PredictedDoCommand).action === 'LightsOn');
                assert.deepEqual((plan.commands[0] as PredictedDoCommand).parameters, {});
                assert(plan.commands[1].type === 'DO');
                assert((plan.commands[1] as PredictedDoCommand).action === 'Pause');
                assert((plan.commands[1] as PredictedDoCommand).parameters, '{ time: 10 }');
            });
        });

        it('should handle empty response gracefully', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const response: PromptResponse<string | ActionCall[]> = {
                    status: 'success',
                    input: {
                        role: 'user',
                        content: 'Test empty response'
                    },
                    message: { role: 'assistant', content: '', action_calls: [] }
                };
                const state = await TestTurnState.create(context);
                const plan = await toolsAugmentation.createPlanFromResponse(context, state, response);

                assert(plan.type === 'plan');
                assert(plan.commands.length === 0);
            });
        });

        it('should handle empty arguments gracefully', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const actionCalls: ActionCall[] = [
                    {
                        type: 'function',
                        id: '123',
                        function: {
                            name: 'LightsOn',
                            arguments: ''
                        }
                    },
                    {
                        type: 'function',
                        id: '124',
                        function: {
                            name: 'Pause',
                            arguments: '{ "time": 10 }'
                        }
                    }
                ];
                const response: PromptResponse<string | ActionCall[]> = {
                    status: 'success',
                    input: {
                        role: 'user',
                        content: 'Perform actions'
                    },
                    message: { role: 'assistant', content: '', action_calls: actionCalls }
                };
                const state = await TestTurnState.create(context);
                const plan = await toolsAugmentation.createPlanFromResponse(context, state, response);

                assert(plan.type === 'plan');
                assert(plan.commands.length === 2);
                assert(plan.commands[0].type === 'DO');
                assert((plan.commands[0] as PredictedDoCommand).action === 'LightsOn');
                assert.deepEqual((plan.commands[0] as PredictedDoCommand).parameters, {});
                assert(plan.commands[1].type === 'DO');
                assert((plan.commands[1] as PredictedDoCommand).action === 'Pause');
                assert.deepEqual((plan.commands[1] as PredictedDoCommand).parameters, { time: 10 });
            });
        });
    });
});
