/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ModelResult } from './modelResult';
import { defaultTokenizer, Token, TokenizerFunction } from './tokenizer';

/**
 * Basic search options used to control how choices are recognized in a users utterance.
 */
export interface FindValuesOptions {
    /**
     * (Optional) if true, then only some of the tokens in a value need to exist to be considered
     * a match. The default value is "false".
     */
    allowPartialMatches?: boolean;

    /**
     * (Optional) locale/culture code of the utterance. The default is `en-US`.
     */
    locale?: string;

    /**
     * (Optional) maximum tokens allowed between two matched tokens in the utterance. So with
     * a max distance of 2 the value "second last" would match the utterance "second from the last"
     * but it wouldn't match "Wait a second. That's not the last one is it?".
     * The default value is "2".
     */
    maxTokenDistance?: number;

    /**
     * (Optional) tokenizer to use when parsing the utterance and values being recognized.
     */
    tokenizer?: TokenizerFunction;
}

/**
 * INTERNAL: Raw search result returned by `findValues()`.
 */
export interface FoundValue {
    /**
     * The value that was matched.
     */
    value: string;

    /**
     * The index of the value that was matched.
     */
    index: number;

    /**
     * The accuracy with which the value matched the specified portion of the utterance. A
     * value of 1.0 would indicate a perfect match.
     */
    score: number;
}

/**
 * INTERNAL: A value that can be sorted and still refer to its original position within a source
 * array. The `findChoices()` function expands the passed in choices to individual `SortedValue`
 * instances and passes them to `findValues()`. Each individual `Choice` can result in multiple
 * synonyms that should be searched for so this data structure lets us pass each synonym as a value
 * to search while maintaining the index of the choice that value came from.
 */
export interface SortedValue {
    // The value that will be sorted.
    value: string;

    // The values original position within its unsorted array.
    index: number;
}

/**
 * INTERNAL: Low-level function that searches for a set of values within an utterance. Higher level
 * functions like `findChoices()` and `recognizeChoices()` are layered above this function.  In most
 * cases its easier to just call one of the higher level functions instead but this function contains
 * the fuzzy search algorithm that drives choice recognition.
 *
 * @param utterance The text or user utterance to search over.
 * @param values List of values to search over.
 * @param options (Optional) options used to tweak the search that's performed.
 * @returns A list of found values.
 */
// tslint:disable-next-line:max-func-body-length
export function findValues(
    utterance: string,
    values: SortedValue[],
    options?: FindValuesOptions
): ModelResult<FoundValue>[] {
    function indexOfToken(token: Token, startPos: number): number {
        for (let i: number = startPos; i < tokens.length; i++) {
            if (tokens[i].normalized === token.normalized) {
                return i;
            }
        }

        return -1;
    }

    function findExactMatch(utterance: string, values: SortedValue[]): ModelResult<FoundValue>|undefined {
        const entry = values.find(({ value }) => value.toLowerCase() === utterance.toLowerCase());
        if (!entry) {
            return undefined;
        }
        return {
            text: utterance,
            start: 0,
            end: utterance.length - 1,
            typeName: 'value',
            resolution: {
                value: entry.value,
                index: entry.index,
                score: 1,
            },
        };
    }
    const exactMatch = findExactMatch(utterance, values);
    if (exactMatch) {
        return [exactMatch];
    }

    function matchValue(
        index: number,
        value: string,
        vTokens: Token[],
        startPos: number
    ): ModelResult<FoundValue> | undefined {
        // Match value to utterance and calculate total deviation.
        // - The tokens are matched in order so "second last" will match in
        //   "the second from last one" but not in "the last from the second one".
        // - The total deviation is a count of the number of tokens skipped in the
        //   match so for the example above the number of tokens matched would be
        //   2 and the total deviation would be 1.
        let matched = 0;
        let totalDeviation = 0;
        let start = -1;
        let end = -1;
        vTokens.forEach((token: Token) => {
            // Find the position of the token in the utterance.
            const pos: number = indexOfToken(token, startPos);
            if (pos >= 0) {
                // Calculate the distance between the current tokens position and the previous tokens distance.
                const distance: number = matched > 0 ? pos - startPos : 0;
                if (distance <= maxDistance) {
                    // Update count of tokens matched and move start pointer to search for next token after
                    // the current token.
                    matched++;
                    totalDeviation += distance;
                    startPos = pos + 1;

                    // Update start & end position that will track the span of the utterance that's matched.
                    if (start < 0) {
                        start = pos;
                    }
                    end = pos;
                }
            }
        });

        // Calculate score and format result
        // - The start & end positions and the results text field will be corrected by the caller.
        let result: ModelResult<FoundValue> | undefined;
        if (matched > 0 && (matched === vTokens.length || opt.allowPartialMatches)) {
            // Percentage of tokens matched. If matching "second last" in
            // "the second from last one" the completeness would be 1.0 since
            // all tokens were found.
            const completeness: number = matched / vTokens.length;

            // Accuracy of the match. The accuracy is reduced by additional tokens
            // occurring in the value that weren't in the utterance. So an utterance
            // of "second last" matched against a value of "second from last" would
            // result in an accuracy of 0.5.
            const accuracy: number = matched / (matched + totalDeviation);

            // The final score is simply the completeness multiplied by the accuracy.
            const score: number = completeness * accuracy;

            // Format result
            result = {
                start: start,
                end: end,
                typeName: 'value',
                resolution: {
                    value: value,
                    index: index,
                    score: score,
                },
            } as ModelResult<FoundValue>;
        }

        return result;
    }

    // Sort values in descending order by length so that the longest value is searched over first.
    const list: SortedValue[] = values.sort((a: SortedValue, b: SortedValue) => b.value.length - a.value.length);

    // Search for each value within the utterance.
    let matches: ModelResult<FoundValue>[] = [];
    const opt: FindValuesOptions = options || {};
    const tokenizer: TokenizerFunction = opt.tokenizer || defaultTokenizer;
    const tokens: Token[] = tokenizer(utterance, opt.locale);
    const maxDistance: number = opt.maxTokenDistance !== undefined ? opt.maxTokenDistance : 2;
    list.forEach((entry: SortedValue) => {
        // Find all matches for a value
        // - To match "last one" in "the last time I chose the last one" we need
        //   to re-search the string starting from the end of the previous match.
        // - The start & end position returned for the match are token positions.
        let startPos = 0;
        const vTokens: Token[] = tokenizer(entry.value.trim(), opt.locale);
        while (startPos < tokens.length) {
            const match = matchValue(entry.index, entry.value, vTokens, startPos);
            if (match) {
                startPos = match.end + 1;
                matches.push(match);
            } else {
                break;
            }
        }
    });

    // Sort matches by score descending
    matches = matches.sort(
        (a: ModelResult<FoundValue>, b: ModelResult<FoundValue>) => b.resolution.score - a.resolution.score
    );

    // Filter out duplicate matching indexes and overlapping characters.
    // - The start & end positions are token positions and need to be translated to
    //   character positions before returning. We also need to populate the "text"
    //   field as well.
    const results: ModelResult<FoundValue>[] = [];
    const foundIndexes: { [index: number]: boolean } = {};
    const usedTokens: { [index: number]: boolean } = {};
    matches.forEach((match: ModelResult<FoundValue>) => {
        // Apply filters
        let add = !Object.prototype.hasOwnProperty.call(foundIndexes, match.resolution.index);
        for (let i: number = match.start; i <= match.end; i++) {
            if (usedTokens[i]) {
                add = false;
                break;
            }
        }

        // Add to results
        if (add) {
            // Update filter info
            foundIndexes[match.resolution.index] = true;
            for (let i: number = match.start; i <= match.end; i++) {
                usedTokens[i] = true;
            }

            // Translate start & end and populate text field
            match.start = tokens[match.start].start;
            match.end = tokens[match.end].end;
            match.text = utterance.substring(match.start, match.end + 1);
            results.push(match);
        }
    });

    // Return the results sorted by position in the utterance
    return results.sort((a: ModelResult<FoundValue>, b: ModelResult<FoundValue>) => a.start - b.start);
}
