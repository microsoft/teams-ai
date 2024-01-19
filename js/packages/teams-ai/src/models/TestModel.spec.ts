import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import { TestModel } from './TestModel';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPT3Tokenizer } from '../tokenizers';
import { PromptTemplate, SystemMessage } from '../prompts';

describe('TestModel', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();
    const template: PromptTemplate = {
        name: 'test',
        prompt: new SystemMessage('Hello World'),
        config: {
            schema: 1.1,
            type: 'completion',
            completion: {
                frequency_penalty: 0,
                include_history: true,
                include_input: true,
                include_images: false,
                max_input_tokens: 100,
                max_tokens: 100,
                presence_penalty: 0,
                temperature: 0.5,
                top_p: 1
            }
        }
    };

    describe('constructor', () => {
        it('should create a TestModel with default params', () => {
            const client = new TestModel();
            assert.equal(client.status, 'success');
            assert.deepEqual(client.response, { role: 'assistant', content: 'Hello World' });
        });

        it('should create a TestModel with custom params', () => {
            const client = new TestModel('error', { role: 'assistant', content: 'Hello Error' });
            assert.equal(client.status, 'error');
            assert.deepEqual(client.response, { role: 'assistant', content: 'Hello Error' });
        });
    });

    describe('completePrompt', () => {
        it('should return a success response', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const client = new TestModel();
                const response = await client.completePrompt(context, state, functions, tokenizer, template);
                assert.equal(response.status, 'success');
                assert.deepEqual(response.message, { role: 'assistant', content: 'Hello World' });
            });
        });
    });
});
