/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as Globalize from 'globalize';
import * as Recognizers from '@microsoft/recognizers-text-number';
import * as locales from '../i18n';
import { InputHints, TurnContext } from '@microsoft/teams-core';
import { Prompt, PromptOptions, PromptRecognizerResult, PromptValidator } from './prompt';

// Load all registered locales into Globalize library
Object.values(locales).forEach((locale) => Globalize.load(locale));

/**
 * Prompts a user to enter a number.
 *
 * @remarks
 * By default the prompt will return to the calling dialog a `number` representing the users input.
 */
export class NumberPrompt extends Prompt<number> {
    /**
     * The prompts default locale that should be recognized.
     */
    defaultLocale?: string;

    /**
     * Creates a new NumberPrompt instance.
     *
     * @param dialogId Unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt.
     * @param defaultLocale (Optional) locale to use if `TurnContext.activity.locale` is not specified. Defaults to a value of `en-us`.
     */
    constructor(dialogId: string, validator?: PromptValidator<number>, defaultLocale?: string) {
        super(dialogId, validator);
        this.defaultLocale = defaultLocale;
    }

    /**
     * Prompts the user for input.
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext), context for the current
     * turn of conversation with the user.
     * @param state Contains state for the current instance of the prompt on the dialog stack.
     * @param options A [PromptOptions](xref:botbuilder-dialogs.PromptOptions) object constructed
     * from the options initially provided in the call to Prompt.
     * @param isRetry `true` if this is the first time this prompt dialog instance
     * on the stack is prompting the user for input; otherwise, false.
     * @returns A `Promise` representing the asynchronous operation.
     */
    protected async onPrompt(
        context: TurnContext,
        state: unknown,
        options: PromptOptions,
        isRetry: boolean
    ): Promise<void> {
        if (isRetry && options.retryPrompt) {
            await context.sendActivity(options.retryPrompt, undefined, InputHints.ExpectingInput);
        } else if (options.prompt) {
            await context.sendActivity(options.prompt, undefined, InputHints.ExpectingInput);
        }
    }

    /**
     * Attempts to recognize the user's input.
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext), context for the current
     * turn of conversation with the user.
     * @param _state Contains state for the current instance of the prompt on the dialog stack.
     * @param _options A [PromptOptions](xref:botbuilder-dialogs.PromptOptions) object constructed
     * from the options initially provided in the call to Prompt.
     * @returns A `Promise` representing the asynchronous operation.
     */
    protected async onRecognize(
        context: TurnContext,
        _state: unknown,
        _options: PromptOptions
    ): Promise<PromptRecognizerResult<number>> {
        const result: PromptRecognizerResult<number> = { succeeded: false };
        const activity = context.activity;

        const utterance = activity.text;
        if (!utterance) {
            return result;
        }

        const defaultLocale = this.defaultLocale || 'en-us';
        const locale = activity.locale || defaultLocale;

        const [{ resolution = null } = {}] = Recognizers.recognizeNumber(utterance, locale) || [];
        if (resolution) {
            result.succeeded = true;

            // Note: if we encounter an exception loading a globalize number parser, fall back to the
            // parser for the default locale
            const parser = Globalize(this.getCultureFormattedForGlobalize(locale));
            let numberParser: (value: string) => number;
            try {
                numberParser = parser.numberParser();
            } catch {
                numberParser = Globalize(this.getCultureFormattedForGlobalize(defaultLocale)).numberParser();
            }

            result.value = numberParser(resolution.value);
        }

        return result;
    }

    /**
     * @private
     * The portions of the Globalize parsing library we use only need the first letters for internationalization culture
     */
    private getCultureFormattedForGlobalize(culture: string): string {
        return culture.slice(0, 2).toLowerCase();
    }
}
