import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';

import { GPTTokenizer } from '../tokenizers';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { ChatCompletionAction, PromptResponse } from '../models';
import { MonologueAugmentation } from './MonologueAugmentation';

describe('MonologueAugmentation', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();
    const actions: ChatCompletionAction[] = [
        {
            name: 'test',
            description: 'test action',
            parameters: {
                type: 'object',
                properties: {
                    foo: {
                        type: 'string'
                    }
                },
                required: ['foo']
            }
        }
    ];
    const valid_monologue = JSON.stringify({
        thoughts: {
            thought: 'test',
            reasoning: 'test',
            plan: 'test'
        },
        action: {
            name: 'test',
            parameters: {
                foo: 'bar'
            }
        }
    });
    const missing_thought = JSON.stringify({
        thoughts: {
            reasoning: 'test',
            plan: 'test'
        },
        action: {
            name: 'test',
            parameters: {
                foo: 'bar'
            }
        }
    });
    const invalid_action = JSON.stringify({
        thoughts: {
            thought: 'test',
            reasoning: 'test',
            plan: 'test'
        },
        action: {
            name: 'foo'
        }
    });
    const valid_SAY = JSON.stringify({
        thoughts: {
            thought: 'test',
            reasoning: 'test',
            plan: 'test'
        },
        action: {
            name: 'SAY',
            parameters: {
                text: 'hello world'
            }
        }
    });

    describe('constructor', () => {
        it('should create a MonologueAugmentation', () => {
            const augmentation = new MonologueAugmentation(actions);
            assert.notEqual(augmentation, undefined);
        });
    });

    describe('createPromptSection', () => {
        it('should render a MonologueAugmentation to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const section = await augmentation.createPromptSection();
                assert.notEqual(section, undefined);
                const rendered = await section!.renderAsMessages(context, state, functions, tokenizer, 2000);
                assert.equal(rendered.output.length, 1);
                assert.equal(rendered.output[0].role, 'system');
                assert.equal(rendered.output[0].content?.includes('test action'), true);
                assert.equal(
                    rendered.output[0].content?.includes(
                        'Return a JSON object with your thoughts and the next action to perform.'
                    ),
                    true
                );
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('validateResponse', () => {
        it('should pass a valid monologue', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: valid_monologue } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.equal(response.feedback, undefined);
                assert.deepEqual(response.value, JSON.parse(valid_monologue));
            });
        });

        it('should fail a monologue with missing thoughts', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: missing_thought } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.notEqual(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });

        it('should fail a monologue with an invalid action', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: invalid_action } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.notEqual(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });
    });

    describe('createPlanFromResponse', () => {
        it('should create a plan with a SAY command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const response: PromptResponse<string> = {
                    status: 'success',
                    message: { role: 'assistant', content: valid_SAY }
                };
                const validation = await augmentation.validateResponse(context, state, tokenizer, response, 3);
                assert.equal(validation.valid, true);
                const plan = await augmentation.createPlanFromResponse(context, state, {
                    status: 'success',
                    message: { role: 'assistant', content: validation.value }
                });
                assert.notEqual(plan, undefined);
                assert.deepEqual(plan, {
                    type: 'plan',
                    commands: [
                        {
                            type: 'SAY',
                            response: {
                                role: 'assistant',
                                content: 'hello world'
                            }
                        }
                    ]
                });
            });
        });

        it('should create a plan with a DO command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new MonologueAugmentation(actions);
                const response: PromptResponse<string> = {
                    status: 'success',
                    message: { role: 'assistant', content: valid_monologue }
                };
                const validation = await augmentation.validateResponse(context, state, tokenizer, response, 3);
                assert.equal(validation.valid, true);
                const plan = await augmentation.createPlanFromResponse(context, state, {
                    status: 'success',
                    message: { role: 'assistant', content: validation.value }
                });
                assert.notEqual(plan, undefined);
                assert.deepEqual(plan, {
                    type: 'plan',
                    commands: [
                        {
                            type: 'DO',
                            action: 'test',
                            parameters: {
                                foo: 'bar'
                            }
                        }
                    ]
                });
            });
        });
    });
});
