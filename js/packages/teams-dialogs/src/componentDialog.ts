/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { telemetryTrackDialogView, TurnContext } from '@microsoft/teams-core';
import { Dialog, DialogInstance, DialogReason, DialogTurnResult, DialogTurnStatus } from './dialog';
import { DialogContext } from './dialogContext';
import { DialogContainer } from './dialogContainer';

const PERSISTED_DIALOG_STATE = 'dialogs';

/**
 * Base class for a dialog that contains other child dialogs.
 *
 * @remarks
 * Component dialogs let you break your bot's logic up into components that can themselves be added
 * as a dialog to another `ComponentDialog` or `DialogSet`. Components can also be exported as part
 * of a node package and used within other bots.
 *
 * To define a new component derive a class from ComponentDialog and add your child dialogs within
 * the classes constructor:
 *
 * ```JavaScript
 * const { ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt } = require('botbuilder-dialogs');
 *
 * class FillProfileDialog extends ComponentDialog {
 *     constructor(dialogId) {
 *         super(dialogId);
 *
 *         // Add control flow dialogs
 *         this.addDialog(new WaterfallDialog('start', [
 *             async (step) => {
 *                 // Ask user their name
 *                 return await step.prompt('namePrompt', `What's your name?`);
 *             },
 *             async (step) => {
 *                 // Remember the users answer
 *                 step.values['name'] = step.result;
 *
 *                 // Ask user their age.
 *                 return await step.prompt('agePrompt', `Hi ${step.values['name']}. How old are you?`);
 *             },
 *             async (step) => {
 *                 // Remember the users answer
 *                 step.values['age'] = step.result;
 *
 *                 // End the component and return the completed profile.
 *                 return await step.endDialog(step.values);
 *             }
 *         ]));
 *
 *         // Add prompts
 *         this.addDialog(new TextPrompt('namePrompt'));
 *         this.addDialog(new NumberPrompt('agePrompt'))
 *     }
 * }
 * module.exports.FillProfileDialog = FillProfileDialog;
 * ```
 *
 * You can then add new instances of your component to another `DialogSet` or `ComponentDialog`:
 *
 * ```JavaScript
 * const dialogs = new DialogSet(dialogState);
 * dialogs.add(new FillProfileDialog('fillProfile'));
 * ```
 * @param O (Optional) options that can be passed into the `DialogContext.beginDialog()` method.
 */
export class ComponentDialog<O extends object = {}> extends DialogContainer<O> {
    /**
     * ID of the child dialog that should be started anytime the component is started.
     *
     * @remarks
     * This defaults to the ID of the first child dialog added using [addDialog()](#adddialog).
     */
    protected initialDialogId: string|undefined;

    /**
     * Called when the dialog is started and pushed onto the parent's dialog stack.
     * By default, this calls the
     * Dialog.BeginDialogAsync(DialogContext, object, CancellationToken) method
     * of the component dialog's initial dialog, as defined by InitialDialogId.
     * Override this method in a derived class to implement interrupt logic.
     *
     * @param outerDC The parent [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param options Optional, initial information to pass to the dialog.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog.
     */
    async beginDialog(outerDC: DialogContext, options?: O): Promise<DialogTurnResult> {
        await this.checkForVersionChange(outerDC);

        telemetryTrackDialogView(this.telemetryClient, this.id);

        // Start the inner dialog.
        const innerDC: DialogContext = this.createChildContext(outerDC);
        const turnResult: DialogTurnResult<any> = await this.onBeginDialog(innerDC, options);

        // Check for end of inner dialog
        if (turnResult.status !== DialogTurnStatus.waiting) {
            if (turnResult.status === DialogTurnStatus.cancelled) {
                await this.endComponent(outerDC, turnResult.result);
                const cancelledTurnResult: DialogTurnResult = {
                    status: DialogTurnStatus.cancelled,
                    result: turnResult.result,
                };
                return cancelledTurnResult;
            }
            // Return result to calling dialog
            return await this.endComponent(outerDC, turnResult.result);
        }
        // Just signal end of turn
        return Dialog.EndOfTurn;
    }

    /**
     * Called when the dialog is _continued_, where it is the active dialog and the
     * user replies with a new [Activity](xref:botframework-schema.Activity).
     * If this method is *not* overridden, the dialog automatically ends when the user replies.
     *
     * @param outerDC The parent [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog. The result may also contain a
     * return value.
     */
    async continueDialog(outerDC: DialogContext): Promise<DialogTurnResult> {
        await this.checkForVersionChange(outerDC);

        // Continue execution of inner dialog.
        const innerDC: DialogContext = this.createChildContext(outerDC);
        const turnResult: DialogTurnResult<any> = await this.onContinueDialog(innerDC);

        // Check for end of inner dialog
        if (turnResult.status !== DialogTurnStatus.waiting) {
            // Return result to calling dialog
            return await this.endComponent(outerDC, turnResult.result);
        }

        // Just signal end of turn
        return Dialog.EndOfTurn;
    }

    /**
     * Called when a child dialog on the parent's dialog stack completed this turn, returning
     * control to this dialog component.
     *
     * @param outerDC The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param _reason Reason why the dialog resumed.
     * @param _result Optional, value returned from the dialog that was called. The type
     * of the value returned is dependent on the child dialog.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether this dialog is still
     * active after this dialog turn has been processed.
     * Generally, the child dialog was started with a call to
     * beginDialog(DialogContext, object) in the parent's
     * context. However, if the DialogContext.replaceDialog(string, object) method
     * is called, the logical child dialog may be different than the original.
     * If this method is *not* overridden, the dialog automatically calls its
     * RepromptDialog(ITurnContext, DialogInstance) when the user replies.
     */
    async resumeDialog(outerDC: DialogContext, _reason: DialogReason, _result?: any): Promise<DialogTurnResult> {
        await this.checkForVersionChange(outerDC);

        // Containers are typically leaf nodes on the stack but the dev is free to push other dialogs
        // on top of the stack which will result in the container receiving an unexpected call to
        // resumeDialog() when the pushed on dialog ends.
        // To avoid the container prematurely ending we need to implement this method and simply
        // ask our inner dialog stack to re-prompt.
        await this.repromptDialog(outerDC.context, outerDC.activeDialog!);

        return Dialog.EndOfTurn;
    }

    /**
     * Called when the dialog should re-prompt the user for input.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) object for this turn.
     * @param instance State information for this dialog.
     * @returns A Promise representing the asynchronous operation.
     */
    async repromptDialog(context: TurnContext, instance: DialogInstance): Promise<void> {
        // Forward to inner dialogs
        const innerDC: DialogContext = this.createInnerDC(context, instance);
        await innerDC.repromptDialog();

        // Notify component.
        await this.onRepromptDialog(context, instance);
    }

    /**
     * Called when the [Dialog](xref:botbuilder-dialogs.Dialog) is ending.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) object for this turn.
     * @param instance State information associated with the instance of this component
     * [Dialog](xref:botbuilder-dialogs.Dialog) on its parent's dialog stack.
     * @param reason Reason why the [Dialog](xref:botbuilder-dialogs.Dialog) ended.
     * @returns A Promise representing the asynchronous operation.
     * @remarks When this method is called from the parent dialog's context, the component [Dialog](xref:botbuilder-dialogs.Dialog)
     * cancels all of the dialogs on its inner dialog stack before ending.
     */
    async endDialog(context: TurnContext, instance: DialogInstance, reason: DialogReason): Promise<void> {
        // Forward cancel to inner dialogs
        if (reason === DialogReason.cancelCalled) {
            const innerDC: DialogContext = this.createInnerDC(context, instance);
            await innerDC.cancelAllDialogs();
        }

        // Notify component
        await this.onEndDialog(context, instance, reason);
    }

    /**
     * Adds a child [Dialog](xref:botbuilder-dialogs.Dialog) or prompt to the components internal [DialogSet](xref:botbuilder-dialogs.DialogSet).
     *
     * @param dialog The child [Dialog](xref:botbuilder-dialogs.Dialog) or prompt to add.
     * @returns The [ComponentDialog](xref:botbuilder-dialogs.ComponentDialog) after the operation is complete.
     * @remarks
     * The [Dialog.id](xref:botbuilder-dialogs.Dialog.id) of the first child added to the component will be assigned to the initialDialogId property.
     */
    addDialog(dialog: Dialog): this {
        this.dialogs.add(dialog);
        if (this.initialDialogId === undefined) {
            this.initialDialogId = dialog.id;
        }

        return this;
    }

    /**
     * Creates the inner dialog context
     *
     * @param outerDC the outer dialog context
     * @returns The created Dialog Context.
     */
    createChildContext(outerDC: DialogContext): DialogContext {
        return this.createInnerDC(outerDC, outerDC.activeDialog!);
    }

    /**
     * Called anytime an instance of the component has been started.
     *
     * @remarks
     * SHOULD be overridden by components that wish to perform custom interruption logic. The
     * default implementation calls `innerDC.beginDialog()` with the dialog assigned to
     * [initialDialogId](#initialdialogid).
     * @param innerDC Dialog context for the components internal `DialogSet`.
     * @param options (Optional) options that were passed to the component by its parent.
     * @returns {Promise<DialogTurnResult>} A promise resolving to the dialog turn result.
     */
    protected onBeginDialog(innerDC: DialogContext, options?: O): Promise<DialogTurnResult> {
        return innerDC.beginDialog(this.initialDialogId!, options);
    }

    /**
     * Called anytime a multi-turn component receives additional activities.
     *
     * @remarks
     * SHOULD be overridden by components that wish to perform custom interruption logic. The
     * default implementation calls `innerDC.continueDialog()`.
     * @param innerDC Dialog context for the components internal `DialogSet`.
     * @returns {Promise<DialogTurnResult>} A promise resolving to the dialog turn result.
     */
    protected onContinueDialog(innerDC: DialogContext): Promise<DialogTurnResult> {
        return innerDC.continueDialog();
    }

    /**
     * Called when the component is ending.
     *
     * @remarks
     * If the `reason` code is equal to `DialogReason.cancelCalled`, then any active child dialogs
     * will be cancelled before this method is called.
     * @param _context Context for the current turn of conversation.
     * @param _instance The components instance data within its parents dialog stack.
     * @param _reason The reason the component is ending.
     * @returns A promise representing the asynchronous operation.
     */
    protected onEndDialog(_context: TurnContext, _instance: DialogInstance, _reason: DialogReason): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Called when the component has been requested to re-prompt the user for input.
     *
     * @remarks
     * The active child dialog will have already been asked to reprompt before this method is called.
     * @param _context Context for the current turn of conversation.
     * @param _instance The instance of the current dialog.
     * @returns A promise representing the asynchronous operation.
     */
    protected onRepromptDialog(_context: TurnContext, _instance: DialogInstance): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Called when the components last active child dialog ends and the component is ending.
     *
     * @remarks
     * SHOULD be overridden by components that wish to perform custom logic before the component
     * ends.  The default implementation calls `outerDC.endDialog()` with the `result` returned
     * from the last active child dialog.
     * @param outerDC Dialog context for the parents `DialogSet`.
     * @param result Result returned by the last active child dialog. Can be a value of `undefined`.
     * @returns {Promise<DialogTurnResult>} A promise resolving to the dialog turn result.
     */
    protected endComponent(outerDC: DialogContext, result: any): Promise<DialogTurnResult> {
        return outerDC.endDialog(result);
    }

    /**
     * @private
     * @param context [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation with the user.
     * @param instance [DialogInstance](xref:botbuilder-dialogs.DialogInstance) which contains the current state information for this dialog.
     * @returns A new [DialogContext](xref:botbuilder-dialogs.DialogContext) instance.
     * @remarks
     * You should only call this if you don't have a dc to work with (such as OnResume())
     */
    private createInnerDC(context: DialogContext, instance: DialogInstance): DialogContext;
    /**
     * @private
     * @param context [TurnContext](xref:botbuilder-core.TurnContext) for the current turn of conversation with the user.
     * @param instance [DialogInstance](xref:botbuilder-dialogs.DialogInstance) which contains the current state information for this dialog.
     * @returns A new [DialogContext](xref:botbuilder-dialogs.DialogContext) instance.
     * @remarks
     * You should only call this if you don't have a dc to work with (such as OnResume())
     */
    private createInnerDC(context: TurnContext, instance: DialogInstance): DialogContext;
    /**
     * @private
     * @param context [TurnContext](xref:botbuilder-core.TurnContext) or [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation with the user.
     * @param instance [DialogInstance](xref:botbuilder-dialogs.DialogInstance) which contains the current state information for this dialog.
     * @returns A new [DialogContext](xref:botbuilder-dialogs.DialogContext) instance.
     * @remarks
     * You should only call this if you don't have a dc to work with (such as OnResume())
     */
    private createInnerDC(context: TurnContext | DialogContext, instance: DialogInstance): DialogContext {
        if (!instance) {
            const dialogInstance = { state: {} };
            instance = dialogInstance as DialogInstance;
        }

        const dialogState = instance.state[PERSISTED_DIALOG_STATE] || { dialogStack: [] };
        instance.state[PERSISTED_DIALOG_STATE] = dialogState;

        return new DialogContext(this.dialogs, context as TurnContext, dialogState);
    }
}
