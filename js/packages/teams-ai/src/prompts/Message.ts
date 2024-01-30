/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * A message object sent to or received from an LLM.
 * @param TContent Optional. Type of the message content. Defaults to `string`
 */
export interface Message<TContent = string> {
    /**
     * The messages role. Typically 'system', 'user', 'assistant', 'function'.
     */
    role: string;

    /**
     * Text of the message.
     */
    content: TContent | undefined;

    /**
     * Optional. A named function to call.
     */
    function_call?: FunctionCall;

    /**
     * Optional. Name of the function that was called.
     */
    name?: string;
}

/**
 * A named function to call.
 */
export interface FunctionCall {
    /**
     * Name of the function to call.
     */
    name?: string;

    /**
     * Optional. Arguments to pass to the function. Must be deserialized.
     */
    arguments?: string;
}

export type MessageContentParts = TextContentPart | ImageContentPart;

export interface TextContentPart {
    /**
     * Type of the message content. Should always be 'text'.
     */
    type: 'text';

    /**
     * The text of the message.
     */
    text: string;
}

export interface ImageContentPart {
    /**
     * Type of the message content. Should always be 'image_url'.
     */
    type: 'image_url';

    /**
     * The URL of the image.
     */
    image_url: string | { url: string };
}
