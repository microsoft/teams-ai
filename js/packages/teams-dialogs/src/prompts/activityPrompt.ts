/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, InputHints, TurnContext, ActivityTypes } from '@microsoft/teams-core';
import { Dialog, DialogInstance, DialogReason, DialogTurnResult } from '../dialog';
import { DialogContext } from '../dialogContext';
import { PromptOptions, PromptRecognizerResult, PromptValidator } from './prompt';

/**
 * Waits for an activity to be received.
 *
 * @remarks
 * This prompt requires a validator be passed in and is useful when waiting for non-message
 * activities like an event to be received. The validator can ignore received events until the
 * expected activity is received.
 */
export class ActivityPrompt extends Dialog {
    /**
     * Creates a new ActivityPrompt instance.
     *
     * @param dialogId Unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
     * @param validator Validator that will be called each time a new activity is received.
     */
    constructor(dialogId: string, private validator: PromptValidator<Activity>) {
        super(dialogId);
    }

    /**
     * Called when a prompt dialog is pushed onto the dialog stack and is being activated.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current
     * turn of the conversation.
     * @param options [PromptOptions](xref:botbuilder-dialogs.PromptOptions), additional
     * information to pass to the prompt being started.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the promise is successful, the result indicates whether the prompt is still
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
        const state: any = dc.activeDialog!.state as ActivityPromptState;
        state.options = opt;
        state.state = {};

        // Send initial prompt
        await this.onPrompt(dc.context, state.state, state.options, false);

        return Dialog.EndOfTurn;
    }

    /**
     * Called when a prompt dialog is the active dialog and the user replied with a new activity.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current
     * turn of conversation.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the promise is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog.
     * The prompt generally continues to receive the user's replies until it accepts the
     * user's reply as valid input for the prompt.
     */
    async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Perform base recognition
        const state: any = dc.activeDialog!.state as ActivityPromptState;
        const recognized: PromptRecognizerResult<Activity> = await this.onRecognize(
            dc.context,
            state.state,
            state.options
        );

        if (state.state['attemptCount'] === undefined) {
            state.state['attemptCount'] = 0;
        }

        // Validate the return value
        // - Unlike the other prompts a validator is required for an ActivityPrompt so we don't
        //   need to check for its existence before calling it.
        const isValid: boolean = await this.validator({
            context: dc.context,
            recognized: recognized,
            state: state.state,
            options: state.options,
            attemptCount: ++state.state['attemptCount'],
        });

        // Return recognized value or re-prompt
        if (isValid) {
            return await dc.endDialog(recognized.value);
        } else {
            if (dc.context.activity.type === ActivityTypes.Message && !dc.context.responded) {
                await this.onPrompt(dc.context, state.state, state.options, true);
            }

            return Dialog.EndOfTurn;
        }
    }

    /**
     * Called when a prompt dialog resumes being the active dialog on the dialog stack, such as
     * when the previous active dialog on the stack completes.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn
     * of the conversation.
     * @param _reason [DialogReason](xref:botbuilder-dialogs.DialogReason), an enum indicating why
     * the dialog resumed.
     * @param _result Optional. Value returned from the previous dialog on the stack.
     * The type of the value returned is dependent on the previous dialog.
     * @returns A `Promise` representing the asynchronous operation.
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
        const state: ActivityPromptState = instance.state as ActivityPromptState;
        await this.onPrompt(context, state.state, state.options, false);
    }

    /**
     * When overridden in a derived class, prompts the user for input.
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext), context for the current
     * turn of conversation with the user.
     * @param state Contains state for the current instance of the prompt on the dialog stack.
     * @param options A [PromptOptions](xref:botbuilder-dialogs.PromptOptions) object constructed
     * from the options initially provided in the call to Prompt.
     * @param isRetry A boolean representing if the prompt is a retry.
     * @returns A `Promise` representing the asynchronous operation.
     */
    protected async onPrompt(
        context: TurnContext,
        state: object,
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
     * When overridden in a derived class, attempts to recognize the incoming [Activity](xref:botframework-schema.Activity).
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
        _state: object,
        _options: PromptOptions
    ): Promise<PromptRecognizerResult<Activity>> {
        return { succeeded: true, value: context.activity };
    }
}

/**
 * @private
 */
interface ActivityPromptState {
    state: object;
    options: PromptOptions;
}
