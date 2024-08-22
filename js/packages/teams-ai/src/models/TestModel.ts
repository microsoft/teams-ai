/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptFunctions, PromptTemplate } from '../prompts';
import { PromptCompletionModel, PromptCompletionModelEmitter } from './PromptCompletionModel';
import { PromptResponse } from '../types';
import { Tokenizer } from '../tokenizers';
import { TurnContext } from 'botbuilder';
import { Memory } from '../MemoryFork';
import EventEmitter from 'events';

/**
 * A `PromptCompletionModel` used for testing.
 */
export class TestModel implements PromptCompletionModel {
    private readonly _events: PromptCompletionModelEmitter = new EventEmitter() as PromptCompletionModelEmitter;
    private readonly _handler: (
        model: TestModel,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ) => Promise<PromptResponse<string>>;

    /**
     * Creates a new `OpenAIModel` instance.
     * @param {OpenAIModelOptions} options - Options for configuring the model client.
     * @param handler
     */
    public constructor(
        handler: (
            model: TestModel,
            context: TurnContext,
            memory: Memory,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            template: PromptTemplate
        ) => Promise<PromptResponse<string>>
    ) {
        this._handler = handler;
    }

    /**
     * Events emitted by the model.
     * @returns {PromptCompletionModelEmitter} An event emitter for the model.
     */
    public get events(): PromptCompletionModelEmitter {
        return this._events;
    }

    /**
     * Completes a prompt using OpenAI or Azure OpenAI.
     * @param {TurnContext} context - Current turn context.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {PromptFunctions} functions - Functions to use when rendering the prompt.
     * @param {Tokenizer} tokenizer - Tokenizer to use when rendering the prompt.
     * @param {PromptTemplate} template - Prompt template to complete.
     * @returns {Promise<PromptResponse<string>>} A `PromptResponse` with the status and message.
     */
    public completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ): Promise<PromptResponse<string>> {
        return this._handler(this, context, memory, functions, tokenizer, template);
    }

    public static createTestModel(
        handler: (
            model: TestModel,
            context: TurnContext,
            memory: Memory,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            template: PromptTemplate
        ) => Promise<PromptResponse<string>>
    ): TestModel {
        return new TestModel(handler);
    }

    public static returnResponse(response: PromptResponse<string>, delay: number = 0): TestModel {
        return new TestModel(async (model, context, memory, functions, tokenizer, template) => {
            model.events.emit('beforeCompletion', context, memory, functions, tokenizer, template, false);
            await new Promise((resolve) => setTimeout(resolve, delay));
            model.events.emit('responseReceived', context, memory, response);
            return response;
        });
    }

    public static returnContent(content: string, delay: number = 0): TestModel {
        return TestModel.returnResponse({ status: 'success', message: { role: 'assistant', content } }, delay);
    }

    public static returnError(error: Error, delay: number = 0): TestModel {
        return TestModel.returnResponse({ status: 'error', error }, delay);
    }

    public static returnRateLimited(error: Error, delay: number = 0): TestModel {
        return TestModel.returnResponse({ status: 'rate_limited', error }, delay);
    }

    public static streamTextChunks(chunks: string[], delay: number = 0): TestModel {
        return new TestModel(async (model, context, memory, functions, tokenizer, template) => {
            model.events.emit('beforeCompletion', context, memory, functions, tokenizer, template, true);
            let content: string = '';
            for (let i = 0; i < chunks.length; i++) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                const text = chunks[i];
                content += text;
                if (i === 0) {
                    model.events.emit('chunkReceived', context, memory, {
                        delta: { role: 'assistant', content: text }
                    });
                } else {
                    model.events.emit('chunkReceived', context, memory, { delta: { content: text } });
                }
            }

            // Finalize the response.
            await new Promise((resolve) => setTimeout(resolve, delay));
            const response: PromptResponse<string> = { status: 'success', message: { role: 'assistant', content } };
            model.events.emit('responseReceived', context, memory, response);
            return response;
        });
    }
}
