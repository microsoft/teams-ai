/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';
import StrictEventEmitter from '../external/strict-event-emitter-types';
import EventEmitter from 'events';

/**
 * Events emitted by a PromptCompletionModel.
 */
export interface PromptCompletionModelEvents {
    /**
     * Triggered before the model is called to complete a prompt.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template being completed.
     * @param streaming `true` if the prompts response is being streamed.
     */
    beforeCompletion: (context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, template: PromptTemplate, streaming: boolean) => void;

    /**
     * Triggered when a chunk is received from the model via streaming.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param chunk Message delta received from the model.
     */
    chunkReceived: (context: TurnContext, memory: Memory, chunk: PromptChunk) => void;
    
    /**
     * Triggered after the model finishes returning a response.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param response Final response returned by the model.
     */
    responseReceived: (context: TurnContext, memory: Memory, response: PromptResponse<string>) => void;
}

/**
 * Type signature for the `beforeCompletion` event of a `PromptCompletionModel`.
 */
export type PromptCompletionModelBeforeCompletionEvent = (context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, template: PromptTemplate, streaming: boolean) => void;

/**
 * Type signature for the `chunkReceived` event of a `PromptCompletionModel`.
 */
export type PromptCompletionModelChunkReceivedEvent = (context: TurnContext, memory: Memory, chunk: PromptChunk) => void;

/**
 * Type signature for the `responseReceived` event of a `PromptCompletionModel`.
 */
export type PromptCompletionModelResponseReceivedEvent = (context: TurnContext, memory: Memory, response: PromptResponse<string>) => void;

/**
 * Helper type that strongly types the the EventEmitter for a PromptCOmpletionModel instance.
 */
export type PromptCompletionModelEmitter = StrictEventEmitter<EventEmitter, PromptCompletionModelEvents>;

/**
 * An AI model that can be used to complete prompts.
 */
export interface PromptCompletionModel {
    /**
     * Optional. Events emitted by the model.
     */
    readonly events?: PromptCompletionModelEmitter;

    /**
     * Completes a prompt.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ): Promise<PromptResponse<string>>;
}

/**
 * Status of the prompt response.
 * @remarks
 * `success` - The prompt was successfully completed.
 * `error` - An error occurred while completing the prompt.
 * `rate_limited` - The request was rate limited.
 * `invalid_response` - The response was invalid.
 * `too_long` - The rendered prompt exceeded the `max_input_tokens` limit.
 */
export type PromptResponseStatus = 'success' | 'error' | 'rate_limited' | 'invalid_response' | 'too_long';

/**
 * Response returned by a `PromptCompletionClient`.
 * @template TContent Optional. Type of the content in the message. Defaults to `unknown`.
 */
export interface PromptResponse<TContent = unknown> {
    /**
     * Status of the prompt response.
     */
    status: PromptResponseStatus;

    /**
     * User input message sent to the model. `undefined` if no input was sent.
     */
    input?: Message<any>;

    /**
     * Message returned.
     * @remarks
     * This will be a `Message<TContent>` object if the status is `success`, otherwise it will be a `string`.
     */
    message?: Message<TContent>;

    /**
     * Error returned.
     */
    error?: Error;
}

/**
 * Streaming chunk passed in the `sendChunk` event of a `PromptCompletionClient`.
 */
export interface PromptChunk {
    /**
     * Delta for the response message being buffered up.
     */
    delta?: Partial<Message<string>>;
}
