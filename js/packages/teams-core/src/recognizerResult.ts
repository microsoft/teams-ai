/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IntentScore } from './intentScore';

/**
 * Value returned from a recognizer.
 */
export interface RecognizerResult {
    /**
     * Utterance sent to recognizer
     */
    text: string;

    /**
     * If original text is changed by things like spelling, the altered version.
     */
    alteredText?: string;

    /**
     * Intents recognized for the utterance.
     *
     * @remarks
     * A map of intent names to an object with score is returned.
     */
    intents: Record<string, IntentScore>;

    /**
     * (Optional) entities recognized.
     */
    entities?: any;

    /**
     * (Optional) other properties
     */
    [propName: string]: any;
}

export const getTopScoringIntent = (result: RecognizerResult): { intent: string; score: number } => {
    if (!result || !result.intents) {
        throw new Error('result is empty');
    }

    let topIntent = '';
    let topScore = -1;
    for (const [intentName, intent] of Object.entries(result.intents)) {
        const score = intent.score ?? -1;
        if (!topIntent || score > topScore) {
            topIntent = intentName;
            topScore = score;
        }
    }

    return {
        intent: topIntent,
        score: topScore,
    };
};
