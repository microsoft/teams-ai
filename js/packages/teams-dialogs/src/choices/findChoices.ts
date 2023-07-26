/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CardAction } from '@microsoft/teams-core';
import { findValues, FindValuesOptions, FoundValue, SortedValue } from './findValues';
import { ModelResult } from './modelResult';

/**
 * An instance of a choice that can be used to render a choice to a user or recognize something a
 * user picked.
 *
 * @remarks
 * The [value](#value) will be rendered to a user unless an [action](#action) is provided in which
 * case the actions `title` will be rendered to the user.
 *
 * At recognition time the `value` will always be what gets returned by `findChoices()` and
 * `recognizeChoices()`. By default, the users utterance will be compared against all of the
 * strings provided in the choice. You can disable using the `value` and/or `action.title` during
 * recognition using the `FindChoicesOptions` structure.
 *
 * ```JavaScript
 * const choice = {
 *     value: 'red',
 *     action: {
 *         type: 'imBack',
 *         title: 'The Red Pill',
 *         value: 'red pill'
 *     },
 *     synonyms: ['crimson', 'scarlet', 'ruby', 'cherry']
 * };
 * ```
 */
export interface Choice {
    /**
     * Value to return when recognized by `findChoices()`. Will also be used to render choices
     * to the user if no [action](#action) is provided.
     */
    value: string;

    /**
     * (Optional) action to use when rendering the choice as a suggested action. This **MUST**
     * be a complete action containing `type`, `title`, and `value` fields. If not specified an
     * `imBack` action will be generated based on the choices [value](#value) field.
     */
    action?: CardAction;

    /**
     * (Optional) list of synonyms to recognize in addition to the [value](#value) and
     * [action](#action) fields.
     */
    synonyms?: string[];
}

/**
 * Options to control the recognition performed by `findChoices()`.
 */
export interface FindChoicesOptions extends FindValuesOptions {
    /**
     * (Optional) If `true`, the choices `value` field will NOT be search over. Defaults to `false`.
     */
    noValue?: boolean;

    /**
     * (Optional) If `true`, the the choices `action.title` field will NOT be searched over.
     * Defaults to `false`.
     */
    noAction?: boolean;

    /**
     * (Optional) Default is `true`.  If `false`, the Number Model will not be used to check the utterance for numbers.
     */
    recognizeNumbers?: boolean;

    /**
     * (Optional) Default is `true`.  If `false`, the Ordinal Model will not be used to check the utterance for ordinal numbers.
     */
    recognizeOrdinals?: boolean;
}

/**
 * Result returned by `findChoices()`.
 */
export interface FoundChoice {
    // The value of the choice that was matched.
    value: string;

    // The choices index within the list of choices that was searched over.
    index: number;

    /**
     * The accuracy with which the synonym matched the specified portion of the utterance. A
     * value of 1.0 would indicate a perfect match.
     */
    score: number;

    // (Optional) The synonym that was matched.
    synonym?: string;
}

/**
 * Mid-level search function for recognizing a choice in an utterance.
 *
 * @remarks
 * This function is layered above `findValues()` and simply determines all of the synonyms that
 * should be searched for before calling `findValues()` to perform the actual search. The
 * `recognizeChoices()` function is layered above this function and adds the ability to select a
 * choice by index or ordinal position in the list. Calling this particular function is useful
 * when you don't want the index and ordinal position recognition done by `recognizeChoices()`.
 *
 * ```JavaScript
 * const { findChoices } = require('botbuilder-choices');
 *
 * const choices = ['red', 'green', 'blue'];
 * const utterance = context.activity.text;
 * const results = findChoices(utterance, choices);
 * if (results.length == 1) {
 *     await context.sendActivity(`I like ${results[0].resolution.value} too!`);
 * } else if (results.length > 1) {
 *     const ambiguous = results.map((r) => r.resolution.value);
 *     await context.sendActivity(ChoiceFactory.forChannel(context, ambiguous, `Which one?`));
 * } else {
 *     await context.sendActivity(ChoiceFactory.forChannel(context, choices, `I didn't get that... Which color?`));
 * }
 * ```
 * @param utterance The text or user utterance to search over. For an incoming 'message' activity you can simply use `context.activity.text`.
 * @param choices List of choices to search over.
 * @param options (Optional) options used to tweak the search that's performed.
 * @returns A list of found choices, sorted by most relevant first.
 */
export function findChoices(
    utterance: string,
    choices: (string | Choice)[],
    options?: FindChoicesOptions
): ModelResult<FoundChoice>[] {
    const opt: FindChoicesOptions = options || {};

    // Normalize choices
    const list: Choice[] = (choices || []).map((choice) =>
        typeof choice === 'string' ? { value: choice } : choice
    );

    // Build up full list of synonyms to search over.
    // - Each entry in the list contains the index of the choice it belongs to which will later be
    //   used to map the search results back to their choice.
    const synonyms: SortedValue[] = [];
    list.forEach((choice: Choice, index: number) => {
        if (!opt.noValue) {
            synonyms.push({ value: choice.value, index: index });
        }
        if (choice.action && choice.action.title && !opt.noAction) {
            synonyms.push({ value: choice.action.title, index: index });
        }
        (choice.synonyms || []).forEach((synonym: string) => synonyms.push({ value: synonym, index: index }));
    });

    // Find synonyms in utterance and map back to their choices
    return findValues(utterance, synonyms, options).map((v: ModelResult<FoundValue>) => {
        const choice: Choice = list[v.resolution.index];

        return {
            start: v.start,
            end: v.end,
            typeName: 'choice',
            text: v.text,
            resolution: {
                value: choice.value,
                index: v.resolution.index,
                score: v.resolution.score,
                synonym: v.resolution.value,
            },
        } as ModelResult<FoundChoice>;
    });
}
