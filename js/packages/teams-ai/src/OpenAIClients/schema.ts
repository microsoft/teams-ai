/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @private
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

/**
 * @private
 */
export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
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
    content: string;
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
    model: string;
    input: CreateEmbeddingRequestInput;
    user?: string;
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
export interface ContentSafetyOptions {
    /**
     * This is assumed to be an array of category names.
     * If no categories are specified, all four categories are used.
     * Multiple categories are used to get scores in a single request.
     */
    categories?: AzureOpenAIModeratorCategory[];

    /**
     * Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~. You could attach multiple lists name here.
     */
    blocklistNames?: string[];

    /**
     * When set to true, further analyses of harmful content will not be performed in cases where blocklists are hit.
     * When set to false, all analyses of harmful content will be performed, whether or not blocklists are hit.
     * Default value is false.
     */
    breakByBlocklists?: boolean;
}

export interface CreateContentSafetyRequest extends ContentSafetyOptions {
    /**
     * The raw text to be checked. Other non-ascii characters can be included.
     * @requires text
     * @name text
     * This is the raw text to be checked. Other non-ascii characters can be included.
     */
    text: string;
}

export interface ContentSafetyHarmCategory {
    category: AzureOpenAIModeratorCategory;
    severity: ModerationSeverity;
}

export interface CreateContentSafetyResponse {
    blocklistsMatchResults: Array<string>;
    hateResult: ContentSafetyHarmCategory;
    selfHarmResult: ContentSafetyHarmCategory;
    sexualResult: ContentSafetyHarmCategory;
    violenceResult: ContentSafetyHarmCategory;
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

/**
 * @private
 */
export type AzureOpenAIModeratorCategory = 'Hate' | 'Sexual' | 'SelfHarm' | 'Violence';

/**
 * @private
 */
export enum ModerationSeverity {
    Safe = 0,
    Low = 2,
    Medium = 4,
    High = 6
}

/**
 * @private
 * Moderation API input and output types
 */
export type ModerationInput = CreateModerationRequest | CreateContentSafetyRequest;
export type ModerationResponse = CreateModerationResponse | CreateContentSafetyResponse;
