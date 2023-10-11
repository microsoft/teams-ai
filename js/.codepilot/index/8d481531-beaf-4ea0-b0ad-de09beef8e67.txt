import { Schema } from "jsonschema";
import { Message, PromptFunctions, PromptSection } from "../prompts";

/**
 * A validator that can be used to validate prompt responses.
 */
export interface PromptResponseValidator<TContent = any> {
    /**
     * Validates the response.
     * @param memory Memory used to render the prompt.
     * @param functions Functions used to render the prompt.
     * @param tokenizer Tokenizer used to render the prompt.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining validation attempts.
     * @returns A `Validation` with the status and value. The validation is always valid.
     */
    validateResponse(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<TContent>>;
}

/**
 * Response returned by a `PromptResponseValidator`.
 */
export interface Validation<TValue = any> {
    /**
     * Type of the validation object.
     * @remarks
     * This is used for type checking.
     */
    type: 'Validation';

    /**
     * Whether the validation is valid.
     * @remarks
     * If this is `false` the `feedback` property will be set, otherwise the `value` property
     * MAY be set.
     */
    valid: boolean;

    /**
     * Optional. Repair instructions to send to the model.
     * @remarks
     * Should be set if the validation fails.
     */
    feedback?: string;

    /**
     * Optional. Replacement value to use for the response.
     * @remarks
     * Can be set if the validation succeeds. If set, the value will replace the responses
     * `message.content` property.
     */
    value?: TValue;
}


/**
 *
 */
export interface ChatCompletionFunction {
    /**
     * Name of the function to be called.
     * @remarks
     * Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64.
     */
    name: string;

    /**
     * Optional. Description of what the function does.
     */
    description?: string;

    /**
     * Optional. Parameters the functions accepts, described as a JSON Schema object.
     * @remarks
     * See the [guide](/docs/guides/gpt/function-calling) for examples, and the
     * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation
     * about the format.
     */
    parameters: Schema;
}
