/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChatCompletionAction } from '../models/ChatCompletionAction';

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
    model: string;
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
    logprobs?: boolean | false;
    top_logprobs?: number | null;
    response_format?: object | null;
    seed?: number | null;
    tools?: Array<CreateChatCompletionTool>;
    tool_choice?: CreateChatCompletionRequestFunctionCall;
}

/**
 * @private
 */
export declare type CreateChatCompletionRequestFunctionCall = CreateChatCompletionRequestFunctionCallOneOf | string;

/**
 * @private
 */
export interface CreateChatCompletionTool
{
    type: 'function';
    function: ChatCompletionAction;
}

/**
 * @private
 */
export interface CreateChatCompletionRequestFunctionCallOneOf {
    name: string;
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
export interface ChatCompletionRequestMessageToolCall
{
    id: string;
    type: 'function';
    function: ChatCompletionRequestMessageFunctionCall;
}

/**
 * @private
 */
export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_calls?: Array<ChatCompletionRequestMessageToolCall>
    tool_call_id?: string;
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
    usage: CreateCompletionResponseUsage;
    system_fingerprint: string;
}

/**
 * @private
 */
export interface CreateChatCompletionResponseChoicesInner {
    index?: number;
    message?: ChatCompletionResponseMessage;
    finish_reason?: string;
    logprobs?: object | null;
}

/**
 * @private
 */
export interface ChatCompletionResponseMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | undefined;
    tool_calls?: Array<ChatCompletionRequestMessageToolCall>
}

/**
 * @private
 */
export interface ChatCompletionRequestMessageFunctionCall {
    name?: string;
    arguments?: string;
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
    model: string;
    encoding_format?: string;
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
export type ChatCompletionRequestToolChoice = object | string;

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
 * The moderation severity level.
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
