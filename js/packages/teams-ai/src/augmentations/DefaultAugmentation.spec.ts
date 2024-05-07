import assert from 'assert';
import { TestAdapter } from 'botbuilder';

import { TestTurnState } from '../internals/testing/TestTurnState';
import { PromptResponse } from '../models';
import { GPTTokenizer } from '../tokenizers';
import { DefaultAugmentation } from './DefaultAugmentation';

describe('DefaultAugmentation', () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPTTokenizer();
    const valid_content = JSON.stringify({
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
    const valid_SAY = JSON.stringify({
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

    describe('constructor', () => {
        it('should create a DefaultAugmentation', () => {
            const augmentation = new DefaultAugmentation();
            assert.notEqual(augmentation, undefined);
        });
    });

    describe('createPromptSection', () => {
        it('should render an undefined prompt section', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const augmentation = new DefaultAugmentation();
                const section = await augmentation.createPromptSection();
                assert.equal(section, undefined);
            });
        });
    });

    describe('validateResponse', () => {
        it('should pass a valid response', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new DefaultAugmentation();
                const response = await augmentation.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: { role: 'assistant', content: valid_content } },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.type, 'Validation');
                assert.equal(response.valid, true);
            });
        });
    });

    describe('createPlanFromResponse', () => {
        it('should create a plan with a single SAY command containing the models response', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const augmentation = new DefaultAugmentation();

                // Validate response
                const response: PromptResponse<string> = {
                    status: 'success',
                    message: { role: 'assistant', content: valid_SAY }
                };
                const validation = await augmentation.validateResponse(context, state, tokenizer, response, 3);
                assert.equal(validation.type, 'Validation');
                assert.equal(validation.valid, true);

                // Create plan from response
                const plan = await augmentation.createPlanFromResponse(context, state, {
                    status: 'success',
                    message: { role: 'assistant', content: validation.value ?? '' }
                });
                assert.notEqual(plan, undefined);
                assert.deepEqual(plan, {
                    type: 'plan',
                    commands: [
                        {
                            type: 'SAY',
                            response: {
                                role: 'assistant',
                                content: ''
                            }
                        }
                    ]
                });
            });
        });
    });
});
