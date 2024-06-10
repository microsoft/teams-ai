import assert from 'assert';
import { OpenAIClient, OpenAIClientOptions } from './OpenAIClient';
import { CreateChatCompletionRequest, CreateEmbeddingRequest, CreateModerationRequest } from './types';
import sinon, { createSandbox } from 'sinon';
import axios from 'axios';

describe('OpenAIClient', () => {
    const mockAxios = axios;
    let client: OpenAIClient;
    let clientWithAllFields: OpenAIClient;
    let sinonSandbox: sinon.SinonSandbox;
    let createStub: sinon.SinonStub;

    const options: OpenAIClientOptions = {
        apiKey: 'mock-key'
    };
    const optionsWithEmptyAPIKey: OpenAIClientOptions = {
        apiKey: ''
    };
    const optionsWithAllFields: OpenAIClientOptions = {
        apiKey: 'mock-key',
        organization: 'org',
        endpoint: 'https://api.openai.com',
        headerKey: '456'
    };
    const header = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Microsoft Teams Conversational AI SDK',
            Authorization: `Bearer ${options.apiKey}`
        }
    };
    const headerWithAllFields = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Microsoft Teams Conversational AI SDK',
            Authorization: `Bearer ${optionsWithAllFields.apiKey}`,
            'OpenAI-Organization': `${optionsWithAllFields.organization}`
        }
    };
    const chatCompletionRequest: CreateChatCompletionRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant.'
            },
            {
                role: 'user',
                content: 'Hello!'
            }
        ]
    };
    const chatCompletionResponse = {
        status: '200',
        statusText: 'OK',
        data: { object: 'chat.completion' }
    };
    const embeddingRequest: CreateEmbeddingRequest = {
        model: 'text-embedding-ada-002',
        input: 'The food was delicious and the waiter...'
    };
    const embeddingResponse = {
        status: '200',
        statusText: 'OK',
        data: { object: 'list' }
    };
    const moderationRequest: CreateModerationRequest = {
        input: 'I want to eat'
    };
    const moderationResponse = {
        status: '200',
        statusText: 'OK',
        data: {
            blocklistsMatch: [],
            categoriesAnalysis: [
                {
                    category: 'Hate',
                    severity: 0
                }
            ]
        }
    };

    beforeEach(() => {
        sinonSandbox = createSandbox();
        createStub = sinonSandbox.stub(axios, 'create').returns(mockAxios);
        client = new OpenAIClient(options);
        clientWithAllFields = new OpenAIClient(optionsWithAllFields);
    });

    afterEach(() => {
        sinonSandbox.restore();
    });

    describe('constructor', () => {
        it('should create a valid OpenAIClient with required fields', () => {
            const openAIClient = new OpenAIClient(options);

            assert.equal(createStub.called, true);
            assert.notEqual(openAIClient, undefined);
            assert.equal(openAIClient.options.apiKey, options.apiKey);
        });

        it('should throw error due to invalid api key', () => {
            assert.throws(
                () => new OpenAIClient(optionsWithEmptyAPIKey),
                new Error(`OpenAIClient initialized without an 'apiKey'.`)
            );
        });

        it('should create a valid OpenAIClient with all fields', () => {
            const openAIClient = new OpenAIClient(optionsWithAllFields);

            assert.equal(createStub.called, true);
            assert.notEqual(openAIClient, undefined);
            assert.equal(openAIClient.options.apiKey, optionsWithAllFields.apiKey);
            assert.equal(openAIClient.options.organization, optionsWithAllFields.organization);
            assert.equal(openAIClient.options.endpoint, optionsWithAllFields.endpoint);
            assert.equal(openAIClient.options.headerKey, optionsWithAllFields.headerKey);
        });
    });

    describe('createChatCompletion', () => {
        it('creates valid chat completion response with no endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(chatCompletionResponse));
            const url = `https://api.openai.com/v1/chat/completions`;
            const response = await client.createChatCompletion(chatCompletionRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, chatCompletionRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'chat.completion');
        });
        it('creates valid chat completion response with valid endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(chatCompletionResponse));
            const url = `${optionsWithAllFields.endpoint}/v1/chat/completions`;
            const response = await clientWithAllFields.createChatCompletion(chatCompletionRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, chatCompletionRequest, headerWithAllFields), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'chat.completion');
        });
    });

    describe('createEmbedding', () => {
        it('creates valid embedding response with no endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(embeddingResponse));
            const url = `https://api.openai.com/v1/embeddings`;
            const response = await client.createEmbedding(embeddingRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, embeddingRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'list');
        });

        it('creates valid embedding response with valid endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(embeddingResponse));
            const url = `${optionsWithAllFields.endpoint}/v1/embeddings`;
            const response = await clientWithAllFields.createEmbedding(embeddingRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, embeddingRequest, headerWithAllFields), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'list');
        });
    });

    describe('createModeration', () => {
        it('creates valid moderation response with no endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(moderationResponse));
            const url = `https://api.openai.com/v1/moderations`;
            const response = await client.createModeration(moderationRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, moderationRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
        });

        it('creates valid moderation response with valid endpoint', async () => {
            const postStub = sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(moderationResponse));
            const url = `${optionsWithAllFields.endpoint}/v1/moderations`;
            const response = await clientWithAllFields.createModeration(moderationRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, moderationRequest, headerWithAllFields), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
        });
    });
});
