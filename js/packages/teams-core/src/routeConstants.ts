/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Constants representing the API path that immediately follows the basePath.
 * These are currently internal but we will re-evaluate making them public, in the future.
 *
 * @example
 * RouteConstants.Activities = '/v3/conversations/:conversationId/activities'.
 */
export class RouteConstants {
    /**
     * Base API path for bot conversations.
     */
    static readonly Conversations: string = '/v3/conversations';

    /**
     * API path for conversation history.
     */
    static readonly ConversationHistory: string = '/v3/conversations/:conversationId/activities/history';

    /**
     * API path for all conversation members.
     */
    static readonly ConversationMembers: string = '/v3/conversations/:conversationId/members';

    /**
     * API path for page(s) of all conversation members.
     */
    static readonly ConversationPagedMembers: string = '/v3/conversations/:conversationId/pagedmembers';

    /**
     * API path for single conversation member.
     */
    static readonly ConversationMember: string = '/v3/conversations/:conversationId/members/:memberId';

    /**
     * API path for conversation attachments.
     */
    static readonly Attachments: string = '/v3/conversations/:conversationId/attachments';

    /**
     * API path for all activities from conversation.
     */
    static readonly Activities: string = '/v3/conversations/:conversationId/activities';

    /**
     * API path for single activity from conversation.
     */
    static readonly Activity: string = '/v3/conversations/:conversationId/activities/:activityId';

    /**
     * API path for all members from activity from conversation.
     */
    static readonly ActivityMembers: string = '/v3/conversations/:conversationId/activities/:activityId/members';
}
