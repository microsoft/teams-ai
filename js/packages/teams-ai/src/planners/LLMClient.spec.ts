import assert from 'assert';
import { LLMClient } from './LLMClient';
import { TestModel } from '../models/TestModel';
import { TestAdapter } from 'botbuilder-core';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPTTokenizer } from '../tokenizers';
import { Prompt, PromptTemplate, PromptTemplateConfig, UserMessage } from '../prompts';
import { JSONResponseValidator } from '../validators';
import { TestTurnState } from '../internals/testing/TestTurnState';

describe('LLMClient', function() {
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();
    const validator = new JSONResponseValidator();
    const template: PromptTemplate = {
        name: 'test',
        prompt: new Prompt([
            new UserMessage('hello')
        ]),
        config: {} as PromptTemplateConfig
    };
    const model = TestModel.returnContent('hi! how are you?');
    const errorModel = TestModel.returnError(new Error('some error occurred!'));
    const streamingModel = TestModel.streamTextChunks(['hi!', ' how are you?']);

    describe('constructor()', () => {
        it('should create a new instance with defaults', async () => {
            const client = new LLMClient({
                model,
                template
            });
            assert(client, 'client should not be null');
            assert.equal(client.options.model, model, 'model should match');
            assert.equal(client.options.template, template, 'template should match');
        });

        it('should create a new instance with custom options', async () => {
            const client = new LLMClient({
                model,
                template,
                history_variable: 'my_history',
                input_variable: 'my_input',
                max_history_messages: 101,
                max_repair_attempts: 11,
                tokenizer,
                validator,
                logRepairs: true,
            });
            assert(client, 'client should not be null');
            assert.equal(client.options.model, model, 'model should match');
            assert.equal(client.options.template, template, 'template should match');
            assert.equal(client.options.history_variable, 'my_history', 'history_variable should match');
            assert.equal(client.options.input_variable, 'my_input', 'input_variable should match');
            assert.equal(client.options.max_history_messages, 101, 'max_history_messages should match');
            assert.equal(client.options.max_repair_attempts, 11, 'max_repair_attempts should match');
            assert.equal(client.options.tokenizer, tokenizer, 'tokenizer should match');
            assert.equal(client.options.validator, validator, 'validator should match');
            assert.equal(client.options.logRepairs, true, 'logRepairs should match');
        });
    });

    describe('completePrompt()', () => {
        it('should successfully complete a prompt', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('hello', async (context) => {
                const state = await TestTurnState.create(context);
                const client = new LLMClient({
                    model,
                    template
                });
                const response = await client.completePrompt(context, state, functions);
                assert(response, 'response should not be null');
                assert.equal(response.status, 'success', 'response status should be success');
                assert(response.message, 'response message should not be null');
                assert.equal(response.message.role, 'assistant', 'response role should be assistant');
                assert.equal(response.message.content, 'hi! how are you?', 'response message should match');
            });
        });

        it('should fail completing a prompt with an error', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('hello', async (context) => {
                const state = await TestTurnState.create(context);
                const client = new LLMClient({
                    model: errorModel,
                    template
                });
                const response = await client.completePrompt(context, state, functions);
                assert(response, 'response should not be null');
                assert.equal(response.status, 'error', 'response status should be error');
                assert(response.error, 'response error should not be null');
                assert.equal(response.error.message, 'some error occurred!', 'response error message should match');
            });
        });
        
        it('should successfully complete a streaming prompt', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('hello', async (context) => {
                const state = await TestTurnState.create(context);
                const client = new LLMClient({
                    model: streamingModel,
                    template
                });
                const response = await client.completePrompt(context, state, functions);
                assert.equal(adapter.activeQueue.length, 3, 'adapter should have 3 messages in the queue');
                assert(response, 'response should not be null');
                assert.equal(response.status, 'success', 'response status should be success');
                assert(response.message == undefined, 'response message should be null');
            });
        });

        it('should send a startStreamingMessage', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('hello', async (context) => {
                const state = await TestTurnState.create(context);
                const client = new LLMClient({
                    model: streamingModel,
                    template,
                    startStreamingMessage: 'start'
                });
                const response = await client.completePrompt(context, state, functions);
                assert.equal(adapter.activeQueue.length, 4, 'adapter should have 4 messages in the queue');
                assert.equal(adapter.activeQueue[0].text, 'start', 'adapter should have a start message in the queue');
                assert(response, 'response should not be null');
                assert.equal(response.status, 'success', 'response status should be success');
                assert(response.message == undefined, 'response message should be null');
            });
        });
    });
});
