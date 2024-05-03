import assert from 'assert';
import { TestAdapter } from 'botbuilder';

import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { ChatCompletionAction, PromptResponse } from '../models';
import { GPTTokenizer } from '../tokenizers';
import { SequenceAugmentation } from './SequenceAugmentation';

describe('SequenceAugmentation', () => {
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
    const missing_action_DO = JSON.stringify({
        type: 'plan',
        commands: [
            {
                type: 'DO'
            }
        ]
    });
    const invalid_action_DO = JSON.stringify({
        type: 'plan',
        commands: [
            {
                type: 'DO',
                action: 'randomAction'
            }
        ]
    });
    const missing_response_SAY = JSON.stringify({
        type: 'plan',
        commands: [
            {
                type: 'SAY'
            }
        ]
    });
    const random_response = JSON.stringify({
        type: 'plan',
        commands: [
            {
                type: 'DOO'
            }
        ]
    });
    const valid_SAY_and_DO = JSON.stringify({
        type: 'plan',
        commands: [
            {
                type: 'DO',
                action: 'test',
                parameters: {
                    foo: 'bar'
                }
            },
            {
                type: 'SAY',
                response: 'hello world'
            }
        ]
    });

    describe('constructor', () => {
        it('should create a SequenceAugmentation', () => {
            const augmentation = new SequenceAugmentation(actions);
            assert.notEqual(augmentation, undefined);
        });
    });

    describe('createPromptSection', () => {
        it('should render a SequenceAugmentation to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const section = await augmentation.createPromptSection();
                assert.notEqual(section, undefined);

                const rendered = await section!.renderAsMessages(context, state, functions, tokenizer, 2000);
                assert.equal(rendered.output.length, 1);
                assert.equal(rendered.output[0].role, 'system');
                assert.equal(rendered.output[0].content?.includes('test action'), true);
                assert.equal(
                    rendered.output[0].content?.includes(
                        'Use the actions above to create a plan in the following JSON format:'
                    ),
                    true
                );
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('validateResponse', () => {
        it('should fail a response due to badly-formed plan', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: '' } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `Return a JSON object that uses the SAY command to say what you're thinking.`
                );
            });
        });

        it('should fail a response due to missing action in DO command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: missing_action_DO } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The plan JSON is missing the DO "action" for command[0]. Return the name of the action to DO.`
                );
            });
        });

        it('should fail a response due to invalid action in DO command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: invalid_action_DO } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, false);
                assert.equal(response.feedback, `Unknown action named "randomAction". Specify a valid action name.`);
            });
        });

        it('should fail a response due to missing response in SAY command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: missing_response_SAY } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The plan JSON is missing the SAY "response" for command[0]. Return the response to SAY.`
                );
            });
        });

        it('should fail a response due to random command', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: random_response } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, false);
            });
        });

        it('should return a valid response with DO and SAY', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);
                const response: PromptResponse<string> = {
                    status: 'success',
                    message: { role: 'assistant', content: valid_SAY_and_DO }
                };
                const validation = await augmentation.validateResponse(context, state, tokenizer, response, 3);
                assert.equal(validation.type, 'Validation');
                assert.equal(validation.valid, true);
            });
        });
    });

    describe('createPlanFromResponse', async () => {
        it('should create a valid plan with DO and SAY', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new SequenceAugmentation(actions);

                // Validate response
                const response: PromptResponse<string> = {
                    status: 'success',
                    message: { role: 'assistant', content: valid_SAY_and_DO }
                };
                const validation = await augmentation.validateResponse(context, state, tokenizer, response, 3);
                assert.equal(validation.type, 'Validation');
                assert.equal(validation.valid, true);

                // Create plan from response
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
                        },
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
    });
});
