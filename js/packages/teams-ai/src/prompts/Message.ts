/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface Message<TContent = string> {
    /**
     * The messages role. Typically 'system', 'user', 'assistant', 'function'.
     */
    role: string;

    /**
     * Text of the message.
     */
    content: TContent|null;

    /**
     * Optional. A named function to call.
     */
    function_call?: FunctionCall;

    /**
     * Optional. Name of the function that was called.
     */
    name?: string;
}

export interface FunctionCall {
    name?: string;
    arguments?: string;
}
