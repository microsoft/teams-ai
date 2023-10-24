/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { Message, PromptFunctions, PromptTemplate } from "../prompts";
import { PromptCompletionModel, PromptResponse, PromptResponseStatus } from "./PromptCompletionModel";
import { Tokenizer } from "../tokenizers";
import { Memory } from "../MemoryFork";

/**
 * A test model that can be used to test the prompt completion system.
 */
export class TestModel implements PromptCompletionModel {
    /**
     *
     * @param status Optional. Status of the prompt response. Defaults to `success`.
     * @param response Optional. Response to the prompt. Defaults to `{ role: 'assistant', content: 'Hello World' }`.
     * @param error Optional. Error to return. Defaults to `undefined`.
     */
    public constructor(status: PromptResponseStatus = 'success', response: Message = { role: 'assistant', content: "Hello World" }, error?: Error) {
        this.status = status;
        this.response = response;
        this.error = error;
    }

    /**
     * Status of the prompt response.
     */
    public status: PromptResponseStatus;

    /**
     * Response to the prompt.
     */
    public response: Message<string>;

    /**
     * Error to return.
     */
    public error?: Error;


    /**
     * Completes a prompt.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    public async completePrompt(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, template: PromptTemplate): Promise<PromptResponse<string>> {
        if (this.error) {
            return { status: this.status, error: this.error };
        } else {
            return { status: this.status, message: this.response };
        }
    }
}