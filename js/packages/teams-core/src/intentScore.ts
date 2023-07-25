/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Score plus any extra information about an intent.
 */
export interface IntentScore {
    /**
     * Gets or sets confidence in an intent.
     */
    score?: number;

    /**
     * Gets or sets any extra properties to include in the results.
     */
    [key: string]: unknown;
}
