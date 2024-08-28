import { strict as assert } from 'assert';
import sinon, { createSandbox } from 'sinon';
import axios from 'axios';
import { LlamaModel, LlamaModelOptions } from './LlamaModel';
import { TestAdapter } from 'botbuilder-core';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPTTokenizer } from '../tokenizers';
import { PromptTemplate, SystemMessage, UserMessage } from '../prompts';

describe('LlamaModel', () => {
    const mockAxios = axios;
    let createStub: sinon.SinonStub;
    let sinonSandbox: sinon.SinonSandbox;
    let adapter: TestAdapter;

    const mockOptions: LlamaModelOptions = {
        apiKey: 'test-api-key',
        endpoint: 'https://test-endpoint.com',
        logRequests: true
    };

    beforeEach(() => {
        sinonSandbox = createSandbox();
        createStub = sinonSandbox.stub(axios, 'create').returns(mockAxios);
    });

    afterEach(() => {
        sinonSandbox.restore();
    });

    it('should create an instance with the correct options', () => {
        // Instantiate the LlamaModel class with the mock options
        const llamaModelInstance = new LlamaModel(mockOptions);

        assert.equal(llamaModelInstance.options.apiKey, 'test-api-key');
        assert.equal(llamaModelInstance.options.endpoint, 'https://test-endpoint.com');
        assert.equal(llamaModelInstance.options.logRequests, true);
    });

    it('should make a POST request to the correct endpoint', async () => {
        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const state = await TestTurnState.create(context);
            const functions = new TestPromptManager();
            const tokenizer = new GPTTokenizer();

            const template: PromptTemplate = {
                name: 'test',
                prompt: new UserMessage('Hello'),
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

            const mockOptions: LlamaModelOptions = {
                apiKey: 'test-api-key',
                endpoint: 'https://test-endpoint.com',
                logRequests: true
            };
            const llamaModelInstance = new LlamaModel(mockOptions);
            const mockLlamaResponse = {
                status: '200',
                statusText: 'OK',
                data: {
                    output: 'Hi, how can I help you?'
                }
            };
            const expectedResponse = {
                status: 'success',
                input: { content: 'Hello', role: 'user' },
                message: {
                    role: 'assistant',
                    content: mockLlamaResponse.data.output
                }
            };

            // Stub the Axios post method to return the expected response
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(mockLlamaResponse));

            // Call a method that makes a POST request
            const response = await llamaModelInstance.completePrompt(context, state, functions, tokenizer, template);

            // Assert httpclient was created
            assert.equal(createStub.called, true);

            // Assert the response is as expected
            assert.deepEqual(response, expectedResponse);

            // Assert the POST request was made to the correct endpoint
            assert(postStub.calledOnceWith('https://test-endpoint.com'));
        });
    });

    it('should not return input if message was not from user', async () => {
        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const state = await TestTurnState.create(context);
            const functions = new TestPromptManager();
            const tokenizer = new GPTTokenizer();

            const template: PromptTemplate = {
                name: 'test',
                prompt: new SystemMessage('You are an assistant.'),
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

            const mockOptions: LlamaModelOptions = {
                apiKey: 'test-api-key',
                endpoint: 'https://test-endpoint.com',
                logRequests: true
            };
            const llamaModelInstance = new LlamaModel(mockOptions);
            const mockLlamaResponse = {
                status: '200',
                statusText: 'OK',
                data: {
                    output: 'Hi, how can I help you?'
                }
            };
            const expectedResponse = {
                status: 'success',
                input: undefined,
                message: {
                    role: 'assistant',
                    content: mockLlamaResponse.data.output
                }
            };

            // Stub the Axios post method to return the expected response
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(mockLlamaResponse));

            // Call a method that makes a POST request
            const response = await llamaModelInstance.completePrompt(context, state, functions, tokenizer, template);

            // Assert httpclient was created
            assert.equal(createStub.called, true);

            // Assert the response is as expected
            assert.deepEqual(response, expectedResponse);

            // Assert the POST request was made to the correct endpoint
            assert(postStub.calledOnceWith('https://test-endpoint.com'));
        });
    });
});
