/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Structure used to track the inner monologue of an LLM.
 */
export interface InnerMonologue {
    /**
     * The LLM's thoughts.
     */
    thoughts: {
        /**
         * The LLM's current thought.
         */
        thought: string;

        /**
         * The LLM's reasoning for the current thought.
         */
        reasoning: string;

        /**
         * The LLM's plan for the future.
         */
        plan: string;
    };

    /**
     * The next action to perform.
     */
    action: {
        /**
         * Name of the action to perform.
         */
        name: string;

        /**
         * Optional. Parameters for the action.
         */
        parameters?: Record<string, any>;
    };
}
