import { Message } from '../prompts';

/**
 * Status of the prompt response.
 * @remarks
 * `success` - The prompt was successfully completed.
 * `error` - An error occurred while completing the prompt.
 * `rate_limited` - The request was rate limited.
 * `invalid_response` - The response was invalid.
 * `too_long` - The rendered prompt exceeded the `max_input_tokens` limit.
 */

export type PromptResponseStatus =
    | 'success'
    | 'error'
    | 'rate_limited'
    | 'invalid_response'
    | 'too_long'
    | 'tools_error';

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
