/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChatCompletionAction } from "../models/ChatCompletionAction";

/**
 * @private
 */
export interface CreateCompletionRequest {
    prompt?: CreateCompletionRequestPrompt | null;
    suffix?: string | null;
    max_tokens?: number | null;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stream?: boolean | null;
    logprobs?: number | null;
    echo?: boolean | null;
    stop?: CreateCompletionRequestStop | null;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    best_of?: number | null;
    logit_bias?: object | null;
    user?: string;
}

/**
 * @private
 */
export interface OpenAICreateCompletionRequest extends CreateCompletionRequest {
    model: string;
}

/**
 * @private
 */
export interface CreateCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<CreateCompletionResponseChoicesInner>;
    usage?: CreateCompletionResponseUsage;
}

/**
 * @private
 */
export interface CreateCompletionResponseChoicesInner {
    text?: string;
    index?: number;
    logprobs?: CreateCompletionResponseChoicesInnerLogprobs | null;
    finish_reason?: string;
}

/**
 * @private
 */
export interface CreateCompletionResponseChoicesInnerLogprobs {
    tokens?: Array<string>;
    token_logprobs?: Array<number>;
    top_logprobs?: Array<object>;
    text_offset?: Array<number>;
}

/**
 * @private
 */
export interface CreateCompletionResponseUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

/**
 * @private
 */
export interface CreateChatCompletionRequest {
    messages: Array<ChatCompletionRequestMessage>;
    functions?: Array<ChatCompletionAction>;
    function_call?: CreateChatCompletionRequestFunctionCall;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stream?: boolean | null;
    stop?: CreateChatCompletionRequestStop;
    max_tokens?: number;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    logit_bias?: object | null;
    user?: string;
}


/**
 * @private
 */
export declare type CreateChatCompletionRequestFunctionCall = CreateChatCompletionRequestFunctionCallOneOf | string;

/**
 * @private
 */
export interface CreateChatCompletionRequestFunctionCallOneOf {
    'name': string;
}

/**
 * @private
 */
export interface OpenAICreateChatCompletionRequest extends CreateChatCompletionRequest {
    model: string;
}

/**
 * @private
 */
export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
    function_call?: ChatCompletionRequestMessageFunctionCall;
}

/**
 * @private
 */
export interface CreateChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<CreateChatCompletionResponseChoicesInner>;
    usage?: CreateCompletionResponseUsage;
}

/**
 * @private
 */
export interface CreateChatCompletionResponseChoicesInner {
    index?: number;
    message?: ChatCompletionResponseMessage;
    finish_reason?: string;
}

/**
 * @private
 */
export interface ChatCompletionResponseMessage {
    role: 'system' | 'user' | 'assistant';
    content: string|null;
    function_call?: ChatCompletionRequestMessageFunctionCall;
}

/**
 * @private
 */
export interface ChatCompletionRequestMessageFunctionCall {
    'name'?: string;
    'arguments'?: string;
}

/**
 * @private
 */
export interface CreateModerationRequest {
    input: CreateModerationRequestInput;
    model?: string;
}

/**
 * @private
 */
export interface CreateModerationResponse {
    id: string;
    model: string;
    results: Array<CreateModerationResponseResultsInner>;
}

/**
 * @private
 */
export interface CreateModerationResponseResultsInner {
    flagged: boolean;
    categories: CreateModerationResponseResultsInnerCategories;
    category_scores: CreateModerationResponseResultsInnerCategoryScores;
}

/**
 * @private
 */
export interface CreateModerationResponseResultsInnerCategories {
    hate: boolean;
    'hate/threatening': boolean;
    'self-harm': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
}

/**
 * @private
 */
export interface CreateModerationResponseResultsInnerCategoryScores {
    hate: number;
    'hate/threatening': number;
    'self-harm': number;
    sexual: number;
    'sexual/minors': number;
    violence: number;
    'violence/graphic': number;
}

/**
 * @private
 */
export interface CreateEmbeddingRequest {
    input: CreateEmbeddingRequestInput;
    user?: string;
}

/**
 * @private
 */
export interface OpenAICreateEmbeddingRequest extends CreateEmbeddingRequest {
    model: string;
}

/**
 * @private
 */
export interface CreateEmbeddingResponse {
    object: string;
    model: string;
    data: Array<CreateEmbeddingResponseDataInner>;
    usage: CreateEmbeddingResponseUsage;
}

/**
 * @private
 */
export interface CreateEmbeddingResponseDataInner {
    index: number;
    object: string;
    embedding: Array<number>;
}

/**
 * @private
 */
export interface CreateEmbeddingResponseUsage {
    prompt_tokens: number;
    total_tokens: number;
}

/**
 * @private
 */
export type CreateCompletionRequestPrompt = Array<any> | Array<number> | Array<string> | string;

/**
 * @private
 */
export type CreateCompletionRequestStop = Array<string> | string;

/**
 * @private
 */
export type CreateChatCompletionRequestStop = Array<string> | string;

/**
 * @private
 */
export type CreateModerationRequestInput = Array<string> | string;

/**
 * @private
 */
export type CreateEmbeddingRequestInput = Array<any> | Array<number> | Array<string> | string;
