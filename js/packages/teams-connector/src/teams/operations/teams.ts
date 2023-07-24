/* eslint-disable prettier/prettier */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from '@azure/ms-rest-js';
import * as Models from '../models';
import * as Mappers from '../models/teamsMappers';
import * as Parameters from '../models/parameters';
import { TeamsConnectorClientContext } from '../';
import { 
    ConversationList,
    TeamDetails,
    TeamsMeetingInfo,
    TeamsMeetingParticipant,
    TeamsMeetingNotificationRecipientFailureInfos,
    TeamsMeetingNotification
} from '../../schema';

/** Class representing a Teams. */
export class Teams {
    private readonly client: TeamsConnectorClientContext;

    /**
     * Create a Teams.
     *
     * @param {TeamsConnectorClientContext} client Reference to the service client.
     */
    constructor(client: TeamsConnectorClientContext) {
        this.client = client;
    }

    /**
     * Fetches channel list for a given team.
     *
     * @param teamId Team Id.
     * @param options Optional. The options object to be used in every request.
     * @returns A `Promise<Models.TeamsFetchChannelListResponse>`.
     */
    fetchChannelList(
        teamId: string,
        options?: msRest.RequestOptionsBase
    ): Promise<Models.TeamsFetchChannelListResponse>;
    /**
     * Fetches channel list for a given team.
     *
     * @param teamId Team Id.
     * @param callback The callback.
     */
    fetchChannelList(teamId: string, callback: msRest.ServiceCallback<ConversationList>): void;
    /**
     * Fetches channel list for a given team.
     *
     * @param teamId Team Id.
     * @param options The options object to be used in every request.
     * @param callback The callback.
     */
    fetchChannelList(
        teamId: string,
        options: msRest.RequestOptionsBase,
        callback: msRest.ServiceCallback<ConversationList>
    ): void;
    /**
     * Fetches channel list for a given team.
     *
     * @param teamId Team Id.
     * @param options Optional. The options object to be used in every request.
     * @param callback The callback.
     * @returns A `Promise<Models.TeamsFetchChannelListResponse>`.
     */
    fetchChannelList(
        teamId: string,
        options?: msRest.RequestOptionsBase | msRest.ServiceCallback<ConversationList>,
        callback?: msRest.ServiceCallback<ConversationList>
    ): Promise<Models.TeamsFetchChannelListResponse> {
        return this.client.sendOperationRequest(
            {
                teamId,
                options,
            },
            fetchChannelListOperationSpec,
            callback
        ) as Promise<Models.TeamsFetchChannelListResponse>;
    }

    /**
     * Fetches details related to a team.
     *
     * @param teamId Team Id.
     * @param options Optional. The options object to be used in every request.
     * @returns A `Promise<Models.TeamsFetchTeamDetailsResponse>`.
     */
    fetchTeamDetails(
        teamId: string,
        options?: msRest.RequestOptionsBase
    ): Promise<Models.TeamsFetchTeamDetailsResponse>;
    /**
     * Fetches details related to a team.
     *
     * @param teamId Team Id.
     * @param callback The callback.
     */
    fetchTeamDetails(teamId: string, callback: msRest.ServiceCallback<TeamDetails>): void;
    /**
     * Fetches details related to a team.
     *
     * @param teamId Team Id.
     * @param options The options object to be used in every request.
     * @param callback The callback.
     */
    fetchTeamDetails(
        teamId: string,
        options: msRest.RequestOptionsBase,
        callback: msRest.ServiceCallback<TeamDetails>
    ): void;
    /**
     * Fetches details related to a team.
     *
     * @param teamId Team Id.
     * @param options Optional. The options object to be used in every request.
     * @param callback The callback.
     * @returns A `Promise<Models.TeamsFetchTeamDetailsResponse>`.
     */
    fetchTeamDetails(
        teamId: string,
        options?: msRest.RequestOptionsBase | msRest.ServiceCallback<TeamDetails>,
        callback?: msRest.ServiceCallback<TeamDetails>
    ): Promise<Models.TeamsFetchTeamDetailsResponse> {
        return this.client.sendOperationRequest(
            {
                teamId,
                options,
            },
            fetchTeamDetailsOperationSpec,
            callback
        ) as Promise<Models.TeamsFetchTeamDetailsResponse>;
    }

    /**
     * Fetch a meeting participant
     *
     * @summary Fetches a meeting participant
     * @param meetingId Meeting Id
     * @param participantId Participant Id
     * @param [options] The optional parameters
     * @returns Promise<Models.TeamsFetchMeetingParticipantResponse>
     */
    fetchMeetingParticipant(
        meetingId: string,
        participantId: string,
        options?: Models.TeamsFetchMeetingParticipantOptionalParams
    ): Promise<Models.TeamsFetchMeetingParticipantResponse>;
    /**
     * @param meetingId Meeting Id
     * @param participantId Participant Id
     * @param callback The callback
     */
    fetchMeetingParticipant(
        meetingId: string,
        participantId: string,
        callback: msRest.ServiceCallback<TeamsMeetingParticipant>
    ): void;
    /**
     * @param meetingId Meeting Id
     * @param participantId Participant Id
     * @param options The optional parameters
     * @param callback The callback
     */
    fetchMeetingParticipant(
        meetingId: string,
        participantId: string,
        options: Models.TeamsFetchMeetingParticipantOptionalParams,
        callback: msRest.ServiceCallback<TeamsMeetingParticipant>
    ): void;
    /**
     * @param meetingId Meeting Id.
     * @param participantId Participant Id.
     * @param options The optional parameters.
     * @param callback The callback.
     * @returns Promise with TeamsFetchMeetingParticipantResponse.
     */
    fetchMeetingParticipant(
        meetingId: string,
        participantId: string,
        options?: Models.TeamsFetchMeetingParticipantOptionalParams | msRest.ServiceCallback<TeamsMeetingParticipant>,
        callback?: msRest.ServiceCallback<TeamsMeetingParticipant>
    ): Promise<Models.TeamsFetchMeetingParticipantResponse> {
        return this.client.sendOperationRequest(
            {
                meetingId,
                participantId,
                options,
            },
            fetchMeetingParticipantOperationSpec,
            callback
        ) as Promise<Models.TeamsFetchMeetingParticipantResponse>;
    }

    /**
     * Fetch meeting information.
     *
     * @summary Fetches information of a Teams meeting.
     * @param meetingId Meeting Id, encoded as a BASE64 string.
     * @param [options] The optional parameters
     * @returns Promise<Models.TeamsFetchMeetingInfoResponse>
     */
    fetchMeetingInfo(
        meetingId: string,
        options?: msRest.RequestOptionsBase | msRest.ServiceCallback<TeamDetails>
    ): Promise<Models.TeamsMeetingInfoResponse>;
    /**
     * @param meetingId Meeting Id, encoded as a BASE64 string.
     * @param callback The callback
     */
     fetchMeetingInfo(
        meetingId: string,
        callback: msRest.ServiceCallback<TeamsMeetingInfo>
    ): void;
    /**
     * @param meetingId Meeting Id, encoded as a BASE64 string.
     * @param options The optional parameters
     * @param callback The callback
     */
     fetchMeetingInfo(
        meetingId: string,
        options: msRest.RequestOptionsBase | msRest.ServiceCallback<TeamDetails>,
        callback: msRest.ServiceCallback<TeamsMeetingInfo>
    ): void;
    /**
     * @param meetingId Meeting Id.
     * @param options The optional parameters.
     * @param callback The callback.
     * @returns Promise with TeamsFetchMeetingInfoResponse.
     */
    fetchMeetingInfo(
        meetingId: string,
        options?: msRest.RequestOptionsBase | msRest.ServiceCallback<TeamDetails>,
        callback?: msRest.ServiceCallback<TeamsMeetingInfo>
    ): Promise<Models.TeamsMeetingInfoResponse> {
        return this.client.sendOperationRequest(
            {
                meetingId,
                options,
            },
            fetchMeetingInfoOperationSpec,
            callback
        ) as Promise<Models.TeamsMeetingInfoResponse>;
    }

    /**
     * Send meeting notification.
     *
     * @param meetingId Meeting Id.
     * @param notification The content and configuration for the notification to send.
     * @param options The optional parameters.
     */
    sendMeetingNotification(
        meetingId: string,
        notification: TeamsMeetingNotification,
        options?: msRest.RequestOptionsBase,
    ): Promise<Models.TeamsSendMeetingNotificationResponse>
    /**
     * @param meetingId Meeting Id.
     * @param notification The content and configuration for the notification to send.
     * @param callback The callback.
     */
    sendMeetingNotification(
        meetingId: string,
        notification: TeamsMeetingNotification,
        callback: msRest.ServiceCallback<TeamsMeetingNotificationRecipientFailureInfos | {}>
    ): void;
    /**
     * @param meetingId Meeting Id.
     * @param notification The content and configuration for the notification to send.
     * @param options The optional parameters.
     * @param callback The callback.
     */
    sendMeetingNotification(
        meetingId: string,
        notification: TeamsMeetingNotification,
        options: msRest.RequestOptionsBase,
        callback: msRest.ServiceCallback<TeamsMeetingNotificationRecipientFailureInfos | {}>
    ): void;
    /**
     * @param meetingId Meeting Id.
     * @param notification The content and configuration for the notification to send.
     * @param options The optional parameters.
     * @param callback The callback.
     * @returns Promise with either TeamsMeetingNotificationRecipientFailureInfos or an empty object.
     */
    sendMeetingNotification(
        meetingId: string,
        notification: TeamsMeetingNotification,
        options?: msRest.RequestOptionsBase,
        callback?: msRest.ServiceCallback<TeamsMeetingNotificationRecipientFailureInfos | {}>
    ): Promise<Models.TeamsSendMeetingNotificationResponse> {
        return this.client.sendOperationRequest(
            {
                meetingId,
                notification,
                options
            },
            sendMeetingNotificationOperationSpec,
            callback
        ) as Promise<Models.TeamsSendMeetingNotificationResponse>;
    }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const fetchChannelListOperationSpec: msRest.OperationSpec = {
    httpMethod: 'GET',
    path: 'v3/teams/{teamId}/conversations',
    urlParameters: [Parameters.teamId],
    responses: {
        200: {
            bodyMapper: Mappers.ConversationList,
        },
        default: {},
    },
    serializer,
};

const fetchTeamDetailsOperationSpec: msRest.OperationSpec = {
    httpMethod: 'GET',
    path: 'v3/teams/{teamId}',
    urlParameters: [Parameters.teamId],
    responses: {
        200: {
            bodyMapper: Mappers.TeamDetails,
        },
        default: {},
    },
    serializer,
};

const fetchMeetingParticipantOperationSpec: msRest.OperationSpec = {
    httpMethod: 'GET',
    path: 'v1/meetings/{meetingId}/participants/{participantId}',
    urlParameters: [Parameters.meetingId, Parameters.participantId],
    queryParameters: [Parameters.tenantId],
    responses: {
        200: {
            bodyMapper: Mappers.TeamsMeetingParticipant,
        },
        default: {},
    },
    serializer,
};

const fetchMeetingInfoOperationSpec: msRest.OperationSpec = {
    httpMethod: 'GET',
    path: 'v1/meetings/{meetingId}',
    urlParameters: [Parameters.meetingId],
    responses: {
        200: {
            bodyMapper: Mappers.TeamsMeetingInfo,
        },
        default: {},
    },
    serializer,
};

const sendMeetingNotificationOperationSpec: msRest.OperationSpec = {
    httpMethod: 'POST',
    path: 'v1/meetings/{meetingId}/notification',
    urlParameters: [Parameters.meetingId],
    requestBody: {
        parameterPath: 'notification',
        mapper: {
            ...Mappers.TeamsMeetingNotification,
            required: true
        }
    },
    responses: {
        202: {
            bodyMapper: Mappers.TeamsMeetingNotificationRecipientFailureInfos
        },
        207: {
            bodyMapper: Mappers.TeamsMeetingNotificationRecipientFailureInfos
        },
        default: {
            bodyMapper: Mappers.ErrorResponse
        }
    },
    serializer
}