// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BotFrameworkAuthentication, ClaimsIdentity } from '@microsoft/teams-connector';
import { CloudChannelServiceHandler } from '../cloudChannelServiceHandler';
import { SkillHandlerImpl } from './skillHandlerImpl';

import {
    Activity,
    ChannelAccount,
    ResourceResponse,
} from '@microsoft/teams-connector/src/schema';
import { SkillConversationReferenceKey } from './constants';
import { BotAdapter } from '../botAdapter';
import { TurnContext } from '../turnContext';
import { SkillConversationIdFactoryBase } from './skillConversationIdFactoryBase';

/**
 * A Bot Framework Handler for skills.
 */
export class CloudSkillHandler extends CloudChannelServiceHandler {
    /**
     * Used to access the CovnersationReference sent from the Skill to the Parent.
     */
    readonly SkillConversationReferenceKey = SkillConversationReferenceKey;

    // Delegate that implements actual logic
    private readonly inner: SkillHandlerImpl;

    /**
     * Initializes a new instance of the CloudSkillHandler class.
     *
     * @param adapter An instance of the BotAdapter that will handle the request.
     * @param logic The Bot logic function
     * @param conversationIdFactory A SkillConversationIdFactoryBase to unpack the conversation ID and map it to the calling bot.
     * @param auth Bot Framework Authentication to use
     */
    constructor(
        adapter: BotAdapter,
        logic: (context: TurnContext) => Promise<void>,
        conversationIdFactory: SkillConversationIdFactoryBase,
        auth: BotFrameworkAuthentication
    ) {
        super(auth);

        if (!adapter) {
            throw new Error('missing adapter.');
        }

        if (!logic) {
            throw new Error('missing logic.');
        }

        if (!conversationIdFactory) {
            throw new Error('missing conversationIdFactory.');
        }

        this.inner = new SkillHandlerImpl(
            this.SkillConversationReferenceKey,
            adapter,
            logic,
            conversationIdFactory,
            () => auth.getOriginatingAudience()
        );
    }

    /**
     * sendToConversation() API for Skill.
     *
     * @remarks
     * This method allows you to send an activity to the end of a conversation.
     *
     * This is slightly different from replyToActivity().
     * * sendToConversation(conversationId) - will append the activity to the end
     * of the conversation according to the timestamp or semantics of the channel.
     * * replyToActivity(conversationId,ActivityId) - adds the activity as a reply
     * to another activity, if the channel supports it. If the channel does not
     * support nested replies, replyToActivity falls back to sendToConversation.
     *
     * Use replyToActivity when replying to a specific activity in the conversation.
     *
     * Use sendToConversation in all other cases.
     * @param claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param conversationId Conversation ID.
     * @param activity Activity to send.
     * @returns A Promise with a ResourceResponse.
     */
    protected onSendToConversation(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        return this.inner.onSendToConversation(claimsIdentity, conversationId, activity);
    }

    /**
     * replyToActivity() API for Skill.
     *
     * @remarks
     * This method allows you to reply to an activity.
     *
     * This is slightly different from sendToConversation().
     * * sendToConversation(conversationId) - will append the activity to the end
     * of the conversation according to the timestamp or semantics of the channel.
     * * replyToActivity(conversationId,ActivityId) - adds the activity as a reply
     * to another activity, if the channel supports it. If the channel does not
     * support nested replies, replyToActivity falls back to sendToConversation.
     *
     * Use replyToActivity when replying to a specific activity in the conversation.
     *
     * Use sendToConversation in all other cases.
     * @param claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param conversationId Conversation ID.
     * @param activityId activityId the reply is to.
     * @param activity Activity to send.
     * @returns A Promise with a ResourceResponse.
     */
    protected onReplyToActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        return this.inner.onReplyToActivity(claimsIdentity, conversationId, activityId, activity);
    }

    /**
     *
     * UpdateActivity() API for Skill.
     *
     * @remarks
     * Edit an existing activity.
     *
     * Some channels allow you to edit an existing activity to reflect the new
     * state of a bot conversation.
     *
     * For example, you can remove buttons after someone has clicked "Approve" button.
     * @param claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param conversationId Conversation ID.
     * @param activityId activityId to update.
     * @param activity replacement Activity.
     * @returns a promise resolving to the underlying resource response
     */
    protected onUpdateActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        return this.inner.onUpdateActivity(claimsIdentity, conversationId, activityId, activity);
    }

    /**
     * DeleteActivity() API for Skill.
     *
     * @remarks
     * Delete an existing activity.
     *
     * Some channels allow you to delete an existing activity, and if successful
     * this method will remove the specified activity.
     *
     *
     * @param claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param conversationId Conversation ID.
     * @param activityId activityId to delete.
     * @returns a promise representing the async operation
     */
    protected async onDeleteActivity(
        claimsIdentity: ClaimsIdentity,
        conversationId: string,
        activityId: string
    ): Promise<void> {
        return this.inner.onDeleteActivity(claimsIdentity, conversationId, activityId);
    }

    /**
     * getConversationMember() API for Skill.
     *
     * @remarks
     * Get the account of a single conversation member.
     *
     * This REST API takes a ConversationId and UserId and returns the ChannelAccount
     * object representing the member of the conversation.
     * @param claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param userId User ID.
     * @param conversationId Conversation ID.
     *
     * @returns The ChannelAccount object representing the member of the conversation.
     */
    protected async onGetConversationMember(
        claimsIdentity: ClaimsIdentity,
        userId: string,
        conversationId: string
    ): Promise<ChannelAccount> {
        return this.inner.onGetMember(claimsIdentity, userId, conversationId);
    }
}
