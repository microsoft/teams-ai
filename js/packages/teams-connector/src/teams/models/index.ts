/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpResponse, ServiceClientOptions, RequestOptionsBase } from '@azure/ms-rest-js';
import {
    ConversationList,
    TeamDetails,
    TeamsMeetingInfo,
    TeamsMeetingNotificationRecipientFailureInfos,
    TeamsMeetingParticipant,
} from '../../schema';

/**
 * @interface
 * An interface representing TeamsConnectorClientOptions.
 * @extends ServiceClientOptions
 */
export interface TeamsConnectorClientOptions extends ServiceClientOptions {
    /**
     * @member {string} [baseUri]
     */
    baseUri?: string;
}

/**
 * Contains response data for the fetchChannelList operation.
 */
export type TeamsFetchChannelListResponse = ConversationList & {
    /**
     * The underlying HTTP response.
     */
    _response: HttpResponse & {
        /**
         * The response body as text (string format)
         */
        bodyAsText: string;
        /**
         * The response body as parsed JSON or XML
         */
        parsedBody: ConversationList;
    };
};

/**
 * Contains response data for the fetchTeamDetails operation.
 */
export type TeamsFetchTeamDetailsResponse = TeamDetails & {
    /**
     * The underlying HTTP response.
     */
    _response: HttpResponse & {
        /**
         * The response body as text (string format)
         */
        bodyAsText: string;
        /**
         * The response body as parsed JSON or XML
         */
        parsedBody: TeamDetails;
    };
};

export interface ConversationsGetConversationPagedMembersOptionalParams extends RequestOptionsBase {
    /**
     * Suggested page size
     */
    pageSize: number;
    /**
     * Continuation Token
     */
    continuationToken: string;
}

/**
 * Contains response data for the fetchMeetingParticipant operation.
 */
export type TeamsFetchMeetingParticipantResponse = TeamsMeetingParticipant & {
    /**
     * The underlying HTTP response.
     */
    _response: HttpResponse & {
        /**
         * The response body as text (string format)
         */
        bodyAsText: string;
        /**
         * The response body as parsed JSON or XML
         */
        parsedBody: TeamsMeetingParticipant;
    };
};

/**
 * @interface
 * An interface representing TeamsFetchMeetingParticipantOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface TeamsFetchMeetingParticipantOptionalParams extends RequestOptionsBase {
    /**
     * @member {string} [tenantId]
     */
    tenantId?: string;
}

/**
 * Contains response data for the fetchMeetingInfo operation.
 */
export type TeamsMeetingInfoResponse = TeamsMeetingInfo & {
    /**
     * The underlying HTTP response.
     */
    _response: HttpResponse & {
        /**
         * The response body as text (string format)
         */
        bodyAsText: string;
        /**
         * The response body as parsed JSON or XML
         */
        parsedBody: TeamsMeetingParticipant;
    };
};

/**
 * Contains response data for the sendMeetingNotification operation.
 */
export type TeamsSendMeetingNotificationResponse = TeamsMeetingNotificationRecipientFailureInfos & {
    /**
     * The underlying HTTP response.
     */
    _response: HttpResponse & {
        /**
         * The response body as text (string format)
         */
        bodyAsText: string;
        /**
         * The response body as parsed JSON or XML
         */
        parsedBody: TeamsMeetingNotificationRecipientFailureInfos | {};
    };
};
