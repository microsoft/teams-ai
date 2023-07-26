/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Recognizers from '@microsoft/recognizers-text-number';
import { Choice, findChoices, FindChoicesOptions, FoundChoice } from './findChoices';
import { ModelResult } from './modelResult';

/**
 * High level function for recognizing a choice in a users utterance.
 *
 * @remarks
 * This is layered above the `findChoices()` function and adds logic to let the user specify their
 * choice by index (they can say "one" to pick `choice[0]`) or ordinal position (they can say "the
 * second one" to pick `choice[1]`.) The users utterance is recognized in the following order:
 *
 * - By name using `findChoices()`.
 * - By 1's based ordinal position.
 * - By 1's based index position.
 *
 * ```JavaScript
 * const { recognizeChoices } = require('botbuilder-choices');
 *
 * const choices = ['red', 'green', 'blue'];
 * const utterance = context.activity.text;
 * const results = recognizeChoices(utterance, choices);
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
export function recognizeChoices(
    utterance: string,
    choices: (string | Choice)[],
    options?: FindChoicesOptions
): ModelResult<FoundChoice>[] {
    function matchChoiceByIndex(match: ModelResult<any>): void {
        try {
            const index: number = parseInt(match.resolution.value, 10) - 1;
            if (index >= 0 && index < list.length) {
                const choice: Choice = list[index];
                matched.push({
                    start: match.start,
                    end: match.end,
                    typeName: 'choice',
                    text: match.text,
                    resolution: {
                        value: choice.value,
                        index: index,
                        score: 1,
                    },
                });
            }
        } catch {
            // noop
            // TODO: Should this log an error or do something?
        }
    }

    // Initialize options
    options = Object.assign(
        {
            locale: 'en-us',
            recognizeNumbers: true,
            recognizeOrdinals: true,
        } as FindChoicesOptions,
        options
    );

    // Normalize choices
    const list: Choice[] = (choices || [])
        .map((choice) => (typeof choice === 'string' ? { value: choice } : choice))
        .filter(
            (choice: Choice) => choice // TODO: does this do anything?
        );

    // Try finding choices by text search first
    // - We only want to use a single strategy for returning results to avoid issues where utterances
    //   like the "the third one" or "the red one" or "the first division book" would miss-recognize as
    //   a numerical index or ordinal as well.
    let matched: ModelResult<FoundChoice>[] = findChoices(utterance, list, options);
    if (matched.length === 0) {
        // Next try finding by ordinal
        if (options.recognizeOrdinals) {
            const ordinals: ModelResult[] = Recognizers.recognizeOrdinal(utterance, options.locale!);
            ordinals.forEach(matchChoiceByIndex);
        }

        // Finally try by numerical index
        if (matched.length === 0 && options.recognizeNumbers) {
            Recognizers.recognizeNumber(utterance, options.locale!).forEach(matchChoiceByIndex);
        }

        // Sort any found matches by their position within the utterance.
        // - The results from findChoices() are already properly sorted so we just need this
        //   for ordinal & numerical lookups.
        matched = matched.sort((a: ModelResult<FoundChoice>, b: ModelResult<FoundChoice>) => a.start - b.start);
    }

    return matched;
}
