import assert from 'assert';
import { TestModel } from './TestModel';
import { TestAdapter } from 'botbuilder-core';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPTTokenizer } from '../tokenizers';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { Prompt, PromptTemplate, PromptTemplateConfig, UserMessage } from '../prompts';

describe('TestModel', function() {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();
    const prompt: PromptTemplate = {
        name: 'test',
        prompt: new Prompt([
            new UserMessage('hello')
        ]),
        config: {} as PromptTemplateConfig
    };
        
    describe('factories', () => {
        it('should factory a TestModel instance using a handler', async () => {
            const model = TestModel.createTestModel(_ => Promise.resolve({ status: 'success', message: { role: 'assistant', content: 'hello world' } }));
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });

        it('should factory a TestModel instance that returns a response', async () => {
            const model = TestModel.returnContent('hello world');
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });

        it('should factory a TestModel instance that returns content', async () => {
            const model = TestModel.returnContent('hello world');
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });

        it('should factory a TestModel instance that returns an error', async () => {
            const model = TestModel.returnError(new Error('test error'));
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });

        it('should factory a TestModel instance that returns a rate limited error', async () => {
            const model = TestModel.returnRateLimited(new Error('test error'));
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });

        it('should factory a TestModel instance that streams text chunks', async () => {
            const model = TestModel.streamTextChunks(['hello', 'world']);
            assert(model, 'model should not be null');
            assert(model.events, 'model.events should not be null');
        });
    });

    describe('completePrompt()', () => {
        it('should complete a prompt', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const model = TestModel.returnContent('hi! how are you?');
                const response = await model.completePrompt(context, state, functions, tokenizer, prompt);
                assert(response, 'response should not be null');
                assert.equal(response.status, 'success', 'response.status should be "success"');
                assert(response.message, 'response.message should not be null');
                assert.equal(response.message.role, 'assistant', 'response.message.role should be "assistant"');
                assert.equal(response.message.content, 'hi! how are you?', 'response.message.content should be "hi! how are you?"');
            });
        });

        it('should complete a prompt with an error', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const model = TestModel.returnError(new Error('test error'));
                const response = await model.completePrompt(context, state, functions, tokenizer, prompt);
                assert(response, 'response should not be null');
                assert.equal(response.status, 'error', 'response.status should be "error"');
                assert(response.error, 'response.error should not be null');
                assert.equal(response.error.message, 'test error', 'response.error.message should be "test error"');
            });
        });

        it('should complete a prompt with a rate limited error', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const model = TestModel.returnRateLimited(new Error('test error'));
                const response = await model.completePrompt(context, state, functions, tokenizer, prompt);
                assert(response, 'response should not be null');
                assert.equal(response.status, 'rate_limited', 'response.status should be "rate_limited"');
                assert(response.error, 'response.error should not be null');
                assert.equal(response.error.message, 'test error', 'response.error.message should be "test error"');
            });
        }); 

        it('should fire events when completing a prompt', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                let calledBeforeCompletion = false;
                let calledResponseReceived = false;
                const state = await TestTurnState.create(context);
                const model = TestModel.returnContent('hi! how are you?');
                model.events.on('beforeCompletion', (context, memory, functions, tokenizer, template, isStreaming) => {
                    calledBeforeCompletion = true;
                    assert(context, 'context should not be null');
                    assert(memory, 'memory should not be null');
                    assert(functions, 'functions should not be null');
                    assert(tokenizer, 'tokenizer should not be null');
                    assert(template, 'template should not be null');
                    assert.equal(isStreaming, false, 'isStreaming should be false');
                });
                model.events.on('responseReceived', (context, memory, response) => {
                    calledResponseReceived = true;
                    assert(context, 'context should not be null');
                    assert(memory, 'memory should not be null');
                    assert(response, 'response should not be null');
                });
                const response = await model.completePrompt(context, state, functions, tokenizer, prompt);
                assert(response, 'response should not be null');
                assert(calledBeforeCompletion, 'beforeCompletion should have been called');
                assert(calledResponseReceived, 'responseReceived should have been called');
            });
        });

        it('should fire events when streaming back text chunks', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                let calledBeforeCompletion = false;
                let calledResponseReceived = false;
                let chunksReceived = 0;
                const chunks = ['hi!', ' how are you?'];
                const state = await TestTurnState.create(context);
                const model = TestModel.streamTextChunks(chunks);
                model.events.on('beforeCompletion', (context, memory, functions, tokenizer, template, isStreaming) => {
                    calledBeforeCompletion = true;
                });
                model.events.on('chunkReceived', (context, memory, chunk) => {
                    assert(context, 'context should not be null');
                    assert(memory, 'memory should not be null');
                    assert(chunk, 'chunk should not be null');
                    assert(chunk.delta, 'chunk.delta should not be null');
                    assert.equal(chunk.delta.role, chunksReceived == 0 ? 'assistant' : undefined, 'chunk.delta.role should be "assistant"');
                    assert.equal(chunk.delta.content, chunks[chunksReceived], 'chunk.delta.content should match');
                    chunksReceived++;
                });
                model.events.on('responseReceived', (context, memory, response) => {
                    calledResponseReceived = true;
                });
                const response = await model.completePrompt(context, state, functions, tokenizer, prompt);
                assert(calledBeforeCompletion, 'beforeCompletion should have been called');
                assert(calledResponseReceived, 'responseReceived should have been called');
                assert.equal(chunksReceived, chunks.length, 'chunksReceived should match chunks.length');
                assert(response, 'response should not be null');
                assert.equal(response.status, 'success', 'response.status should be "success"');
                assert(response.message, 'response.message should not be null');
                assert.equal(response.message.role, 'assistant', 'response.message.role should be "assistant"');
                assert.equal(response.message.content, chunks.join(''), 'response.message.content should match');
            });
        });
    });
});