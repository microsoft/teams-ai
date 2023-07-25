// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ClaimsIdentity, JwtTokenValidation } from '@microsoft/teams-connector';
import { v4 as uuid } from 'uuid';
import { BotAdapter } from '../botAdapter';
import { TurnContext } from '../turnContext';
import { SkillConversationIdFactoryBase } from './skillConversationIdFactoryBase';
import { Activity, ActivityTypes, CallerIdConstants, ChannelAccount, ResourceResponse } from '@microsoft/teams-connector/src/schema';
import { SkillConversationReference } from './skillConversationReference';

/**
 * @internal
 */
export class SkillHandlerImpl {
    /**
     * @internal
     */
    constructor(
        private readonly skillConversationReferenceKey: symbol,
        private readonly adapter: BotAdapter,
        private readonly logic: (context: TurnContext) => Promise<void>,
        private readonly conversationIdFactory: SkillConversationIdFactoryBase,
        private readonly getOauthScope: () => string | undefined = () => undefined
    ) {}

    /**
     * @internal
     */
    onSendToConversation(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        return this.processActivity(claimsIdentity, conversationId, undefined, activity);
    }

    /**
     * @internal
     */
    onReplyToActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        return this.processActivity(claimsIdentity, conversationId, activityId, activity);
    }

    /**
     * @internal
     */
    async onUpdateActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        let resourceResponse: ResourceResponse | void | undefined = undefined;

        await this.continueConversation(claimsIdentity, conversationId, async (context, ref) => {
            const newActivity = TurnContext.applyConversationReference(activity, ref.conversationReference);

            context.activity.id = activityId;
            context.activity.callerId = `${CallerIdConstants.BotToBotPrefix}${JwtTokenValidation.getAppIdFromClaims(
                claimsIdentity.claims
            )}`;

            resourceResponse = await context.updateActivity(newActivity);
        });

        return resourceResponse ? resourceResponse : { id: activityId };
    }

    /**
     * @internal
     */
    async onDeleteActivity(claimsIdentity: ClaimsIdentity, conversationId: string, activityId: string): Promise<void> {
        return this.continueConversation(claimsIdentity, conversationId, (context) =>
            context.deleteActivity(activityId)
        );
    }

    /**
     * @internal
     */
    async onGetMember(claimsIdentity: ClaimsIdentity, userId: string, conversationId: string): Promise<ChannelAccount> {
        let member: ChannelAccount | undefined = undefined;

        await this.continueConversation(claimsIdentity, conversationId, async (context) => {
            const client = context.turnState.get(context.adapter.ConnectorClientKey);
            const conversationId = context.activity.conversation.id;
            member = await client.conversations.getConversationMember(conversationId, userId);
        });

        return member!;
    }

    private async getSkillConversationReference(conversationId: string): Promise<SkillConversationReference> {
        let skillConversationReference: SkillConversationReference;

        try {
            skillConversationReference = await this.conversationIdFactory.getSkillConversationReference(conversationId);
        } catch (err: unknown) {
            // If the factory has overridden getSkillConversationReference, call the deprecated getConversationReference().
            // In this scenario, the oAuthScope paired with the ConversationReference can only be used for talking with
            // an official channel, not another bot.
            if ((err as Error).message === 'NotImplemented') {
                skillConversationReference = {
                    conversationReference: await this.conversationIdFactory.getConversationReference(conversationId),
                    oAuthScope: this.getOauthScope()!,
                };
            } else {
                throw err;
            }
        }

        if (!skillConversationReference) {
            throw new Error('skillConversationReference not found');
        } else if (!skillConversationReference.conversationReference) {
            throw new Error('conversationReference not found.');
        }

        return skillConversationReference;
    }

    private async processActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        replyToActivityId: string|undefined,
        activity: Activity
    ): Promise<ResourceResponse> {
        let resourceResponse: ResourceResponse|undefined;

        await this.continueConversation(claimsIdentity, conversationId, async (context, ref) => {
            /**
             * This callback does the following:
             *  - Applies the correct ConversationReference to the Activity for sending to the user-router conversation.
             *  - For EndOfConversation Activities received from the Skill, removes the ConversationReference from the
             *    ConversationIdFactory
             */

            const newActivity = TurnContext.applyConversationReference(activity, ref.conversationReference);

            context.activity.id = replyToActivityId;
            context.activity.callerId = `${CallerIdConstants.BotToBotPrefix}${JwtTokenValidation.getAppIdFromClaims(
                claimsIdentity.claims
            )}`;

            switch (newActivity.type) {
                case ActivityTypes.EndOfConversation:
                    await this.conversationIdFactory.deleteConversationReference(conversationId);

                    this.applySkillActivityToTurnContext(context, newActivity);
                    await this.logic(context);

                    break;

                case ActivityTypes.Event:
                    this.applySkillActivityToTurnContext(context, newActivity);
                    await this.logic(context);

                    break;

                default:
                    resourceResponse = await context.sendActivity(newActivity);
                    break;
            }
        });

        if (!resourceResponse) {
            resourceResponse = { id: uuid() };
        }

        return resourceResponse;
    }

    private async continueConversation(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        callback: (context: TurnContext, ref: SkillConversationReference) => Promise<void>
    ): Promise<void> {
        const ref = await this.getSkillConversationReference(conversationId);

        const continueCallback = (context: TurnContext): Promise<void> => {
            context.turnState.set(this.skillConversationReferenceKey, ref);
            return callback(context, ref);
        };

        try {
            await this.adapter.continueConversationAsync(
                claimsIdentity,
                ref.conversationReference,
                ref.oAuthScope,
                continueCallback
            );
        } catch (err: unknown) {
            if ((err as Error).message === 'NotImplemented') {
                // We're in the legacy scenario where our adapter does not support passing through claims/audience
                // explicitly. Stash it in turn context and hope for the best!
                await this.adapter.continueConversation(ref.conversationReference, async (context) => {
                    context.turnState.set(context.adapter.BotIdentityKey, claimsIdentity);
                    return continueCallback(context);
                });
            } else {
                throw err;
            }
        }
    }

    // adapter.continueConversation() sends an event activity with continueConversation in the name.
    // this warms up the incoming middlewares but once that's done and we hit the custom callback,
    // we need to swap the values back to the ones received from the skill so the bot gets the actual activity.
    private applySkillActivityToTurnContext(context: TurnContext, activity: Partial<Activity>): void {
        context.activity.channelData = activity.channelData;
        context.activity.code = activity.code;
        context.activity.entities = activity.entities;
        context.activity.locale = activity.locale;
        context.activity.localTimestamp = activity.localTimestamp;
        context.activity.name = activity.name;
        context.activity.relatesTo = activity.relatesTo;
        context.activity.replyToId = activity.replyToId;
        context.activity.timestamp = activity.timestamp;
        context.activity.text = activity.text!;
        context.activity.type = activity.type!;
        context.activity.value = activity.value;
    }
}
