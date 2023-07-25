// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ActivityHandlerBase } from '../activityHandlerBase';
import { BotAdapter } from '../botAdapter';
import { ChannelServiceHandler } from '../channelServiceHandler';
import { SkillConversationReferenceKey } from './constants';
import { SkillHandlerImpl } from './skillHandlerImpl';

import {
    AuthenticationConfiguration,
    AuthenticationConstants,
    ClaimsIdentity,
    GovernmentConstants,
    ICredentialProvider,
    JwtTokenValidation,
} from '@microsoft/teams-connector';

import { Activity, ResourceResponse } from '@microsoft/teams-connector/src/schema';
import { SkillConversationIdFactoryBase } from './skillConversationIdFactoryBase';


/**
 * @deprecated Use `CloudSkillHandler` instead.
 * A Bot Framework Handler for skills.
 */
export class SkillHandler extends ChannelServiceHandler {
    /**
     * Used to access the CovnersationReference sent from the Skill to the Parent.
     *
     * @remarks
     * The value is the same as the SkillConversationReferenceKey exported from botbuilder-core.
     */
    readonly SkillConversationReferenceKey = SkillConversationReferenceKey;

    // Delegate that implements actual logic
    private readonly inner: SkillHandlerImpl;

    /**
     * Initializes a new instance of the SkillHandler class.
     *
     * @param adapter An instance of the BotAdapter that will handle the request.
     * @param bot The ActivityHandlerBase instance.
     * @param conversationIdFactory A SkillConversationIdFactoryBase to unpack the conversation ID and map it to the calling bot.
     * @param credentialProvider The credential provider.
     * @param authConfig The authentication configuration.
     * @param channelService The string indicating if the bot is working in Public Azure or in Azure Government (https://aka.ms/AzureGovDocs).
     */
    constructor(
        adapter: BotAdapter,
        bot: ActivityHandlerBase,
        conversationIdFactory: SkillConversationIdFactoryBase,
        credentialProvider: ICredentialProvider,
        authConfig: AuthenticationConfiguration,
        channelService?: string
    ) {
        super(credentialProvider, authConfig, channelService);

        if (!adapter) {
            throw new Error('missing adapter.');
        }

        if (!bot) {
            throw new Error('missing bot.');
        }

        if (!conversationIdFactory) {
            throw new Error('missing conversationIdFactory.');
        }

        this.inner = new SkillHandlerImpl(
            this.SkillConversationReferenceKey,
            adapter,
            (context) => bot.run(context),
            conversationIdFactory,
            () =>
                JwtTokenValidation.isGovernment(channelService!)
                    ? GovernmentConstants.ToChannelFromBotOAuthScope
                    : AuthenticationConstants.ToChannelFromBotOAuthScope
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
}
