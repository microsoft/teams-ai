import { Message, PromptFunctions, PromptMemory, PromptSection, Tokenizer } from "promptrix";
import { PromptCompletionModel, PromptResponse, PromptResponseStatus } from "./ai/types";

/**
 * A test model that can be used to test the prompt completion system.
 */
export class TestModel implements PromptCompletionModel {
    /**
     *
     * @param status Optional. Status of the prompt response. Defaults to `success`.
     * @param response Optional. Response to the prompt. Defaults to `{ role: 'assistant', content: 'Hello World' }`.
     */
    public constructor(status: PromptResponseStatus = 'success', response: string|Message = { role: 'assistant', content: "Hello World" }) {
        this.status = status;
        this.response = response;
    }

    /**
     * Status of the prompt response.
     */
    public status: PromptResponseStatus;

    /**
     * Response to the prompt.
     */
    public response: string|Message<any>;


    /**
     * Returns the response to the prompt.
     * @param memory Memory to use when rendering the prompt.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param prompt Prompt to complete.
     * @param prompt_options Options for completing the prompt.
     * @returns A `PromptResponse` with the status and message.
     */
    public async completePrompt(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, prompt: PromptSection): Promise<PromptResponse> {
        return { status: this.status, message: this.response };
    }
}