/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Outer result returned by an entity recognizer like `recognizeChoices()`.
 *
 * @remarks
 * This structure is wrapped around the recognized result and contains [start](#start) and
 * [end](#end) position information to identify the span of text in the users utterance that was
 * recognized. The actual result can be accessed through the [resolution](#resolution) property.
 * @param T The type of entity/resolution being returned.
 */
export interface ModelResult<T extends Record<string, any> = {}> {
    /**
     * Substring of the utterance that was recognized.
     */
    text: string;

    /**
     * Start character position of the recognized substring.
     */
    start: number;

    /**
     * End character position of the recognized substring.
     */
    end: number;

    /**
     * Type of entity that was recognized.
     */
    typeName: string;

    /**
     * The recognized entity.
     */
    resolution: T;
}
