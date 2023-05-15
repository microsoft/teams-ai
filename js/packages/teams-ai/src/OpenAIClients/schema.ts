/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface CreateCompletionRequest {
    model: string;
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

export interface CreateCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<CreateCompletionResponseChoicesInner>;
    usage?: CreateCompletionResponseUsage;
}

export interface CreateCompletionResponseChoicesInner {
    text?: string;
    index?: number;
    logprobs?: CreateCompletionResponseChoicesInnerLogprobs | null;
    finish_reason?: string;
}

export interface CreateCompletionResponseChoicesInnerLogprobs {
    tokens?: Array<string>;
    token_logprobs?: Array<number>;
    top_logprobs?: Array<object>;
    text_offset?: Array<number>;
}

export interface CreateCompletionResponseUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface CreateChatCompletionRequest {
    model: string;
    messages: Array<ChatCompletionRequestMessage>;
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

export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

export interface CreateChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<CreateChatCompletionResponseChoicesInner>;
    usage?: CreateCompletionResponseUsage;
}

export interface CreateChatCompletionResponseChoicesInner {
    index?: number;
    message?: ChatCompletionResponseMessage;
    finish_reason?: string;
}

export interface ChatCompletionResponseMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CreateModerationRequest {
    input: CreateModerationRequestInput;
    model?: string;
}

export interface CreateModerationResponse {
    id: string;
    model: string;
    results: Array<CreateModerationResponseResultsInner>;
}

export interface CreateModerationResponseResultsInner {
    flagged: boolean;
    categories: CreateModerationResponseResultsInnerCategories;
    category_scores: CreateModerationResponseResultsInnerCategoryScores;
}

export interface CreateModerationResponseResultsInnerCategories {
    hate: boolean;
    'hate/threatening': boolean;
    'self-harm': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
}

export interface CreateModerationResponseResultsInnerCategoryScores {
    hate: number;
    'hate/threatening': number;
    'self-harm': number;
    sexual: number;
    'sexual/minors': number;
    violence: number;
    'violence/graphic': number;
}

export interface CreateEmbeddingRequest {
    model: string;
    input: CreateEmbeddingRequestInput;
    user?: string;
}

export interface CreateEmbeddingResponse {
    object: string;
    model: string;
    data: Array<CreateEmbeddingResponseDataInner>;
    usage: CreateEmbeddingResponseUsage;
}

export interface CreateEmbeddingResponseDataInner {
    index: number;
    object: string;
    embedding: Array<number>;
}

export interface CreateEmbeddingResponseUsage {
    prompt_tokens: number;
    total_tokens: number;
}

export type CreateCompletionRequestPrompt = Array<any> | Array<number> | Array<string> | string;
export type CreateCompletionRequestStop = Array<string> | string;
export type CreateChatCompletionRequestStop = Array<string> | string;
export type CreateModerationRequestInput = Array<string> | string;
export type CreateEmbeddingRequestInput = Array<any> | Array<number> | Array<string> | string;
