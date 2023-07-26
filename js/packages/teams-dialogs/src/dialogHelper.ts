/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationConstants, ClaimsIdentity, GovernmentConstants, SkillValidation } from 'botframework-connector';
import { Dialog, DialogTurnStatus, DialogTurnResult } from './dialog';
import { DialogContext, DialogState } from './dialogContext';
import { DialogEvents } from './dialogEvents';
import { DialogSet } from './dialogSet';
import { DialogStateManager, DialogStateManagerConfiguration } from './memory';

import {
    Activity,
    ActivityEx,
    ActivityTypes,
    EndOfConversationCodes,
    BotTelemetryClient,
    BotTelemetryClientKey,
    SkillConversationReference,
    SkillConversationReferenceKey,
    StatePropertyAccessor,
    TurnContext,
} from '@microsoft/teams-core';

/**
 * Runs a dialog from a given context and accessor.
 *
 * @param dialog The [Dialog](xref:botbuilder-dialogs.Dialog) to run.
 * @param context [TurnContext](xref:botbuilder-core.TurnContext) object for the current turn of conversation with the user.
 * @param accessor Defined methods for accessing the state property created in a BotState object.
 */
export async function runDialog(
    dialog: Dialog,
    context: TurnContext,
    accessor: StatePropertyAccessor<DialogState>
): Promise<void> {
    if (!dialog) {
        throw new Error('runDialog(): missing dialog');
    }

    if (!context) {
        throw new Error('runDialog(): missing context');
    }

    if (!context.activity) {
        throw new Error('runDialog(): missing context.activity');
    }

    if (!accessor) {
        throw new Error('runDialog(): missing accessor');
    }

    const dialogSet = new DialogSet(accessor);
    dialogSet.telemetryClient =
        context.turnState.get<BotTelemetryClient>(BotTelemetryClientKey) ?? dialog.telemetryClient;

    dialogSet.add(dialog);

    const dialogContext = await dialogSet.createContext(context);

    await internalRun(context, dialog.id, dialogContext);
}

/**
 * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
 * @param dialogId The dialog ID.
 * @param dialogContext The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
 * @param dialogStateManagerConfiguration Configuration for the dialog state manager.
 * @returns {Promise<DialogTurnResult>} a promise resolving to the dialog turn result.
 */
export async function internalRun(
    context: TurnContext,
    dialogId: string,
    dialogContext: DialogContext,
    dialogStateManagerConfiguration?: DialogStateManagerConfiguration
): Promise<DialogTurnResult> {
    // map TurnState into root dialog context.services
    context.turnState.forEach((service, key) => {
        dialogContext.services.push(key, service);
    });

    const dialogStateManager = new DialogStateManager(dialogContext, dialogStateManagerConfiguration);

    await dialogStateManager.loadAllScopes();
    dialogContext.context.turnState.push('DialogStateManager', dialogStateManager);
    let dialogTurnResult: DialogTurnResult|undefined = undefined;

    // Loop as long as we are getting valid OnError handled we should continue executing the actions for the turn.
    // NOTE: We loop around this block because each pass through we either complete the turn and break out of the loop
    // or we have had an exception AND there was an OnError action which captured the error. We need to continue the
    // turn based on the actions the OnError handler introduced.
    let endOfTurn = false;
    while (!endOfTurn) {
        try {
            dialogTurnResult = await innerRun(context, dialogId, dialogContext);

            // turn successfully completed, break the loop
            endOfTurn = true;
        } catch (err: unknown) {
            // fire error event, bubbling from the leaf.
            const handled = await dialogContext.emitEvent(DialogEvents.error, err, true, true);

            if (!handled) {
                // error was NOT handled, throw the exception and end the turn.
                // (This will trigger the Adapter.OnError handler and end the entire dialog stack)
                throw err;
            }
        }
    }

    // save all state scopes to their respective botState locations.
    await dialogStateManager.saveAllChanges();

    // return the redundant result because the DialogManager contract expects it
    return dialogTurnResult!;
}

async function innerRun(
    context: TurnContext,
    dialogId: string,
    dialogContext: DialogContext
): Promise<DialogTurnResult> {
    // Handle EoC and Reprompt event from a parent bot (can be root bot to skill or skill to skill)
    if (isFromParentToSkill(context)) {
        // Handle remote cancellation request from parent.
        if (context.activity.type === ActivityTypes.EndOfConversation) {
            if (!dialogContext.stack.length) {
                // No dialogs to cancel, just return.
                return { status: DialogTurnStatus.empty };
            }

            const activeDialogContext = getActiveDialogContext(dialogContext);

            // Send cancellation message to the top dialog in the stack to ensure all the parents are canceled in the right order.
            return activeDialogContext.cancelAllDialogs(true);
        }

        // Process a reprompt event sent from the parent.
        if (context.activity.type === ActivityTypes.Event && context.activity.name === DialogEvents.repromptDialog) {
            if (!dialogContext.stack.length) {
                // No dialogs to reprompt, just return.
                return { status: DialogTurnStatus.empty };
            }

            await dialogContext.repromptDialog();
            return Dialog.EndOfTurn;
        }
    }

    // Continue or start the dialog.
    let result = await dialogContext.continueDialog();
    if (result.status === DialogTurnStatus.empty) {
        result = await dialogContext.beginDialog(dialogId);
    }

    await sendStateSnapshotTrace(dialogContext);

    if (result.status === DialogTurnStatus.complete || result.status === DialogTurnStatus.cancelled) {
        if (shouldSendEndOfConversationToParent(context, result)) {
            // Send End of conversation at the end.
            const code =
                result.status == DialogTurnStatus.complete
                    ? EndOfConversationCodes.CompletedSuccessfully
                    : EndOfConversationCodes.UserCancelled;
            const activity: Partial<Activity> = {
                type: ActivityTypes.EndOfConversation,
                value: result.result,
                locale: context.activity.locale,
                code: code,
            };
            await context.sendActivity(activity);
        }
    }

    return result;
}

/**
 * Helper to determine if we should send an EoC to the parent or not.
 *
 * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
 * @param turnResult The dialog turn result.
 * @returns True if should send EoC, otherwise false.
 */
export function shouldSendEndOfConversationToParent(context: TurnContext, turnResult: DialogTurnResult): boolean {
    if (!(turnResult.status == DialogTurnStatus.complete || turnResult.status == DialogTurnStatus.cancelled)) {
        // The dialog is still going, don't return EoC.
        return false;
    }

    const claimIdentity = context.turnState.get<ClaimsIdentity>(context.adapter.BotIdentityKey);
    // Inspect the cached ClaimsIdentity to determine if the bot was called from another bot.
    if (claimIdentity && SkillValidation.isSkillClaim(claimIdentity.claims)) {
        // EoC Activities returned by skills are bounced back to the bot by SkillHandler.
        // In those cases we will have a SkillConversationReference instance in state.
        const skillConversationReference: SkillConversationReference = context.turnState.get(
            SkillConversationReferenceKey
        );
        if (skillConversationReference) {
            // If the skillConversationReference.OAuthScope is for one of the supported channels, we are at the root and we should not send an EoC.
            return (
                skillConversationReference.oAuthScope !== AuthenticationConstants.ToBotFromChannelTokenIssuer &&
                skillConversationReference.oAuthScope !== GovernmentConstants.ToBotFromChannelTokenIssuer
            );
        }

        return true;
    }

    return false;
}

/**
 * Recursively walk up the DC stack to find the active DC.
 *
 * @param dialogContext [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation with the user.
 * @returns Active [DialogContext](xref:botbuilder-dialogs.DialogContext).
 */
export function getActiveDialogContext(dialogContext: DialogContext): DialogContext {
    const child = dialogContext.child;
    if (!child) {
        return dialogContext;
    }

    return getActiveDialogContext(child);
}

/**
 * Determines if the skill is acting as a skill parent.
 *
 * @param context [TurnContext](xref:botbuilder-core.TurnContext) object for the current turn of conversation with the user.
 * @returns A boolean representing if the skill is acting as a skill parent.
 */
export function isFromParentToSkill(context: TurnContext): boolean {
    // If a SkillConversationReference exists, it was likely set by the SkillHandler and the bot is acting as a parent.
    if (context.turnState.get(SkillConversationReferenceKey)) {
        return false;
    }

    // Inspect the cached ClaimsIdentity to determine if the bot is acting as a skill.
    const identity = context.turnState.get<ClaimsIdentity>(context.adapter.BotIdentityKey);
    return identity && SkillValidation.isSkillClaim(identity.claims);
}

// Helper to send a trace activity with a memory snapshot of the active dialog DC.
const sendStateSnapshotTrace = async (dialogContext: DialogContext): Promise<void> => {
    const adapter = dialogContext.context.adapter;
    const claimIdentity = dialogContext.context.turnState.get<ClaimsIdentity>(adapter.BotIdentityKey);
    const traceLabel =
        claimIdentity && SkillValidation.isSkillClaim(claimIdentity.claims) ? 'Skill State' : 'Bot State';

    // Send trace of memory
    const snapshot = getActiveDialogContext(dialogContext).state.getMemorySnapshot();
    const traceActivity = ActivityEx.createTraceActivity(
        'BotState',
        'https://www.botframework.com/schemas/botState',
        snapshot,
        traceLabel
    );
    await dialogContext.context.sendActivity(traceActivity);
};
