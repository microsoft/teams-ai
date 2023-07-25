// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ClaimsIdentity } from '@microsoft/teams-connector';
import { STATUS_CODES } from 'http';
import { StatusCodeError } from './statusCodeError';

import {
    Activity,
    AttachmentData,
    ChannelAccount,
    ConversationParameters,
    ConversationResourceResponse,
    ConversationsResult,
    PagedMembersResult,
    ResourceResponse,
    StatusCodes,
    Transcript,
} from '@microsoft/teams-connector/src/schema';

/**
 * The ChannelServiceHandlerBase implements API to forward activity to a skill and
 * implements routing ChannelAPI calls from the Skill up through the bot/adapter.
 */
export abstract class ChannelServiceHandlerBase {
    /**
     * Sends an [Activity](xref:botframework-schema.Activity) to the end of a conversation.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param activity The [Activity](xref:botframework-schema.Activity) to send.
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     */
    async handleSendToConversation(
        authHeader: string,
        conversationId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onSendToConversation(claimsIdentity, conversationId, activity);
    }

    /**
     * Sends a reply to an [Activity](xref:botframework-schema.Activity).
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param activityId The activity Id the reply is to.
     * @param activity The [Activity](xref:botframework-schema.Activity) to send.
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     */
    async handleReplyToActivity(
        authHeader: string,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onReplyToActivity(claimsIdentity, conversationId, activityId, activity);
    }

    /**
     * Edits a previously sent existing [Activity](xref:botframework-schema.Activity).
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param activityId The activity Id to update.
     * @param activity The replacement [Activity](xref:botframework-schema.Activity).
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     */
    async handleUpdateActivity(
        authHeader: string,
        conversationId: string,
        activityId: string,
        activity: Activity
    ): Promise<ResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onUpdateActivity(claimsIdentity, conversationId, activityId, activity);
    }

    /**
     * Deletes an existing [Activity](xref:botframework-schema.Activity).
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param activityId The activity Id to delete.
     */
    async handleDeleteActivity(authHeader: string, conversationId: string, activityId: string): Promise<void> {
        const claimsIdentity = await this.authenticate(authHeader);
        await this.onDeleteActivity(claimsIdentity, conversationId, activityId);
    }

    /**
     * Enumerates the members of an [Activity](xref:botframework-schema.Activity).
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param activityId The activity Id.
     * @returns The enumerated [ChannelAccount](xref:botframework-schema.ChannelAccount) list.
     */
    async handleGetActivityMembers(
        authHeader: string,
        conversationId: string,
        activityId: string
    ): Promise<ChannelAccount[]> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onGetActivityMembers(claimsIdentity, conversationId, activityId);
    }

    /**
     * Creates a new Conversation.
     *
     * @param authHeader The authentication header.
     * @param parameters [ConversationParameters](xref:botbuilder-core.ConversationParameters) to create the conversation from.
     * @returns A `Promise` representation for the operation.
     */
    async handleCreateConversation(
        authHeader: string,
        parameters: ConversationParameters
    ): Promise<ConversationResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onCreateConversation(claimsIdentity, parameters);
    }

    /**
     * Lists the Conversations in which the bot has participated.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param continuationToken A skip or continuation token.
     * @returns A `Promise` representation for the operation.
     */
    async handleGetConversations(
        authHeader: string,
        conversationId: string,
        continuationToken?: string /* some default */
    ): Promise<ConversationsResult> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onGetConversations(claimsIdentity, conversationId, continuationToken);
    }

    /**
     * Enumerates the members of a conversation.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @returns The enumerated [ChannelAccount](xref:botframework-schema.ChannelAccount) list.
     */
    async handleGetConversationMembers(authHeader: string, conversationId: string): Promise<ChannelAccount[]> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onGetConversationMembers(claimsIdentity, conversationId);
    }

    /**
     * Gets the account of a single conversation member.
     *
     * @param authHeader The authentication header.
     * @param userId The user Id.
     * @param conversationId The conversation Id.
     * @returns The [ChannelAccount](xref:botframework-schema.ChannelAccount) for the provided user id.
     */
    async handleGetConversationMember(
        authHeader: string,
        userId: string,
        conversationId: string
    ): Promise<ChannelAccount> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onGetConversationMember(claimsIdentity, userId, conversationId);
    }

    /**
     * Enumerates the members of a conversation one page at a time.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param pageSize Suggested page size.
     * @param continuationToken A continuation token.
     * @returns A `Promise` representing the [PagedMembersResult](xref:botframework-schema.PagedMembersResult) for the operation.
     */
    async handleGetConversationPagedMembers(
        authHeader: string,
        conversationId: string,
        pageSize = -1,
        continuationToken?: string
    ): Promise<PagedMembersResult> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onGetConversationPagedMembers(claimsIdentity, conversationId, pageSize, continuationToken);
    }

    /**
     * Deletes a member from a conversation.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param memberId Id of the member to delete from this conversation.
     */
    async handleDeleteConversationMember(authHeader: string, conversationId: string, memberId: string): Promise<void> {
        const claimsIdentity = await this.authenticate(authHeader);
        await this.onDeleteConversationMember(claimsIdentity, conversationId, memberId);
    }

    /**
     * Uploads the historic activities of the conversation.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param transcript [Transcript](xref:botframework-schema.Transcript) of activities.
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     */
    async handleSendConversationHistory(
        authHeader: string,
        conversationId: string,
        transcript: Transcript
    ): Promise<ResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onSendConversationHistory(claimsIdentity, conversationId, transcript);
    }

    /**
     * Stores data in a compliant store when dealing with enterprises.
     *
     * @param authHeader The authentication header.
     * @param conversationId The conversation Id.
     * @param attachmentUpload [AttachmentData](xref:botframework-schema.AttachmentData).
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     */
    async handleUploadAttachment(
        authHeader: string,
        conversationId: string,
        attachmentUpload: AttachmentData
    ): Promise<ResourceResponse> {
        const claimsIdentity = await this.authenticate(authHeader);
        return this.onUploadAttachment(claimsIdentity, conversationId, attachmentUpload);
    }

    /**
     * SendToConversation() API for Skill.
     *
     * @remarks
     * This method allows you to send an activity to the end of a conversation.
     * This is slightly different from ReplyToActivity().
     * * SendToConversation(conversationId) - will append the activity to the end
     * of the conversation according to the timestamp or semantics of the channel.
     * * ReplyToActivity(conversationId,ActivityId) - adds the activity as a reply
     * to another activity, if the channel supports it. If the channel does not
     * support nested replies, ReplyToActivity falls back to SendToConversation.
     *
     * Use ReplyToActivity when replying to a specific activity in the
     * conversation.
     *
     * Use SendToConversation in all other cases.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation identifier
     * @param _activity Activity to send
     */
    protected async onSendToConversation(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _activity: Activity
    ): Promise<ResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onSendToConversation(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * ReplyToActivity() API for Skill.
     *
     * @remarks
     * This method allows you to reply to an activity.
     *
     * This is slightly different from SendToConversation().
     * * SendToConversation(conversationId) - will append the activity to the end
     * of the conversation according to the timestamp or semantics of the channel.
     * * ReplyToActivity(conversationId,ActivityId) - adds the activity as a reply
     * to another activity, if the channel supports it. If the channel does not
     * support nested replies, ReplyToActivity falls back to SendToConversation.
     *
     * Use ReplyToActivity when replying to a specific activity in the
     * conversation.
     *
     * Use SendToConversation in all other cases.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _activityId activityId the reply is to (OPTIONAL).
     * @param _activity Activity to send.
     */
    protected async onReplyToActivity(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _activityId: string,
        _activity: Activity
    ): Promise<ResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onReplyToActivity(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * UpdateActivity() API for Skill.
     *
     * @remarks
     * Edit an existing activity.
     *
     * Some channels allow you to edit an existing activity to reflect the new
     * state of a bot conversation.
     *
     * For example, you can remove buttons after someone has clicked "Approve" button.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _activityId activityId to update.
     * @param _activity replacement Activity.
     */
    protected async onUpdateActivity(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _activityId: string,
        _activity: Activity
    ): Promise<ResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onUpdateActivity(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
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
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _activityId activityId to delete.
     */
    protected async onDeleteActivity(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _activityId: string
    ): Promise<void> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onDeleteActivity(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * GetActivityMembers() API for Skill.
     *
     * @remarks
     * Enumerate the members of an activity.
     *
     * This REST API takes a ConversationId and a ActivityId, returning an array
     * of ChannelAccount objects representing the members of the particular
     * activity in the conversation.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _activityId Activity ID.
     */
    protected async onGetActivityMembers(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _activityId: string
    ): Promise<ChannelAccount[]> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onGetActivityMembers(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * CreateConversation() API for Skill.
     *
     * @remarks
     * Create a new Conversation.
     *
     * POST to this method with a
     * * Bot being the bot creating the conversation
     * * IsGroup set to true if this is not a direct message (default is false)
     * * Array containing the members to include in the conversation
     *
     * The return value is a ResourceResponse which contains a conversation id
     * which is suitable for use in the message payload and REST API uris.
     *
     * Most channels only support the semantics of bots initiating a direct
     * message conversation.
     *
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _parameters Parameters to create the conversation from.
     */
    protected async onCreateConversation(
        _claimsIdentity: ClaimsIdentity,
        _parameters: ConversationParameters
    ): Promise<ConversationResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onCreateConversation(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * onGetConversations() API for Skill.
     *
     * @remarks
     * List the Conversations in which this bot has participated.
     *
     * GET from this method with a skip token
     *
     * The return value is a ConversationsResult, which contains an array of
     * ConversationMembers and a skip token.  If the skip token is not empty, then
     * there are further values to be returned. Call this method again with the
     * returned token to get more values.
     *
     * Each ConversationMembers object contains the ID of the conversation and an
     * array of ChannelAccounts that describe the members of the conversation.
     *
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _continuationToken Skip or continuation token.
     */
    protected async onGetConversations(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _continuationToken?: string
    ): Promise<ConversationsResult> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onGetConversations(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * getConversationMembers() API for Skill.
     *
     * @remarks
     * Enumerate the members of a conversation.
     *
     * This REST API takes a ConversationId and returns an array of ChannelAccount
     * objects representing the members of the conversation.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     */
    protected async onGetConversationMembers(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string
    ): Promise<ChannelAccount[]> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onGetConversationMembers(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * getConversationMember() API for Skill.
     *
     * @remarks
     * Get the account of a single conversation member.
     *
     * This REST API takes a ConversationId and UserId and returns the ChannelAccount
     * object representing the member of the conversation.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _userId User ID.
     * @param _conversationId Conversation ID.
     */
    protected async onGetConversationMember(
        _claimsIdentity: ClaimsIdentity,
        _userId: string,
        _conversationId: string
    ): Promise<ChannelAccount> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onGetConversationMember(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * getConversationPagedMembers() API for Skill.
     *
     * @remarks
     * Enumerate the members of a conversation one page at a time.
     *
     * This REST API takes a ConversationId. Optionally a pageSize and/or
     * continuationToken can be provided. It returns a PagedMembersResult, which
     * contains an array
     * of ChannelAccounts representing the members of the conversation and a
     * continuation token that can be used to get more values.
     *
     * One page of ChannelAccounts records are returned with each call. The number
     * of records in a page may vary between channels and calls. The pageSize
     * parameter can be used as
     * a suggestion. If there are no additional results the response will not
     * contain a continuation token. If there are no members in the conversation
     * the Members will be empty or not present in the response.
     *
     * A response to a request that has a continuation token from a prior request
     * may rarely return members from a previous request.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _pageSize Suggested page size.
     * @param _continuationToken Continuation Token.
     */
    protected async onGetConversationPagedMembers(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _pageSize = -1,
        _continuationToken?: string
    ): Promise<PagedMembersResult> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onGetConversationPagedMembers(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * DeleteConversationMember() API for Skill.
     *
     * @remarks
     * Deletes a member from a conversation.
     *
     * This REST API takes a ConversationId and a memberId (of type string) and
     * removes that member from the conversation. If that member was the last member
     * of the conversation, the conversation will also be deleted.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _memberId ID of the member to delete from this conversation.
     */
    protected async onDeleteConversationMember(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _memberId: string
    ): Promise<void> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onDeleteConversationMember(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * SendConversationHistory() API for Skill.
     *
     * @remarks
     * This method allows you to upload the historic activities to the
     * conversation.
     *
     * Sender must ensure that the historic activities have unique ids and
     * appropriate timestamps. The ids are used by the client to deal with
     * duplicate activities and the timestamps are used by the client to render
     * the activities in the right order.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _transcript Transcript of activities.
     */
    protected async onSendConversationHistory(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _transcript: Transcript
    ): Promise<ResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onSendConversationHistory(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * UploadAttachment() API for Skill.
     *
     * @remarks
     * Upload an attachment directly into a channel's blob storage.
     *
     * This is useful because it allows you to store data in a compliant store
     * when dealing with enterprises.
     *
     * The response is a ResourceResponse which contains an AttachmentId which is
     * suitable for using with the attachments API.
     * @param _claimsIdentity ClaimsIdentity for the bot, should have AudienceClaim, AppIdClaim and ServiceUrlClaim.
     * @param _conversationId Conversation ID.
     * @param _attachmentUpload Attachment data.
     */
    protected async onUploadAttachment(
        _claimsIdentity: ClaimsIdentity,
        _conversationId: string,
        _attachmentUpload: AttachmentData
    ): Promise<ResourceResponse> {
        throw new StatusCodeError(
            StatusCodes.NOT_IMPLEMENTED,
            `ChannelServiceHandler.onUploadAttachment(): ${StatusCodes.NOT_IMPLEMENTED}: ${
                STATUS_CODES[StatusCodes.NOT_IMPLEMENTED]
            }`
        );
    }

    /**
     * Helper to authenticate the header token and extract the claims.
     *
     * @param authHeader HTTP authorization header
     * @returns a promise resolving to the authorization header claims
     */
    protected abstract authenticate(authHeader: string): Promise<ClaimsIdentity>;
}
