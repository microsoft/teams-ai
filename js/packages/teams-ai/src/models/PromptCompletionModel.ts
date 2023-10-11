import { TurnContext } from 'botbuilder-core';
import { TurnState } from '../TurnState';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { Tokenizer } from '../tokenizers';

/**
 * An AI model that can be used to complete prompts.
 */
export interface PromptCompletionModel<TState extends TurnState = TurnState> {
    /**
     * Completes a prompt.
     * @param context Current turn context.
     * @param state Current turn state.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    completePrompt(context: TurnContext, state: TState, functions: PromptFunctions, tokenizer: Tokenizer, template: PromptTemplate): Promise<PromptResponse>;
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
     * Message returned.
     * @remarks
     * This will be a `Message<TContent>` object if the status is `success`, otherwise it will be a `string`.
     */
    message: Message<TContent>|string;
}
