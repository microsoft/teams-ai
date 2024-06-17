/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { EmbeddingsModel, EmbeddingsResponse } from './EmbeddingsModel';
import { CreateEmbeddingRequest, CreateEmbeddingResponse, OpenAICreateEmbeddingRequest, Colorize } from '../internals';

/**
 * Base model options common to both OpenAI and Azure OpenAI services.
 */
export interface BaseOpenAIEmbeddingsOptions {
    /**
     * Optional. Number of dimensions to use when generating embeddings.
     * @remarks
     * Only valid for embedding models that support dynamic dimensionality.
     */
    dimensions?: number;

    /**
     * Optional. Whether to log requests to the console.
     * @remarks
     * This is useful for debugging prompts and defaults to `false`.
     */
    logRequests?: boolean;

    /**
     * Optional. Retry policy to use when calling the OpenAI API.
     * @remarks
     * The default retry policy is `[2000, 5000]` which means that the first retry will be after
     * 2 seconds and the second retry will be after 5 seconds.
     */
    retryPolicy?: number[];

    /**
     * Optional. Request options to use when calling the OpenAI API.
     */
    requestConfig?: AxiosRequestConfig;
}

/**
 * Options for configuring an `OpenAIEmbeddings` to generate embeddings using an OpenAI hosted model.
 */
export interface OpenAIEmbeddingsOptions extends BaseOpenAIEmbeddingsOptions {
    /**
     * API key to use when calling the OpenAI API.
     * @remarks
     * A new API key can be created at https://platform.openai.com/account/api-keys.
     */
    apiKey: string;

    /**
     * Embeddings Model to use.
     */
    model: string;

    /**
     * Optional. Organization to use when calling the OpenAI API.
     */
    organization?: string;

    /**
     * Optional. Endpoint to use when calling the OpenAI API.
     * @remarks
     * For Azure OpenAI this is the deployment endpoint.
     */
    endpoint?: string;
}

/**
 * Options for configuring an embeddings object that calls an `OpenAI` compliant endpoint.
 * @remarks
 * The endpoint should comply with the OpenAPI spec for OpenAI's API:
 * https://github.com/openai/openai-openapi
 * And an example of a compliant endpoint is LLaMA.cpp's reference server:
 * https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md
 */
export interface OpenAILikeEmbeddingsOptions extends BaseOpenAIEmbeddingsOptions {
    /**
     * Endpoint of the embeddings server to call.
     */
    endpoint: string;

    /**
     * Embeddings Model to use.
     */
    model: string;

    /**
     * Optional. API key to use when calling the embeddings server.
     */
    apiKey?: string;
}

/**
 * Options for configuring an `OpenAIEmbeddings` to generate embeddings using an Azure OpenAI hosted model.
 */
export interface AzureOpenAIEmbeddingsOptions extends BaseOpenAIEmbeddingsOptions {
    /**
     * API key to use when making requests to Azure OpenAI.
     */
    azureApiKey: string;

    /**
     * Deployment endpoint to use.
     */
    azureEndpoint: string;

    /**
     * Name of the Azure OpenAI deployment (model) to use.
     */
    azureDeployment: string;

    /**
     * Optional. Version of the API being called. Defaults to `2023-05-15`.
     */
    azureApiVersion?: string;
}

/**
 * A `EmbeddingsModel` for calling OpenAI and Azure OpenAI hosted models.
 */
export class OpenAIEmbeddings implements EmbeddingsModel {
    private readonly _httpClient: AxiosInstance;
    private readonly _useAzure: boolean;

    private readonly UserAgent = '@microsoft/teams-ai-v1';

    /**
     * Options the client was configured with.
     */
    public readonly options: OpenAIEmbeddingsOptions | AzureOpenAIEmbeddingsOptions | OpenAILikeEmbeddingsOptions;

    /**
     * Creates a new `OpenAIEmbeddings` instance.
     * @param {OpenAIEmbeddingsOptions | AzureOpenAIEmbeddingsOptions | OpenAILikeEmbeddingsOptions} options Options for configuring the embeddings client.
     */
    public constructor(options: OpenAIEmbeddingsOptions | AzureOpenAIEmbeddingsOptions) {
        // Check for azure config
        if ((options as AzureOpenAIEmbeddingsOptions).azureApiKey) {
            this._useAzure = true;
            this.options = Object.assign(
                {
                    retryPolicy: [2000, 5000],
                    azureApiVersion: '2023-05-15'
                },
                options
            ) as AzureOpenAIEmbeddingsOptions;

            // Cleanup and validate endpoint
            let endpoint = this.options.azureEndpoint.trim();
            if (endpoint.endsWith('/')) {
                endpoint = endpoint.substring(0, endpoint.length - 1);
            }

            this.options.azureEndpoint = endpoint;
        } else {
            this._useAzure = false;
            this.options = Object.assign(
                {
                    retryPolicy: [2000, 5000]
                },
                options
            ) as OpenAIEmbeddingsOptions;
        }

        // Create client
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429
        });
    }

    /**
     * Creates embeddings for the given inputs using the OpenAI API.
     * @param {string} model Name of the model to use (or deployment for Azure).
     * @param {string | string[]} inputs Text inputs to create embeddings for.
     * @returns {Promise<EmbeddingsResponse>} A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    public async createEmbeddings(model: string, inputs: string | string[]): Promise<EmbeddingsResponse> {
        if (this.options.logRequests) {
            console.log(Colorize.title('EMBEDDINGS REQUEST:'));
            console.log(Colorize.output(inputs));
        }

        const request: CreateEmbeddingRequest = {
            model: model,
            input: inputs
        };
        if (this.options.dimensions) {
            request.dimensions = this.options.dimensions;
        }

        const startTime = Date.now();
        const response = await this.createEmbeddingRequest(request);
        if (this.options.logRequests) {
            console.log(Colorize.title('RESPONSE:'));
            console.log(Colorize.value('status', response.status));
            console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
            console.log(Colorize.output(response.data));
        }

        // Process response
        if (response.status < 300) {
            return {
                status: 'success',
                output: response.data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding)
            };
        } else if (response.status == 429) {
            return { status: 'rate_limited', message: `The embeddings API returned a rate limit error.` };
        } else {
            return {
                status: 'error',
                message: `The embeddings API returned an error status of ${response.status}: ${response.statusText}`
            };
        }
    }

    /**
     * @private
     * @param {CreateEmbeddingRequest} request The request to send to the OpenAI API.
     * @returns {Promise<AxiosResponse<CreateEmbeddingResponse>>} A promise that resolves to the response from the OpenAI API.
     */
    protected createEmbeddingRequest(request: CreateEmbeddingRequest): Promise<AxiosResponse<CreateEmbeddingResponse>> {
        if (this._useAzure) {
            const options = this.options as AzureOpenAIEmbeddingsOptions;
            const url = `${options.azureEndpoint}/openai/deployments/${
                options.azureDeployment
            }/embeddings?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIEmbeddingsOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/embeddings`;
            (request as OpenAICreateEmbeddingRequest).model = options.model;
            return this.post(url, request);
        }
    }

    /**
     * @private
     * @template TData Optional. Type of the data associated with the action.
     * @param {string} url The URL to send the request to.
     * @param {object} body The body of the request.
     * @param {number} retryCount The number of times the request has been retried.
     * @returns {Promise<AxiosResponse<TData>>} A promise that resolves to the response from the OpenAI API.
     */
    protected async post<TData>(url: string, body: object, retryCount = 0): Promise<AxiosResponse<TData>> {
        // Initialize request config
        const requestConfig: AxiosRequestConfig = Object.assign({}, this.options.requestConfig);

        // Initialize request headers
        if (!requestConfig.headers) {
            requestConfig.headers = {};
        }
        if (!requestConfig.headers['Content-Type']) {
            requestConfig.headers['Content-Type'] = 'application/json';
        }
        if (!requestConfig.headers['User-Agent']) {
            requestConfig.headers['User-Agent'] = this.UserAgent;
        }
        if (this._useAzure) {
            const options = this.options as AzureOpenAIEmbeddingsOptions;
            requestConfig.headers['api-key'] = options.azureApiKey;
        } else if ((this.options as OpenAIEmbeddingsOptions).apiKey) {
            const options = this.options as OpenAIEmbeddingsOptions;
            requestConfig.headers['Authorization'] = `Bearer ${options.apiKey}`;
            if (options.organization) {
                requestConfig.headers['OpenAI-Organization'] = options.organization;
            }
        }

        // Send request
        const response = await this._httpClient.post(url, body, requestConfig);

        // Check for rate limit error
        if (
            response.status == 429 &&
            Array.isArray(this.options.retryPolicy) &&
            retryCount < this.options.retryPolicy.length
        ) {
            const delay = this.options.retryPolicy[retryCount];
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.post(url, body, retryCount + 1);
        } else {
            return response;
        }
    }
}
