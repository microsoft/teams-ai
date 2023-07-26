/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Activity,
    ActivityTypes,
    Attachment,
    CardFactory,
    ConversationReference,
    DeliveryModes,
    ExpectedReplies,
    ExtendedUserTokenProvider,
    OAuthCard,
    SkillConversationIdFactoryOptions,
    StatusCodes,
    TokenExchangeInvokeRequest,
    TokenResponse,
    TurnContext,
    tokenExchangeOperationName,
} from '@microsoft/teams-core';

import { BeginSkillDialogOptions } from './beginSkillDialogOptions';
import { Dialog, DialogInstance, DialogReason, DialogTurnResult } from './dialog';
import { DialogContext } from './dialogContext';
import { DialogEvents } from './dialogEvents';
import { SkillDialogOptions } from './skillDialogOptions';

/**
 * A specialized Dialog that can wrap remote calls to a skill.
 *
 * @remarks
 * The options parameter in beginDialog must be a BeginSkillDialogOptions instance
 * with the initial parameters for the dialog.
 */
export class SkillDialog extends Dialog<Partial<BeginSkillDialogOptions>> {
    protected dialogOptions: SkillDialogOptions;

    // This key uses a simple namespace as Symbols are not serializable.
    private readonly DeliveryModeStateKey: string = 'SkillDialog.deliveryMode';
    private readonly SkillConversationIdStateKey: string = 'SkillDialog.skillConversationId';

    /**
     * A sample dialog that can wrap remote calls to a skill.
     *
     * @remarks
     * The options parameter in `beginDialog()` must be a `SkillDialogArgs` object with the initial parameters
     * for the dialog.
     *
     * @param dialogOptions The options to execute the skill dialog.
     * @param dialogId The id of the dialog.
     */
    constructor(dialogOptions: SkillDialogOptions, dialogId?: string) {
        super(dialogId);
        if (!dialogOptions) {
            throw new TypeError('Missing dialogOptions parameter');
        }
        this.dialogOptions = dialogOptions;
    }

    /**
     * Called when the skill dialog is started and pushed onto the dialog stack.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @param options Initial information to pass to the dialog.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still active after the turn has been processed by the dialog.
     */
    async beginDialog(dc: DialogContext, options: BeginSkillDialogOptions): Promise<DialogTurnResult> {
        const dialogArgs = this.validateBeginDialogArgs(options);

        // Create deep clone of the original activity to avoid altering it before forwarding it.
        const clonedActivity = this.cloneActivity(dialogArgs.activity);

        // Apply conversation reference and common properties from incoming activity before sending.
        const skillActivity = TurnContext.applyConversationReference(
            clonedActivity,
            TurnContext.getConversationReference(dc.context.activity),
            true
        ) as Activity;

        // Store delivery mode and connection name in dialog state for later use.
        dc.activeDialog!.state[this.DeliveryModeStateKey] = dialogArgs.activity.deliveryMode;

        // Create the conversationId and store it in the dialog context state so we can use it later.
        const skillConversationId = await this.createSkillConversationId(dc.context, dc.context.activity);
        dc.activeDialog!.state[this.SkillConversationIdStateKey] = skillConversationId;

        // Send the activity to the skill.
        const eocActivity = await this.sendToSkill(dc.context, skillActivity, skillConversationId);
        if (eocActivity) {
            return await dc.endDialog(eocActivity.value);
        }
        return Dialog.EndOfTurn;
    }

    /**
     * Called when the skill dialog is _continued_, where it is the active dialog and the
     * user replies with a new [Activity](xref:botframework-schema.Activity).
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of conversation.
     * @returns A Promise representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog. The result may also contain a
     * return value.
     */
    async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // @stevenic removed DialogStateManager 7/26/2023
        // with adaptive dialogs, ResumeDialog is not called directly. Instead the Interrupted flag is set, which
        // acts as the signal to the SkillDialog to resume the skill.
        // if (dc.state.getValue<boolean>(TurnPath.interrupted)) {
        //     // resume dialog execution
        //     dc.state.setValue(TurnPath.interrupted, false);
        //     return this.resumeDialog(dc, DialogReason.endCalled);
        // }

        if (!this.onValidateActivity(dc.context.activity)) {
            return Dialog.EndOfTurn;
        }

        // Handle EndOfConversation from the skill (this will be sent to the this dialog by the SkillHandler if received from the Skill)
        if (dc.context.activity.type === ActivityTypes.EndOfConversation) {
            return dc.endDialog(dc.context.activity.value);
        }

        // Create deep clone of the original activity to avoid altering it before forwarding it.
        const skillActivity: Activity = this.cloneActivity(dc.context.activity);

        skillActivity.deliveryMode = dc.activeDialog!.state[this.DeliveryModeStateKey] as string;

        const skillConversationId: string = dc.activeDialog!.state[this.SkillConversationIdStateKey];

        // Just forward to the remote skill
        const eocActivity = await this.sendToSkill(dc.context, skillActivity, skillConversationId);
        if (eocActivity) {
            return dc.endDialog(eocActivity.value);
        }

        return Dialog.EndOfTurn;
    }

    /**
     * Called when the skill dialog is ending.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) object for this turn.
     * @param instance State information associated with the instance of this dialog on the dialog stack.
     * @param reason [Reason](xref:botbuilder-dialogs.DialogReason) why the dialog ended.
     * @returns A Promise representing the asynchronous operation.
     */
    async endDialog(context: TurnContext, instance: DialogInstance, reason: DialogReason): Promise<void> {
        // Send of of conversation to the skill if the dialog has been cancelled.
        if (reason == DialogReason.cancelCalled || reason == DialogReason.replaceCalled) {
            const reference = TurnContext.getConversationReference(context.activity);
            // Apply conversation reference and common properties from incoming activity before sending.
            const activity = TurnContext.applyConversationReference(
                { type: ActivityTypes.EndOfConversation },
                reference,
                true
            );
            activity.channelData = context.activity.channelData;

            const skillConversationId = this.getSkillConversationIdFromInstance(instance);

            // connectionName is not applicable during endDialog as we don't expect an OAuthCard in response.
            await this.sendToSkill(context, activity as Activity, skillConversationId!);
        }

        await super.endDialog(context, instance, reason);
    }

    /**
     * Called when the skill dialog should re-prompt the user for input.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) object for this turn.
     * @param instance State information for this dialog.
     * @returns A Promise representing the asynchronous operation.
     */
    async repromptDialog(context: TurnContext, instance: DialogInstance): Promise<void> {
        // Create and send an envent to the skill so it can resume the dialog.
        const repromptEvent = { type: ActivityTypes.Event, name: DialogEvents.repromptDialog };

        const reference = TurnContext.getConversationReference(context.activity);
        // Apply conversation reference and common properties from incoming activity before sending.
        const activity: Activity = TurnContext.applyConversationReference(repromptEvent, reference, true) as Activity;

        const skillConversationId = this.getSkillConversationIdFromInstance(instance);

        // connectionName is not applicable for a reprompt as we don't expect an OAuthCard in response.
        await this.sendToSkill(context, activity, skillConversationId!);
    }

    /**
     * Called when a child skill dialog completed its turn, returning control to this dialog.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of the conversation.
     * @param _reason [Reason](xref:botbuilder-dialogs.DialogReason) why the dialog resumed.
     * @param _result Optional, value returned from the dialog that was called. The type
     * of the value returned is dependent on the child dialog.
     * @returns A Promise representing the asynchronous operation.
     */
    async resumeDialog(dc: DialogContext, _reason: DialogReason, _result?: any): Promise<DialogTurnResult> {
        await this.repromptDialog(dc.context, dc.activeDialog!);
        return Dialog.EndOfTurn;
    }

    /**
     * @protected
     * Validates the activity sent during continueDialog.
     * @remarks
     * Override this method to implement a custom validator for the activity being sent during the continueDialog.
     * This method can be used to ignore activities of a certain type if needed.
     * If this method returns false, the dialog will end the turn without processing the activity.
     * @param _activity The Activity for the current turn of conversation.
     * @returns True if the activity is valid, false if not.
     */
    protected onValidateActivity(_activity: Activity): boolean {
        return true;
    }

    /**
     * @private
     * Clones the Activity entity.
     * @param activity Activity to clone.
     */
    private cloneActivity(activity: Partial<Activity>): Activity {
        return JSON.parse(JSON.stringify(activity));
    }

    /**
     * @private
     */
    private validateBeginDialogArgs(options: BeginSkillDialogOptions): BeginSkillDialogOptions {
        if (!options) {
            throw new TypeError('Missing options parameter');
        }

        if (!options.activity) {
            throw new TypeError('"activity" is undefined or null in options.');
        }

        return options;
    }

    /**
     * @private
     */
    private async sendToSkill(
        context: TurnContext,
        activity: Activity,
        skillConversationId: string
    ): Promise<Activity> {
        if (activity.type === ActivityTypes.Invoke) {
            // Force ExpectReplies for invoke activities so we can get the replies right away and send them back to the channel if needed.
            // This makes sure that the dialog will receive the Invoke response from the skill and any other activities sent, including EoC.
            activity.deliveryMode = DeliveryModes.ExpectReplies;
        }

        // Always save state before forwarding
        // (the dialog stack won't get updated with the skillDialog and things won't work if you don't)
        const skillInfo = this.dialogOptions.skill;
        await this.dialogOptions.conversationState.saveChanges(context, true);

        const response = await this.dialogOptions.skillClient.postActivity<ExpectedReplies>(
            this.dialogOptions.botId,
            skillInfo.appId,
            skillInfo.skillEndpoint,
            this.dialogOptions.skillHostEndpoint,
            skillConversationId,
            activity
        );

        // Inspect the skill response status
        if (!isSuccessStatusCode(response.status)) {
            throw new Error(
                `Error invoking the skill id: "${skillInfo.id}" at "${skillInfo.skillEndpoint}" (status is ${response.status}). \r\n ${response.body}`
            );
        }

        let eocActivity: Activity;
        let sentInvokeResponses = false;

        const activitiesFromSkill = response.body && response.body.activities;
        if (activity.deliveryMode === DeliveryModes.ExpectReplies && Array.isArray(activitiesFromSkill)) {
            for (const activityFromSkill of activitiesFromSkill) {
                if (activityFromSkill.type === ActivityTypes.EndOfConversation) {
                    // Capture the EndOfConversation activity if it was sent from skill
                    eocActivity = activityFromSkill;

                    // The conversation has ended, so cleanup the conversation id.
                    await this.dialogOptions.conversationIdFactory.deleteConversationReference(skillConversationId);
                } else if (
                    !sentInvokeResponses &&
                    (await this.interceptOAuthCards(context, activityFromSkill, this.dialogOptions.connectionName!))
                ) {
                    // Do nothing. The token exchange succeeded, so no OAuthCard needs to be shown to the user.
                    sentInvokeResponses = true;
                } else {
                    // If an invoke response has already been sent we should ignore future invoke responses as this
                    // represents a bug in the skill.
                    if (activityFromSkill.type === ActivityTypes.InvokeResponse) {
                        if (sentInvokeResponses) {
                            continue;
                        }
                        sentInvokeResponses = true;
                    }

                    await context.sendActivity(activityFromSkill);
                }
            }
        }

        return eocActivity!;
    }

    /**
     * Tells us if we should intercept the OAuthCard message.
     * @remarks
     * The SkillDialog only attempts to intercept OAuthCards when the following criteria are met:
     * 1. An OAuthCard was sent from the skill
     * 2. The SkillDialog was called with a connectionName
     * 3. The current adapter supports token exchange
     * If any of these criteria are false, return false.
     * @private
     */
    private async interceptOAuthCards(
        context: TurnContext,
        activity: Activity,
        connectionName: string
    ): Promise<boolean> {
        if (!connectionName || !('exchangeToken' in context.adapter)) {
            // The adapter may choose not to support token exchange, in which case we fallback to showing skill's OAuthCard to the user.
            return false;
        }

        const oAuthCardAttachment = (activity.attachments || []).find(
            (c) => c.contentType === CardFactory.contentTypes.oauthCard
        );
        if (oAuthCardAttachment) {
            const tokenExchangeProvider: ExtendedUserTokenProvider = (context.adapter as unknown) as ExtendedUserTokenProvider;
            const oAuthCard: OAuthCard = oAuthCardAttachment.content;

            const uri = oAuthCard && oAuthCard.tokenExchangeResource && oAuthCard.tokenExchangeResource.uri;
            if (uri) {
                try {
                    const result: TokenResponse = await tokenExchangeProvider.exchangeToken(
                        context,
                        connectionName,
                        context.activity.from.id,
                        { uri }
                    );

                    if (result && result.token) {
                        // If token above is null or undefined, then SSO has failed and we return false.
                        // If not, send an invoke to the skill with the token.
                        return await this.sendTokenExchangeInvokeToSkill(
                            activity,
                            oAuthCard.tokenExchangeResource.id!,
                            oAuthCard.connectionName,
                            result.token
                        );
                    }
                } catch {
                    // Failures in token exchange are not fatal. They simply mean that the user needs to be shown the skill's OAuthCard.
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * @private
     */
    private async sendTokenExchangeInvokeToSkill(
        incomingActivity: Activity,
        id: string,
        connectionName: string,
        token: string
    ): Promise<boolean> {
        const ref: Partial<ConversationReference> = TurnContext.getConversationReference(incomingActivity);
        const activity: Activity = TurnContext.applyConversationReference({ ...incomingActivity }, ref) as any;
        activity.type = ActivityTypes.Invoke;
        activity.name = tokenExchangeOperationName;
        activity.value = { connectionName, id, token } as TokenExchangeInvokeRequest;

        // Send the activity to the Skill
        const skillInfo = this.dialogOptions.skill;
        const response = await this.dialogOptions.skillClient.postActivity<ExpectedReplies>(
            this.dialogOptions.botId,
            skillInfo.appId,
            skillInfo.skillEndpoint,
            this.dialogOptions.skillHostEndpoint,
            incomingActivity.conversation.id,
            activity
        );

        // Check response status: true if success, false if failure
        return isSuccessStatusCode(response.status);
    }

    /**
     * @private
     * Create a conversationId to interact with the skill and send the [Activity](xref:botframework-schema.Activity).
     * @param context [TurnContext](xref:botbuilder-core.TurnContext) for the current turn of conversation with the user.
     * @param activity [Activity](xref:botframework-schema.Activity) to send.
     * @returns The Skill Conversation ID.
     */
    private async createSkillConversationId(context: TurnContext, activity: Activity) {
        const conversationIdFactoryOptions: SkillConversationIdFactoryOptions = {
            fromBotOAuthScope: context.turnState.get(context.adapter.OAuthScopeKey),
            fromBotId: this.dialogOptions.botId,
            activity: activity,
            botFrameworkSkill: this.dialogOptions.skill,
        };

        // Create a conversationId to interact with the skill and send the activity
        let skillConversationId: string;
        try {
            skillConversationId = await this.dialogOptions.conversationIdFactory.createSkillConversationIdWithOptions(
                conversationIdFactoryOptions
            );
        } catch (err: unknown) {
            if ((err as Error).message !== 'Not Implemented') throw err;
            // If the SkillConversationIdFactoryBase implementation doesn't support createSkillConversationIdWithOptions(),
            // use createSkillConversationId() instead.
            skillConversationId = await this.dialogOptions.conversationIdFactory.createSkillConversationId(
                TurnContext.getConversationReference(activity) as ConversationReference
            );
        }
        return skillConversationId;
    }

    /**
     * @private
     * Gets the Skill Conversation ID from a given instance.
     * @param instance [DialogInstance](xref:botbuilder-dialogs.DialogInstance) from which to look for its ID.
     * @returns Instance conversation ID.
     */
    private getSkillConversationIdFromInstance(instance: DialogInstance): string|undefined {
        if (instance && instance.state) {
            return instance.state[this.SkillConversationIdStateKey];
        }

        return undefined;
    }
}

function isSuccessStatusCode(status: number): boolean {
    return status >= StatusCodes.OK && status < StatusCodes.MULTIPLE_CHOICES;
}
