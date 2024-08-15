import { strict as assert } from 'assert';
import { OpenAIModel } from './OpenAIModel';
import { EventEmitter } from 'stream';

describe('OpenAIModel', () => {
    const GPT35_MODEL = 'gpt-3.5-turbo';
    const goodEndpoint = 'https://test-endpoint.com';
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

    it('should construct with AzureOpenAI parameters', () => {
        const model = new OpenAIModel({
            azureApiKey: 'test-azure-api-key',
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
});
