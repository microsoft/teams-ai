/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Schema } from 'jsonschema';

/**
 * An action that can be called by an LLM.
 */
export interface ChatCompletionAction {
    /**
     * Name of the action to be called.
     * @remarks
     * Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64.
     */
    name: string;

    /**
     * Optional. Description of what the action does.
     */
    description?: string;

    /**
     * Optional. Parameters the action accepts, described as a JSON Schema object.
     * @remarks
     * See [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation
     * about the format.
     */
    parameters?: Schema;
}
