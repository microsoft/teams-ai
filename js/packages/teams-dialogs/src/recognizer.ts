/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    Activity,
    BotTelemetryClient,
    BotTelemetryClientKey,
    getTopScoringIntent,
    NullTelemetryClient,
    RecognizerResult,
} from '@microsoft/teams-core';

import { DialogContext } from './dialogContext';
import { DialogTurnStateConstants } from './dialogTurnStateConstants';
import omit = require('lodash/omit');

/**
 * Recognizer base class.
 */
export class Recognizer {
    /**
     * Recognizers unique ID.
     */
    id?: string;

    /**
     * The telemetry client for logging events.
     * Default this to the NullTelemetryClient, which does nothing.
     */
    telemetryClient: BotTelemetryClient = new NullTelemetryClient();

    /**
     * To recognize intents and entities in a users utterance.
     *
     * @param {DialogContext} _dialogContext Dialog Context.
     * @param {Partial<Activity>} _activity Activity.
     * @param {Record<string, string>} _telemetryProperties Additional properties to be logged to telemetry with event.
     * @param {Record<string, number>} _telemetryMetrics Additional metrics to be logged to telemetry with event.
     */
    recognize(
        _dialogContext: DialogContext,
        _activity: Partial<Activity>,
        _telemetryProperties?: Record<string, string>,
        _telemetryMetrics?: Record<string, number>
    ): Promise<RecognizerResult> {
        throw new Error('Please implement recognize function.');
    }

    /**
     * Creates choose intent result in the case that there are conflicting or ambiguous signals from the recognizers.
     *
     * @param {Record<string, RecognizerResult>} recognizerResults A group of recognizer results.
     * @returns {RecognizerResult} Recognizer result which is ChooseIntent.
     */
    protected createChooseIntentResult(recognizerResults: Record<string, RecognizerResult>): RecognizerResult {
        let text: string = '';
        let sentiment: Record<string, any> = {};
        type candidateType = { id: string; intent: string; score: number; result: RecognizerResult };
        const candidates = Object.entries(recognizerResults).reduce((candidates: candidateType[], [key, result]) => {
            text = result.text;
            sentiment = result.sentiment;
            const { intent, score } = getTopScoringIntent(result);
            if (intent !== 'None') {
                candidates.push({
                    id: key,
                    intent,
                    score,
                    result,
                });
            }
            return candidates;
        }, []);

        if (candidates.length) {
            // return `ChooseIntent` with candidates array.
            const recognizerResult: RecognizerResult = {
                text,
                intents: { ChooseIntent: { score: 1.0 } },
                candidates,
                entities: {},
            };
            return recognizerResult;
        }

        // just return a `None` intent.
        const recognizerResult: RecognizerResult = {
            text,
            intents: { None: { score: 1.0 } },
            entities: {},
            sentiment: sentiment,
        };
        return recognizerResult;
    }

    /**
     * Uses the RecognizerResult to create a list of properties to be included when tracking the result in telemetry.
     *
     * @param {RecognizerResult} recognizerResult Recognizer Result.
     * @param {Record<string, string>} telemetryProperties A list of properties to append or override the properties created using the RecognizerResult.
     * @param {DialogContext} _dialogContext Dialog Context.
     * @returns {Record<string, string>} A collection of properties that can be included when calling the TrackEvent method on the TelemetryClient.
     */
    protected fillRecognizerResultTelemetryProperties(
        recognizerResult: RecognizerResult,
        telemetryProperties: Record<string, string>,
        _dialogContext?: DialogContext
    ): Record<string, string|undefined> {
        const { intent, score } = getTopScoringIntent(recognizerResult);
        const intents = Object.entries(recognizerResult.intents);

        const properties: Record<string, string|undefined> = {
            Text: recognizerResult.text,
            AlteredText: recognizerResult.alteredText,
            TopIntent: intents.length > 0 ? intent : undefined,
            TopIntentScore: intents.length > 0 ? score.toString() : undefined,
            Intents: intents.length > 0 ? JSON.stringify(recognizerResult.intents) : undefined,
            Entities: recognizerResult.entities ? JSON.stringify(recognizerResult.entities) : undefined,
            AdditionalProperties: JSON.stringify(
                omit(recognizerResult, ['text', 'alteredText', 'intents', 'entities'])
            ),
        };

        // Additional Properties can override "stock" properties.
        if (telemetryProperties) {
            return Object.assign({}, properties, telemetryProperties);
        }

        return properties;
    }

    protected stringifyAdditionalPropertiesOfRecognizerResult(recognizerResult: RecognizerResult): string|undefined {
        const generalProperties = new Set(['text', 'alteredText', 'intents', 'entities']);
        const additionalProperties: { [key: string]: string } = {};
        for (const key in recognizerResult) {
            if (!generalProperties.has(key)) {
                additionalProperties[key] = recognizerResult[key];
            }
        }
        return Object.keys(additionalProperties).length > 0 ? JSON.stringify(additionalProperties) : undefined;
    }

    /**
     * Tracks an event with the event name provided using the TelemetryClient attaching the properties/metrics.
     *
     * @param {DialogContext} dialogContext Dialog context.
     * @param {string} eventName The name of the event to track.
     * @param {Record<string, string>} telemetryProperties The properties to be included as part of the event tracking.
     * @param {Record<string, number>} telemetryMetrics The metrics to be included as part of the event tracking.
     */
    protected trackRecognizerResult(
        dialogContext: DialogContext,
        eventName: string,
        telemetryProperties?: Record<string, string>,
        telemetryMetrics?: Record<string, number>
    ): void {
        if (this.telemetryClient instanceof NullTelemetryClient) {
            const turnStateTelemetryClient =
                dialogContext.context.turnState.get<BotTelemetryClient>(DialogTurnStateConstants.telemetryClient) ??
                dialogContext.context.turnState.get<BotTelemetryClient>(BotTelemetryClientKey);
            this.telemetryClient = turnStateTelemetryClient ?? this.telemetryClient;
        }

        this.telemetryClient.trackEvent({
            name: eventName,
            properties: telemetryProperties,
            metrics: telemetryMetrics,
        });
    }
}
