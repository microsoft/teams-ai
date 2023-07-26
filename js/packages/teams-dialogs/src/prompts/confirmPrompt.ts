/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as Recognizers from '@microsoft/recognizers-text-choice';
import { Activity, TurnContext } from '@microsoft/teams-core';
import { Choice, ChoiceFactoryOptions, recognizeChoices } from '../choices';
import { ListStyle, Prompt, PromptOptions, PromptRecognizerResult, PromptValidator } from './prompt';
import { PromptCultureModels } from './promptCultureModels';

// Need ChoiceDefaultsProperty so we can set choiceDefaults dynamically with lambda
interface ChoiceDefaultsConfirmPrompt {
    [locale: string]: { choices: (string | Choice)[]; options: ChoiceFactoryOptions };
}

/**
 * Prompts a user to confirm something with a "yes" or "no" response.
 *
 * @remarks
 * By default the prompt will return to the calling dialog a `boolean` representing the users
 * selection.
 */
export class ConfirmPrompt extends Prompt<boolean> {
    /**
     * A dictionary of Default Choices based on [[PromptCultureModels.getSupportedCultures()]].
     * Can be replaced by user using the constructor that contains choiceDefaults.
     * This is initially set in the constructor.
     */
    private choiceDefaults: ChoiceDefaultsConfirmPrompt;
    /**
     * The prompts default locale that should be recognized.
     */
    defaultLocale: string | undefined;

    /**
     * Style of the "yes" and "no" choices rendered to the user when prompting.
     *
     * @remarks
     * Defaults to `ListStyle.auto`.
     */
    style: ListStyle;

    /**
     * Additional options passed to the `ChoiceFactory` and used to tweak the style of choices
     * rendered to the user.
     */
    choiceOptions: ChoiceFactoryOptions | undefined;

    /**
     * Custom list of choices to send for the prompt.
     */
    confirmChoices: (string | Choice)[] | undefined;

    /**
     * Creates a new ConfirmPrompt instance.
     *
     * @param dialogId Unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt.
     * @param defaultLocale (Optional) locale to use if `TurnContext.activity.locale` is not specified. Defaults to a value of `en-us`.
     * @param choiceDefaults (Optional) Overrides the dictionary of Default Choices on [[PromptCultureModels.getSupportedCultures()]].
     */
    constructor(
        dialogId: string,
        validator?: PromptValidator<boolean>,
        defaultLocale?: string,
        choiceDefaults?: ChoiceDefaultsConfirmPrompt
    ) {
        super(dialogId, validator);
        this.style = ListStyle.auto;
        this.defaultLocale = defaultLocale;

        if (choiceDefaults == undefined) {
            const supported: ChoiceDefaultsConfirmPrompt = {};
            PromptCultureModels.getSupportedCultures().forEach((culture): void => {
                supported[culture.locale] = {
                    choices: [culture.yesInLanguage, culture.noInLanguage],
                    options: {
                        inlineSeparator: culture.separator,
                        inlineOr: culture.inlineOr,
                        inlineOrMore: culture.inlineOrMore,
                        includeNumbers: true,
                    },
                };
            });
            this.choiceDefaults = supported;
        } else {
            this.choiceDefaults = choiceDefaults;
        }
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
        state: any,
        options: PromptOptions,
        isRetry: boolean
    ): Promise<void> {
        // Format prompt to send
        let prompt: Partial<Activity>;
        const channelId = context.activity.channelId;
        const culture = this.determineCulture(context.activity);
        const choiceOptions = this.choiceOptions || this.choiceDefaults[culture].options;
        const choices = this.confirmChoices || this.choiceDefaults[culture].choices;
        if (isRetry && options.retryPrompt) {
            prompt = this.appendChoices(options.retryPrompt, channelId, choices, this.style, choiceOptions);
        } else {
            prompt = this.appendChoices(options.prompt!, channelId, choices, this.style, choiceOptions);
        }

        // Send prompt
        await context.sendActivity(prompt);
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
        _state: any,
        _options: PromptOptions
    ): Promise<PromptRecognizerResult<boolean>> {
        const result: PromptRecognizerResult<boolean> = { succeeded: false };
        const activity = context.activity;
        const utterance = activity.text;
        if (!utterance) {
            return result;
        }
        const culture = this.determineCulture(context.activity);
        const results = Recognizers.recognizeBoolean(utterance, _options.recognizeLanguage ?? culture);
        if (results.length > 0 && results[0].resolution) {
            result.succeeded = true;
            result.value = results[0].resolution.value;
        } else {
            // If the prompt text was sent to the user with numbers, the prompt should recognize number choices.
            const choiceOptions = this.choiceOptions || this.choiceDefaults[culture].options;

            if (typeof choiceOptions.includeNumbers !== 'boolean' || choiceOptions.includeNumbers) {
                const confirmChoices = this.confirmChoices || this.choiceDefaults[culture].choices;
                const choices = [confirmChoices[0], confirmChoices[1]];
                const secondOrMoreAttemptResults = recognizeChoices(utterance, choices);
                if (secondOrMoreAttemptResults.length > 0) {
                    result.succeeded = true;
                    result.value = secondOrMoreAttemptResults[0].resolution.index === 0;
                }
            }
        }

        return result;
    }

    /**
     * @private
     */
    private determineCulture(activity: Activity): string {
        let culture = PromptCultureModels.mapToNearestLanguage(
            activity.locale || this.defaultLocale || PromptCultureModels.English.locale
        );
        if (!(culture && this.choiceDefaults[culture])) {
            culture = PromptCultureModels.English.locale;
        }

        return culture;
    }
}
