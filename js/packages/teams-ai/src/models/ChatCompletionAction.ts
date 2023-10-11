import { Schema } from "jsonschema";

/**
 * A function that can be called from the chat.
 */
export interface ChatCompletionAction {
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
    parameters?: Schema;
}
