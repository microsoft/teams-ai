/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, ActivityTypes, InputHints, MessageFactory, TurnContext } from '@microsoft/teams-core';
import { Choice, ChoiceFactory, ChoiceFactoryOptions } from '../choices';
import { Dialog, DialogInstance, DialogReason, DialogTurnResult, DialogEvent } from '../dialog';
import { DialogContext } from '../dialogContext';

/**
 * Controls the way that choices for a `ChoicePrompt` or yes/no options for a `ConfirmPrompt` are
 * presented to a user.
 */
export enum ListStyle {
    /**
     * Don't include any choices for prompt.
     */
    none,

    /**
     * Automatically select the appropriate style for the current channel.
     */
    auto,

    /**
     * Add choices to prompt as an inline list.
     */
    inline,

    /**
     * Add choices to prompt as a numbered list.
     */
    list,

    /**
     * Add choices to prompt as suggested actions.
     */
    suggestedAction,

    /**
     * Add choices to prompt as a HeroCard with buttons.
     */
    heroCard,
}

/**
 * Basic configuration options supported by all prompts.
 */
export interface PromptOptions {
    /**
     * (Optional) Initial prompt to send the user.
     */
    prompt?: string | Partial<Activity>;

    /**
     * (Optional) Retry prompt to send the user.
     */
    retryPrompt?: string | Partial<Activity>;

    /**
     * (Optional) List of choices associated with the prompt.
     */
    choices?: (string | Choice)[];

    /**
     * (Optional) Property that can be used to override or set the value of ChoicePrompt.Style
     * when the prompt is executed using DialogContext.prompt.
     */
    style?: ListStyle;

    /**
     * (Optional) Additional validation rules to pass the prompts validator routine.
     */
    validations?: object;

    /**
     * The locale to be use for recognizing the utterance.
     */
    recognizeLanguage?: string;
}

/**
 * Result returned by a prompts recognizer function.
 *
 * @param T Type of value being recognized.
 */
export interface PromptRecognizerResult<T> {
    /**
     * If `true` the users utterance was successfully recognized and [value](#value) contains the
     * recognized result.
     */
    succeeded: boolean;

    /**
     * Value that was recognized if [succeeded](#succeeded) is `true`.
     */
    value?: T;
}

/**
 * Function signature for providing a custom prompt validator.
 *
 * ```TypeScript
 * type PromptValidator<T> = (prompt: PromptValidatorContext<T>) => Promise<boolean>;
 * ```
 *
 * @remarks
 * The validator should be an asynchronous function that returns `true` if
 * `prompt.recognized.value` is valid and the prompt should end.
 *
 * > [!NOTE]
 * > If the validator returns `false` the prompts default re-prompt logic will be run unless the
 * > validator sends a custom re-prompt to the user using `prompt.context.sendActivity()`. In that
 * > case the prompts default re-rpompt logic will not be run.
 * @param T Type of recognizer result being validated.
 * @param PromptValidator.prompt Contextual information containing the recognizer result and original options passed to the prompt.
 */
export type PromptValidator<T> = (prompt: PromptValidatorContext<T>) => Promise<boolean>;

/**
 * Contextual information passed to a custom `PromptValidator`.
 *
 * @param T Type of recognizer result being validated.
 */
export interface PromptValidatorContext<T> {
    /**
     * The context for the current turn of conversation with the user.
     *
     * @remarks
     * The validator can use this to re-prompt the user.
     */
    readonly context: TurnContext;

    /**
     * Result returned from the prompts recognizer function.
     *
     * @remarks
     * The `prompt.recognized.succeeded` field can be checked to determine of the recognizer found
     * anything and then the value can be retrieved from `prompt.recognized.value`.
     */
    readonly recognized: PromptRecognizerResult<T>;

    /**
     * A dictionary of values persisted for each conversational turn while the prompt is active.
     *
     * @remarks
     * The validator can use this to persist things like turn counts or other state information.
     */
    readonly state: object;

    /**
     * Original set of options passed to the prompt by the calling dialog.
     *
     * @remarks
     * The validator can extend this interface to support additional prompt options.
     */
    readonly options: PromptOptions;

    /**
     * A count of the number of times the prompt has been executed.
     *
     * A number indicating how many times the prompt was invoked (starting at 1 for the first time it was invoked).
     */
    readonly attemptCount: number;
}

/**
 * Base class for all prompts.
 *
 * @param T Type of value being returned by the prompts recognizer function.
 */
export abstract class Prompt<T> extends Dialog {
    /**
     * Creates a new Prompt instance.
     *
     * @param dialogId (Optional) unique ID of the prompt within its parent `DialogSet` or `ComponentDialog`.
     * @param validator (Optional) custom validator used to provide additional validation and re-prompting logic for the prompt.
     */
    protected constructor(dialogId?: string, private validator?: PromptValidator<T>) {
        super(dialogId);
    }

    /**
     * Called when a prompt dialog is pushed onto the dialog stack and is being activated.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current
     * turn of the conversation.
     * @param options Optional. [PromptOptions](xref:botbuilder-dialogs.PromptOptions),
     * additional information to pass to the prompt being started.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the prompt is still
     * active after the turn has been processed by the prompt.
     */
    async beginDialog(dc: DialogContext, options: PromptOptions): Promise<DialogTurnResult> {
        // Ensure prompts have input hint set
        const opt: Partial<PromptOptions> = { ...options };
        if (opt.prompt && typeof opt.prompt === 'object' && typeof opt.prompt.inputHint !== 'string') {
            opt.prompt.inputHint = InputHints.ExpectingInput;
        }
        if (opt.retryPrompt && typeof opt.retryPrompt === 'object' && typeof opt.retryPrompt.inputHint !== 'string') {
            opt.retryPrompt.inputHint = InputHints.ExpectingInput;
        }

        // Initialize prompt state
        const state: PromptState = dc.activeDialog!.state as PromptState;
        state.options = opt;
        state.state = {};

        // Send initial prompt
        await this.onPrompt(dc.context, state.state, state.options, false);

        return Dialog.EndOfTurn;
    }

    /**
     * Called when a prompt dialog is the active dialog and the user replied with a new activity.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog.
     * The prompt generally continues to receive the user's replies until it accepts the
     * user's reply as valid input for the prompt.
     */
    async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Don't do anything for non-message activities
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        // Are we being continued after an interruption?
        // - The stepCount will be 1 or more if we're running in the context of an AdaptiveDialog
        //   and we're coming back from an interruption.
        const stepCount = dc.state.getValue('turn.stepCount');
        if (typeof stepCount == 'number' && stepCount > 0) {
            // re-prompt and then end
            await this.repromptDialog(dc.context, dc.activeDialog!);
            return Dialog.EndOfTurn;
        }

        // Perform base recognition
        const state: PromptState = dc.activeDialog!.state as PromptState;
        const recognized: PromptRecognizerResult<T> = await this.onRecognize(dc.context, state.state, state.options);

        // Validate the return value
        let isValid = false;
        if (this.validator) {
            if (state.state['attemptCount'] === undefined) {
                state.state['attemptCount'] = 0;
            }
            isValid = await this.validator({
                context: dc.context,
                recognized: recognized,
                state: state.state,
                options: state.options,
                attemptCount: ++state.state['attemptCount'],
            });
        } else if (recognized.succeeded) {
            isValid = true;
        }

        // Return recognized value or re-prompt
        if (isValid) {
            return await dc.endDialog(recognized.value);
        } else {
            if (!dc.context.responded) {
                await this.onPrompt(dc.context, state.state, state.options, true);
            }

            return Dialog.EndOfTurn;
        }
    }

    /**
     * Called before an event is bubbled to its parent.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param event [DialogEvent](xref:botbuilder-dialogs.DialogEvent), the event being raised.
     * @returns Whether the event is handled by the current dialog and further processing should stop.
     * @remarks
     * This is a good place to perform interception of an event as returning `true` will prevent
     * any further bubbling of the event to the dialogs parents and will also prevent any child
     * dialogs from performing their default processing.
     */
    protected async onPreBubbleEvent(dc: DialogContext, event: DialogEvent): Promise<boolean> {
        if (event.name == 'activityReceived' && dc.context.activity.type == ActivityTypes.Message) {
            // Perform base recognition
            const state: PromptState = dc.activeDialog!.state as PromptState;
            const recognized: PromptRecognizerResult<T> = await this.onRecognize(
                dc.context,
                state.state,
                state.options
            );
            return recognized.succeeded;
        }

        return false;
    }

    /**
     * Called when a prompt dialog resumes being the active dialog on the dialog stack, such as
     * when the previous active dialog on the stack completes.
     *
     * @param dc The DialogContext for the current turn of the conversation.
     * @param _reason An enum indicating why the dialog resumed.
     * @param _result Optional, value returned from the previous dialog on the stack.
     * The type of the value returned is dependent on the previous dialog.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog.
     */
    async resumeDialog(dc: DialogContext, _reason: DialogReason, _result?: any): Promise<DialogTurnResult> {
        // Prompts are typically leaf nodes on the stack but the dev is free to push other dialogs
        // on top of the stack which will result in the prompt receiving an unexpected call to
        // resumeDialog() when the pushed on dialog ends.
        // To avoid the prompt prematurely ending we need to implement this method and
        // simply re-prompt the user.
        await this.repromptDialog(dc.context, dc.activeDialog!);

        return Dialog.EndOfTurn;
    }

    /**
     * Called when a prompt dialog has been requested to re-prompt the user for input.
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext), context for the current
     * turn of conversation with the user.
     * @param instance [DialogInstance](xref:botbuilder-dialogs.DialogInstance), the instance
     * of the dialog on the stack.
     * @returns A `Promise` representing the asynchronous operation.
     */
    async repromptDialog(context: TurnContext, instance: DialogInstance): Promise<void> {
        const state: PromptState = instance.state as PromptState;
        await this.onPrompt(context, state.state, state.options, false);
    }

    /**
     * Called anytime the derived class should send the user a prompt.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param state Additional state being persisted for the prompt.
     * @param options Options that the prompt was started with in the call to `DialogContext.prompt()`.
     * @param isRetry If `true` the users response wasn't recognized and the re-prompt should be sent.
     */
    protected abstract onPrompt(
        context: TurnContext,
        state: object,
        options: PromptOptions,
        isRetry: boolean
    ): Promise<void>;

    /**
     * Called to recognize an utterance received from the user.
     *
     * @remarks
     * The Prompt class filters out non-message activities so its safe to assume that the users
     * utterance can be retrieved from `context.activity.text`.
     * @param context Context for the current turn of conversation with the user.
     * @param state Additional state being persisted for the prompt.
     * @param options Options that the prompt was started with in the call to `DialogContext.prompt()`.
     */
    protected abstract onRecognize(
        context: TurnContext,
        state: object,
        options: PromptOptions
    ): Promise<PromptRecognizerResult<T>>;

    /**
     * Helper function to compose an output activity containing a set of choices.
     *
     * @param prompt The prompt to append the users choices to.
     * @param channelId ID of the channel the prompt is being sent to.
     * @param choices List of choices to append.
     * @param style Configured style for the list of choices.
     * @param options (Optional) options to configure the underlying ChoiceFactory call.
     * @returns The composed activity ready to send to the user.
     */
    protected appendChoices(
        prompt: string | Partial<Activity>,
        channelId: string,
        choices: (string | Choice)[],
        style: ListStyle,
        options?: ChoiceFactoryOptions
    ): Partial<Activity> {
        // Get base prompt text (if any)
        let text = '';
        if (typeof prompt === 'string') {
            text = prompt;
        } else if (prompt && prompt.text) {
            text = prompt.text;
        }

        // Create temporary msg
        let msg: Partial<Activity>;
        switch (style) {
            case ListStyle.inline:
                msg = ChoiceFactory.inline(choices, text, undefined, options);
                break;

            case ListStyle.list:
                msg = ChoiceFactory.list(choices, text, undefined, options);
                break;

            case ListStyle.suggestedAction:
                msg = ChoiceFactory.suggestedAction(choices, text);
                break;

            case ListStyle.heroCard:
                msg = ChoiceFactory.heroCard(choices as Choice[], text);
                break;

            case ListStyle.none:
                msg = MessageFactory.text(text);
                break;

            default:
                msg = ChoiceFactory.forChannel(channelId, choices, text, undefined, options);
                break;
        }

        // Update prompt with text, actions and attachments
        if (typeof prompt === 'object') {
            // Clone the prompt Activity as to not modify the original prompt.
            prompt = JSON.parse(JSON.stringify(prompt)) as Activity;
            prompt.text = msg.text;
            if (
                msg.suggestedActions &&
                Array.isArray(msg.suggestedActions.actions) &&
                msg.suggestedActions.actions.length > 0
            ) {
                prompt.suggestedActions = msg.suggestedActions;
            }

            if (msg.attachments) {
                if (prompt.attachments) {
                    prompt.attachments = prompt.attachments.concat(msg.attachments);
                } else {
                    prompt.attachments = msg.attachments;
                }
            }

            return prompt;
        } else {
            msg.inputHint = InputHints.ExpectingInput;

            return msg;
        }
    }
}

/**
 * @private
 */
interface PromptState {
    state: any;
    options: PromptOptions;
}
