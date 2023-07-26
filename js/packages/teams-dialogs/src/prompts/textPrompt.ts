/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { InputHints, TurnContext } from '@microsoft/teams-core';
import { Prompt, PromptOptions, PromptRecognizerResult, PromptValidator } from './prompt';
import { DialogContext } from '../dialogContext';
import { DialogEvent } from '../dialog';

/**
 * Prompts a user to enter some text.
 *
 * @remarks
 * By default the prompt will return to the calling dialog a `string` representing the users reply.
 */
export class TextPrompt extends Prompt<string> {
    /**
     * Creates a new TextPrompt instance.
     *
     * @param dialogId (Optional) unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt.
     */
    constructor(dialogId?: string, validator?: PromptValidator<string>) {
        super(dialogId, validator);
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
        _state: any,
        _options: PromptOptions
    ): Promise<PromptRecognizerResult<string>> {
        const value: string = context.activity.text;

        return typeof value === 'string' && value.length > 0 ? { succeeded: true, value: value } : { succeeded: false };
    }

    /**
     * Called before an event is bubbled to its parent.
     *
     * @param _dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current
     * turn of conversation.
     * @param _event [DialogEvent](xref:botbuilder-dialogs.DialogEvent), the event being raised.
     * @returns Whether the event is handled by the current dialog and further processing should stop.
     * @remarks
     * This is a good place to perform interception of an event as returning `true` will prevent
     * any further bubbling of the event to the dialogs parents and will also prevent any child
     * dialogs from performing their default processing.
     */
    protected async onPreBubbleEvent(_dc: DialogContext, _event: DialogEvent): Promise<boolean> {
        return false;
    }
}
