/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An action call requested by the LLM model. This type is a generic meant to be the equivalent of OpenAI's [`ChatCompletionMessageToolCall`](
 */
export interface ChatCompletionActionResponse {
    /**
     * The contents of the tool message.
     */
    content: string;

    /**
     * The role of the messages author, in this case `tool`.
     */
    role: 'tool';

    /**
     * Tool call that this message is responding to.
     */
    tool_call_id: string;
}
