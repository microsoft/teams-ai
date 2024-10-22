/// <reference types="mocha" />

import { strict as assert } from 'assert';
import sinon from 'sinon';
import { OpenAIModel } from './OpenAIModel';
import { EventEmitter } from 'stream';

describe('OpenAIModel', () => {
    const GPT35_MODEL = 'gpt-3.5-turbo';
    const goodEndpoint = 'https://test-endpoint.com';
    const azureADTokenProvider = async () => {
        return 'test';
    };
    it('should construct with OpenAI parameters', () => {
        const model = new OpenAIModel({
            apiKey: 'test-api-key',
            endpoint: goodEndpoint,
            defaultModel: GPT35_MODEL,
            retryPolicy: [1, 2]
        });
        assert(model instanceof OpenAIModel);
        assert(model.events instanceof EventEmitter);
        assert(!model['_useAzure']);
    });

    it('should construct with AzureOpenAI parameters (azureApiKey)', () => {
        const model = new OpenAIModel({
            azureApiKey: 'test-azure-api-key',
            azureEndpoint: goodEndpoint,
            azureDefaultDeployment: GPT35_MODEL
        });
        assert(model instanceof OpenAIModel);
        assert(model['_useAzure']);
    });

    it('should construct with AzureOpenAI parameters (azureADTokenProvider)', () => {
        const model = new OpenAIModel({
            azureADTokenProvider: azureADTokenProvider,
            azureEndpoint: goodEndpoint,
            azureDefaultDeployment: GPT35_MODEL
        });
        assert(model instanceof OpenAIModel);
        assert(model['_useAzure']);
    });

    it('should throw for AzureOpenAI when endpoint does not begin with "https://"', () => {
        const badEndpoint = 'http://test-endpoint.com';
        assert.throws(
            () => {
                new OpenAIModel({
                    azureApiKey: 'test-azure-api-key',
                    azureEndpoint: badEndpoint,
                    azureDefaultDeployment: GPT35_MODEL
                });
            },
            new Error(
                `Model created with an invalid endpoint of '${badEndpoint}'. The endpoint must be a valid HTTPS url.`
            ),
            'Unexpected error thrown from OpenAIModel constructor.'
        );
    });

    it('should trim an endpoint with trailing `/`"', () => {
        const trailingForwardSlashEndpoint = 'https://test-endpoint.com/';
        const model = new OpenAIModel({
            azureApiKey: 'test-azure-api-key',
            azureEndpoint: trailingForwardSlashEndpoint,
            azureDefaultDeployment: GPT35_MODEL
        });

        assert(model instanceof OpenAIModel);
        assert.equal(model['_client']['baseURL'], 'https://test-endpoint.com/openai');
    });

    it('should warn when requestConfig is used', () => {
        const consoleWarnSpy = sinon.spy(console, 'warn');
        const model = new OpenAIModel({
            apiKey: 'test-api-key',
            endpoint: goodEndpoint,
            defaultModel: GPT35_MODEL,
            retryPolicy: [1, 2],
            requestConfig: { timeout: 1000 }
        });
        assert(model instanceof OpenAIModel);
        assert(consoleWarnSpy.called);
        assert(
            consoleWarnSpy.calledWith(
                `OpenAIModel: The 'requestConfig' option is deprecated. Use 'clientOptions' instead.`
            )
        );
    });

    it('should handle citations in the context', async () => {
        const model = new OpenAIModel({
            apiKey: 'test-api-key',
            endpoint: 'https://test-endpoint.com',
            defaultModel: 'gpt-3.5-turbo'
        });

        const mockResponse = {
            choices: [{
                message: {
                    role: 'assistant',
                    content: 'Test response',
                    context: {
                        citations: [
                            {
                                content: 'Citation content',
                                title: 'Citation title',
                                url: 'https://citation.url'
                            }
                        ]
                    }
                }
            }]
        };

        // Mock the API call
        sinon.stub(model['_client'].chat.completions, 'create').resolves(mockResponse as any);

        // Mock necessary parameters for completePrompt method
        const context: any = {};
        const memory: any = { getValue: () => ({}) };
        const functions: any = {};
        const tokenizer: any = {};
        const template: any = {
            config: { completion: {} },
            prompt: { renderAsMessages: async () => ({ output: [] }) }
        };

        const result = await model.completePrompt(context, memory, functions, tokenizer, template);

        assert.equal(result.status, 'success');
        assert.equal(result.message?.role, 'assistant');
        assert.equal(result.message?.content, 'Test response');
        assert.deepEqual(result.message?.context?.citations, [
            {
                content: 'Citation content',
                title: 'Citation title',
                url: 'https://citation.url'
            }
        ]);
    });
});
