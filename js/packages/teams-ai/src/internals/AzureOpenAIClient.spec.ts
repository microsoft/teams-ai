import assert from 'assert';
import { AzureOpenAIClient, AzureOpenAIClientOptions } from './AzureOpenAIClient';
import { CreateChatCompletionRequest, CreateEmbeddingRequest, ModerationInput } from './types';
import sinon, { SinonStub } from 'sinon';
import axios from 'axios';

describe('AzureOpenAIClient', () => {
    const mockAxios = axios;
    let client: AzureOpenAIClient;
    let clientWithApiVersion: AzureOpenAIClient;
    let cognitiveServiceClient: AzureOpenAIClient;
    let createStub: SinonStub;

    const options: AzureOpenAIClientOptions = {
        apiKey: 'mock-key',
        endpoint: 'https://mock.openai.azure.com/'
    };
    const optionsWithApiVersion: AzureOpenAIClientOptions = {
        apiKey: 'mock-key',
        endpoint: 'https://mock.openai.azure.com/',
        apiVersion: '2023-03-15-preview'
    };
    const optionsMissingEndpoint: AzureOpenAIClientOptions = {
        apiKey: 'mock-key',
        endpoint: ''
    };
    const cognitiveServiceOptions: AzureOpenAIClientOptions = {
        apiKey: 'mock-key',
        endpoint: 'https://mock-content-safety.cognitiveservices.azure.com/',
        apiVersion: '2023-10-01',
        ocpApimSubscriptionKey: 'mock-key-2'
    };
    const header = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Microsoft Teams Conversational AI SDK',
            'api-key': `${options.apiKey}`
        }
    };
    const cognitiveServiceHeader = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Microsoft Teams Conversational AI SDK',
            'api-key': `${cognitiveServiceOptions.apiKey}`,
            'Ocp-Apim-Subscription-Key': `${cognitiveServiceOptions.ocpApimSubscriptionKey}`
        }
    };
    const chatCompletionRequest: CreateChatCompletionRequest = {
        model: 'gpt-35-turbo',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant.'
            },
            {
                role: 'user',
                content: 'Does Azure OpenAI support customer managed keys?'
            },
            {
                role: 'assistant',
                content: 'Yes, customer managed keys are supported by Azure OpenAI.'
            },
            {
                role: 'user',
                content: 'Do other Azure AI services support this too?'
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
    const moderationRequest: ModerationInput = {
        text: 'I want to eat'
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
        createStub = sinon.stub(axios, 'create').returns(mockAxios);
        client = new AzureOpenAIClient(options);
        clientWithApiVersion = new AzureOpenAIClient(optionsWithApiVersion);
        cognitiveServiceClient = new AzureOpenAIClient(cognitiveServiceOptions);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('constructor', () => {
        it('should create a valid OpenAIClient with all required fields', () => {
            const azureOpenAIClient = new AzureOpenAIClient(options);

            assert.equal(createStub.called, true);
            assert.notEqual(azureOpenAIClient, undefined);
            assert.equal(azureOpenAIClient.options.apiKey, options.apiKey);
        });

        it('should throw error due to invalid endpoint', () => {
            assert.throws(
                () => new AzureOpenAIClient(optionsMissingEndpoint),
                new Error(`AzureOpenAIClient initialized without an 'endpoint'.`)
            );
        });

        it('should create a valid OpenAIClient with added apiVersion field', () => {
            const azureOpenAIClient = new AzureOpenAIClient(optionsWithApiVersion);

            assert.equal(createStub.called, true);
            assert.notEqual(azureOpenAIClient, undefined);
            assert.equal(azureOpenAIClient.options.apiKey, optionsWithApiVersion.apiKey);
            assert.equal(azureOpenAIClient.options.endpoint, optionsWithApiVersion.endpoint);
            assert.equal(azureOpenAIClient.options.apiVersion, optionsWithApiVersion.apiVersion);
        });
    });

    describe('createChatCompletion', () => {
        it('creates valid chat completion response', async () => {
            const postStub = sinon.stub(mockAxios, 'post').returns(Promise.resolve(chatCompletionResponse));
            const url = `${options.endpoint}/openai/deployments/${chatCompletionRequest.model}/chat/completions?api-version=2023-03-15-preview`;
            const response = await client.createChatCompletion(chatCompletionRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, chatCompletionRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'chat.completion');
        });

        it('creates valid chat completion response, with api version specified', async () => {
            const postStub = sinon.stub(mockAxios, 'post').returns(Promise.resolve(chatCompletionResponse));
            const url = `${optionsWithApiVersion.endpoint}/openai/deployments/${chatCompletionRequest.model}/chat/completions?api-version=${optionsWithApiVersion.apiVersion}`;
            const response = await clientWithApiVersion.createChatCompletion(chatCompletionRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, chatCompletionRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'chat.completion');
        });
    });

    describe('createEmbedding', () => {
        it('creates valid embedding response', async () => {
            const postStub = sinon.stub(mockAxios, 'post').returns(Promise.resolve(embeddingResponse));
            const url = `${options.endpoint}/openai/deployments/${embeddingRequest.model}/embeddings?api-version=2022-12-01`;
            const response = await client.createEmbedding(embeddingRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, embeddingRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'list');
        });

        it('creates valid embedding response with api version specified', async () => {
            const postStub = sinon.stub(mockAxios, 'post').returns(Promise.resolve(embeddingResponse));
            const url = `${optionsWithApiVersion.endpoint}/openai/deployments/${embeddingRequest.model}/embeddings?api-version=${optionsWithApiVersion.apiVersion}`;
            const response = await clientWithApiVersion.createEmbedding(embeddingRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, embeddingRequest, header), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
            assert.equal(response.data?.object, 'list');
        });
    });

    describe('createModeration', () => {
        it('creates valid moderation response', async () => {
            const postStub = sinon.stub(mockAxios, 'post').returns(Promise.resolve(moderationResponse));
            const url = `${cognitiveServiceOptions.endpoint}/contentsafety/text:analyze?api-version=${cognitiveServiceOptions.apiVersion}`;
            const response = await cognitiveServiceClient.createModeration(moderationRequest);

            assert.equal(postStub.calledOnce, true);
            assert.equal(postStub.calledOnceWith(url, moderationRequest, cognitiveServiceHeader), true);
            assert.equal(response.status, 200);
            assert.equal(response.statusText, 'OK');
            assert.notEqual(response.data, undefined);
        });
    });
});
