/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChatCompletionChunk } from "openai/resources";
import { PromptResponseChange, PromptResponseStream } from "./PromptCompletionModel";

export class OpenAIStream<TContent = unknown> implements PromptResponseStream<TContent> {
    private readonly _iterator: AsyncIterator<ChatCompletionChunk>;

    constructor(stream: AsyncIterable<ChatCompletionChunk>) {
        this._iterator = stream[Symbol.asyncIterator]();
    }

    public async nextChunk(): Promise<PromptResponseChange<TContent>|undefined> {
        const { done, value } = await this._iterator.next();
        if (done) {
            return undefined;
        }

        return value;

    }

    public get openAIStream(): ChatCompletionCreateParams {
        return this._openAIStream;
    }
}