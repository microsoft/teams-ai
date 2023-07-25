/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Activity,
    ChannelAccount,
    ChannelInfo,
    ConversationList,
    TeamsChannelAccount,
    TeamsChannelData,
    TeamDetails,
    PagedMembersResult,
    TeamsPagedMembersResult,
    ConversationParameters,
    ConversationReference,
    TeamsMeetingParticipant,
    TeamsMeetingInfo,
    Channels,
    TeamsMeetingNotification,
    TeamsMeetingNotificationRecipientFailureInfos,
} from '@microsoft/teams-connector/src/schema';
import { ConnectorClient, TeamsConnectorClient, TeamsConnectorModels } from '@microsoft/teams-connector';

import { BotFrameworkAdapter } from './botFrameworkAdapter';
import { CloudAdapter } from './cloudAdapter';
import { teamsGetTeamMeetingInfo, teamsGetTenant } from './teamsActivityHelpers';
import { TurnContext } from './turnContext';

/**
 * Provides utility methods for the events and interactions that occur within Microsoft Teams.
 */
export class TeamsInfo {
    /**
     * Gets the meeting participant for the given meeting id and participant id. This only works in
     * teams scoped meeting conversations.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param meetingId The meeting ID to fetch
     * @param participantId The participant ID to fetch
     * @param tenantId The tenant ID to use when scoping the request
     * @returns The [TeamsMeetingParticipant](xref:botbuilder-core.TeamsMeetingParticipant) fetched
     */
    static async getMeetingParticipant(
        context: TurnContext,
        meetingId?: string,
        participantId?: string,
        tenantId?: string
    ): Promise<TeamsMeetingParticipant> {
        if (!context) {
            throw new Error('context is required.');
        }

        const activity = context.activity;

        if (meetingId == null) {
            const meeting = teamsGetTeamMeetingInfo(activity);
            meetingId = meeting?.id;
        }

        if (!meetingId) {
            throw new Error('meetingId is required.');
        }

        if (participantId == null) {
            const from = activity.from;
            participantId = from?.aadObjectId;
        }

        if (!participantId) {
            throw new Error('participantId is required.');
        }

        // Note: === undefined here because tenant ID is technically an optional parameter. If a user specifically
        // wants to disable defaulting of tenant ID they can pass `null`.
        if (tenantId === undefined) {
            const tenant = teamsGetTenant(activity);
            tenantId = tenant?.id;
        }

        return this.getTeamsConnectorClient(context).teams.fetchMeetingParticipant(meetingId, participantId, {
            tenantId,
        });
    }

    /**
     * Gets the information for the given meeting id.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param meetingId The BASE64-encoded id of the Teams meeting.
     * @returns The [TeamsMeetingInfo](xref:botbuilder-core.TeamsMeetingInfo) fetched
     */
    static async getMeetingInfo(context: TurnContext, meetingId?: string): Promise<TeamsMeetingInfo> {
        if (!context) {
            throw new Error('context is required.');
        }

        const activity = context.activity;

        if (meetingId == null) {
            const meeting = teamsGetTeamMeetingInfo(activity);
            meetingId = meeting?.id;
        }

        if (!meetingId) {
            throw new Error('meetingId or TurnContext containing meetingId is required.');
        }

        return this.getTeamsConnectorClient(context).teams.fetchMeetingInfo(meetingId);
    }

    /**
     * Gets the details for the given team id. This only works in teams scoped conversations.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param teamId The id of the Teams team.
     * @returns The [TeamDetails](xref:botbuilder-core.TeamDetails) fetched
     */
    static async getTeamDetails(context: TurnContext, teamId?: string): Promise<TeamDetails> {
        const t = teamId || this.getTeamId(context);
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }

        return await this.getTeamsConnectorClient(context).teams.fetchTeamDetails(t);
    }

    /**
     * Creates a new thread in a Teams chat and sends an [Activity](xref:botframework-schema.Activity) to that new thread.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param activity The [Activity](xref:botframework-schema.Activity) to send.
     * @param teamsChannelId The Team's Channel ID, note this is distinct from the Bot Framework activity property with same name.
     * @param botAppId The bot's appId. This is only used when context.adapter is an instance of CloudAdapter.
     * @returns The [ConversationReference](xref:botframework-schema.ConversationReference) and the id of the [Activity](xref:botframework-schema.Activity) (if sent).
     */
    static async sendMessageToTeamsChannel(
        context: TurnContext,
        activity: Activity,
        teamsChannelId: string,
        botAppId?: string
    ): Promise<[ConversationReference, string]> {
        if (!context) {
            throw new Error('TurnContext cannot be null');
        }

        if (!activity) {
            throw new Error('Activity cannot be null');
        }

        if (!teamsChannelId || !teamsChannelId) {
            throw new Error('The teamsChannelId cannot be null or empty');
        }

        const convoParams = {
            isGroup: true,
            channelData: {
                channel: {
                    id: teamsChannelId,
                },
            },
            activity: activity,
        } as ConversationParameters;

        let conversationReference: Partial<ConversationReference>;
        let newActivityId: string;

        if (botAppId && context.adapter instanceof CloudAdapter) {
            await context.adapter.createConversationAsync(
                botAppId,
                Channels.Msteams,
                context.activity.serviceUrl,
                null as any,
                convoParams,
                async (turnContext) => {
                    conversationReference = TurnContext.getConversationReference(turnContext.activity);
                    newActivityId = turnContext.activity.id!;
                }
            );
        } else {
            const connectorClient = (context.adapter as BotFrameworkAdapter).createConnectorClient(
                context.activity.serviceUrl
            );
            const conversationResourceResponse = await connectorClient.conversations.createConversation(convoParams);
            conversationReference = TurnContext.getConversationReference(context.activity);
            conversationReference.conversation!.id = conversationResourceResponse.id;
            newActivityId = conversationResourceResponse.activityId;
        }

        return [conversationReference! as ConversationReference, newActivityId!];
    }

    /**
     * Returns a list of channels in a Team. This only works in teams scoped conversations.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param teamId ID of the Teams team.
     * @returns The list of [ChannelInfo](xref:botframework-schema.ChannelInfo) objects with the conversations.
     */
    static async getTeamChannels(context: TurnContext, teamId?: string): Promise<ChannelInfo[]> {
        const t = teamId || this.getTeamId(context);
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }

        const channelList: ConversationList = await this.getTeamsConnectorClient(context).teams.fetchChannelList(t);
        return channelList.conversations!;
    }

    /**
     * Gets the conversation members of a one-on-one or group chat.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @returns The list of [TeamsChannelAccount](xref:botframework-schema.TeamsChannelAccount).
     *
     * @deprecated Use `getPagedTeamMembers` instead.
     */
    static async getMembers(context: TurnContext): Promise<TeamsChannelAccount[]> {
        const teamId = this.getTeamId(context);
        if (teamId) {
            return await this.getTeamMembers(context, teamId);
        } else {
            const conversation = context.activity.conversation;
            const conversationId = conversation && conversation.id ? conversation.id : undefined;
            return await this.getMembersInternal(this.getConnectorClient(context), conversationId!);
        }
    }

    /**
     * Gets a pagined list of members of one-on-one, group, or team conversation.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param pageSize Suggested number of entries on a page.
     * @param continuationToken A continuation token.
     * @returns The [TeamsPagedMembersResult](xref:botframework-schema.TeamsPagedMembersResult) with the list of members.
     */
    static async getPagedMembers(
        context: TurnContext,
        pageSize?: number,
        continuationToken?: string
    ): Promise<TeamsPagedMembersResult> {
        const teamId = this.getTeamId(context);
        const options: TeamsConnectorModels.ConversationsGetConversationPagedMembersOptionalParams = {
            continuationToken: continuationToken!,
            pageSize: pageSize!,
        };
        if (teamId) {
            return await this.getPagedTeamMembers(context, teamId, pageSize, continuationToken);
        } else {
            const conversation = context.activity.conversation;
            const conversationId = conversation && conversation.id ? conversation.id : undefined;
            return await this.getPagedMembersInternal(this.getConnectorClient(context), conversationId!, options);
        }
    }

    /**
     * Gets the account of a single conversation member.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param userId ID of the user in question.
     * @returns The [TeamsChannelAccount](xref:botframework-schema.TeamsChannelAccount) of the member.
     */
    static async getMember(context: TurnContext, userId: string): Promise<TeamsChannelAccount> {
        const teamId = this.getTeamId(context);
        if (teamId) {
            return await this.getTeamMember(context, teamId, userId);
        } else {
            const conversation = context.activity.conversation;
            const conversationId = conversation && conversation.id ? conversation.id : undefined;
            return await this.getMemberInternal(this.getConnectorClient(context), conversationId!, userId);
        }
    }

    /**
     * Gets the list of [TeamsChannelAccount](xref:botframework-schema.TeamsChannelAccount) within a team.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param teamId ID of the Teams team.
     * @returns The list of [TeamsChannelAccount](xref:botframework-schema.TeamsChannelAccount) of the members.
     *
     * @deprecated Use `getPagedTeamMembers` instead.
     */
    static async getTeamMembers(context: TurnContext, teamId?: string): Promise<TeamsChannelAccount[]> {
        const t = teamId || this.getTeamId(context);
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }
        return await this.getMembersInternal(this.getConnectorClient(context), t);
    }

    /**
     * Gets a paginated list of members of a team.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param teamId ID of the Teams team.
     * @param pageSize The number of entries on the page.
     * @param continuationToken The continuationToken token.
     * @returns A [TeamsPagedMembersResult](xref:botframework-schema.TeamsPagedMembersResult) with the list of members.
     */
    static async getPagedTeamMembers(
        context: TurnContext,
        teamId?: string,
        pageSize?: number,
        continuationToken?: string
    ): Promise<TeamsPagedMembersResult> {
        const t = teamId || this.getTeamId(context);
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }

        const options: TeamsConnectorModels.ConversationsGetConversationPagedMembersOptionalParams = {
            continuationToken: continuationToken!,
            pageSize: pageSize!,
        };
        return await this.getPagedMembersInternal(this.getConnectorClient(context), t, options);
    }

    /**
     * Gets the account of a member in a teams scoped conversation.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param teamId ID of the Teams team.
     * @param userId ID of the Teams user.
     * @returns The [TeamsChannelAccount](xref:botframework-schema.TeamsChannelAccount) of the member.
     */
    static async getTeamMember(context: TurnContext, teamId?: string, userId?: string): Promise<TeamsChannelAccount> {
        const t = teamId || this.getTeamId(context);
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }
        return await this.getMemberInternal(this.getConnectorClient(context), t, userId!);
    }

    /**
     * Sends a meeting notification to specific users in a Teams meeting.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param notification The meeting notification payload.
     * @param meetingId Id of the Teams meeting.
     * @returns Promise with either an empty object if notifications were successfully sent to all recipients or
     * [TeamsMeetingNotificationRecipientFailureInfos](xref:botframework-schema.TeamsMeetingNotificationRecipientFailureInfos) if notifications
     * were sent to some but not all recipients.
     */
    static async sendMeetingNotification(
        context: TurnContext,
        notification: TeamsMeetingNotification,
        meetingId?: string
    ): Promise<TeamsMeetingNotificationRecipientFailureInfos | {}> {
        const activity = context.activity;

        if (meetingId == null) {
            const meeting = teamsGetTeamMeetingInfo(activity);
            meetingId = meeting?.id;
        }

        if (!meetingId) {
            throw new Error('meetingId is required.');
        }

        return await this.getTeamsConnectorClient(context).teams.sendMeetingNotification(meetingId, notification);
    }

    /**
     * @private
     */
    private static async getMembersInternal(
        connectorClient: ConnectorClient,
        conversationId: string
    ): Promise<TeamsChannelAccount[]> {
        if (!conversationId) {
            throw new Error('The getMembers operation needs a valid conversationId.');
        }

        const teamMembers: ChannelAccount[] = await connectorClient.conversations.getConversationMembers(
            conversationId
        );
        teamMembers.forEach((member): void => {
            member.aadObjectId = (member as any).objectId;
        });

        return teamMembers as TeamsChannelAccount[];
    }

    /**
     * @private
     */
    private static async getPagedMembersInternal(
        connectorClient: ConnectorClient,
        conversationId: string,
        options: TeamsConnectorModels.ConversationsGetConversationPagedMembersOptionalParams
    ): Promise<TeamsPagedMembersResult> {
        if (!conversationId) {
            throw new Error('The getPagedMembers operation needs a valid conversationId.');
        }

        const pagedMembersResult: PagedMembersResult = await connectorClient.conversations.getConversationPagedMembers(
            conversationId,
            options
        );

        const teamsPagedMembersResult: TeamsPagedMembersResult = {
            continuationToken: pagedMembersResult.continuationToken,
            members: pagedMembersResult.members as TeamsChannelAccount[],
        };

        return teamsPagedMembersResult;
    }

    /**
     * @private
     */
    private static async getMemberInternal(
        connectorClient: ConnectorClient,
        conversationId: string,
        userId: string
    ): Promise<TeamsChannelAccount> {
        if (!conversationId) {
            throw new Error('The getMember operation needs a valid conversationId.');
        }

        if (!userId) {
            throw new Error('The getMember operation needs a valid userId.');
        }

        const teamMember: ChannelAccount = await connectorClient.conversations.getConversationMember(
            conversationId,
            userId
        );

        return teamMember as TeamsChannelAccount;
    }

    /**
     * @private
     */
    private static getTeamId(context: TurnContext): string {
        if (!context) {
            throw new Error('Missing context parameter');
        }

        if (!context.activity) {
            throw new Error('Missing activity on context');
        }

        const channelData = context.activity.channelData as TeamsChannelData;
        const team = channelData && channelData.team ? channelData.team : undefined;
        const teamId = team && typeof team.id === 'string' ? team.id : undefined;
        return teamId!;
    }

    /**
     * @private
     */
    private static getConnectorClient(context: TurnContext): ConnectorClient {
        const client =
            context.adapter && 'createConnectorClient' in context.adapter
                ? (context.adapter as BotFrameworkAdapter).createConnectorClient(context.activity.serviceUrl)
                : context.turnState?.get<ConnectorClient>(context.adapter.ConnectorClientKey);
        if (!client) {
            throw new Error('This method requires a connector client.');
        }

        return client;
    }

    /**
     * @private
     */
    private static getTeamsConnectorClient(context: TurnContext): TeamsConnectorClient {
        const connectorClient = this.getConnectorClient(context);
        return new TeamsConnectorClient(connectorClient.credentials, { baseUri: context.activity.serviceUrl });
    }
}
