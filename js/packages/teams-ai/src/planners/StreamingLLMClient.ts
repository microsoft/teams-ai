/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { LLMClient, LLMClientOptions } from './LLMClient';
import { Memory } from '../MemoryFork';
import { PromptFunctions } from '../prompts';
import { PromptCompletionModel, PromptCompletionModelBeforeCompletionEvent, PromptCompletionModelChunkReceivedEvent, PromptCompletionModelResponseReceivedEvent, PromptResponse } from '../models';
import { StreamingResponse } from '../StreamingResponse';

export interface StreamingLLMClientOptions<TContent = any> extends LLMClientOptions<TContent> {
    /**
     * Optional message to send a client at the start of a streaming response.
     */
    startStreamingMessage?: string;
}

export class StreamingLLMClient<TContent = any> extends LLMClient<TContent> {
    private readonly _startStreamingMessage: string|undefined;
    private readonly _model: PromptCompletionModel;

    constructor(options: StreamingLLMClientOptions<TContent>) {
        super(options);
        this._startStreamingMessage = options.startStreamingMessage;
        this._model = options.model;
    }

    public async completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions
    ): Promise<PromptResponse<TContent>> {
        // Define event handlers
        let isStreaming = false;
        let streamer: StreamingResponse|undefined;
        const beforeCompletion: PromptCompletionModelBeforeCompletionEvent = async (ctx, memory, functions, tokenizer, template, streaming) => {
            // Ignore events for other contexts
            if (context !== ctx) {
                return;
            }

            // Check for a streaming response
            if (streaming) {
                isStreaming = true;

                // Create streamer and send initial message
                streamer = new StreamingResponse(context);
                if (this._startStreamingMessage) {
                    await streamer.sendInformativeUpdate(this._startStreamingMessage);
                }
            }
        };

        const chunkReceived: PromptCompletionModelChunkReceivedEvent = async (ctx, memory, chunk) => {
            // Ignore events for other contexts
            if (context !== ctx || !streamer) {
                return;
            }

            // Send chunk to client
            const text = chunk.delta?.content ?? '';
            if (text.length > 0) {
                await streamer.sendTextChunk(text);
            }
        };
        
        const responseReceived: PromptCompletionModelResponseReceivedEvent = async (ctx, memory, response) => {
            // Ignore events for other contexts
            if (context !== ctx || !streamer) {
                return;
            }

            // End the stream
            await streamer.endStream();
        }
    
        // Subscribe to model events
        if (this._model.events) {
            this._model.events.on('beforeCompletion', beforeCompletion);
            this._model.events.on('chunkReceived', chunkReceived);
            this._model.events.on('responseReceived', responseReceived);
        }

        try {
            // Call the base class to complete the prompt
            const response = await super.completePrompt(context, memory, functions);
            if (response.status == 'success' && isStreaming) {
                // Delete message from response to avoid sending it twice
                delete response.message;
            }

            return response;
        } finally {
            // Unsubscribe from model events
            if (this._model.events) {
                this._model.events.off('beforeCompletion', beforeCompletion);
                this._model.events.off('chunkReceived', chunkReceived);
                this._model.events.off('responseReceived', responseReceived);
            }
        }
    }
}