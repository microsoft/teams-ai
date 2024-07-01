/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface that adheres to OpenAI tools/function calling.
 */
export interface OpenAIFunction {
    /**
     * The function name to call.
     */
    name: string;

    /**
     * The function handler to call. It may be asynchronous, accepts any number of arguments, and must return a string.
     */
    handler: (...args: any[]) => string | Promise<string>;

    /**
     * Optional. Description of the function.
     */
    description?: string;

    /**
     * Parameters the function accepts, described as a JSON object.
     */
    parameters?: Record<string, any>;
}
