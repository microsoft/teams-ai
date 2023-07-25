/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, TeamInfo, TeamsChannelData, TeamsMeetingInfo, TenantInfo } from '@microsoft/teams-connector/src/schema';

function isTeamsChannelData(channelData: unknown): channelData is TeamsChannelData {
    return typeof channelData === 'object';
}

function validateActivity(activity: Partial<Activity>): void {
    if (!activity) {
        throw new Error('Missing activity parameter');
    }
}

/**
 * Gets the Team's selected channel id from the current activity.
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current activity's team's selected channel, or empty string.
 */
export function teamsGetSelectedChannelId(activity: Activity): string {
    validateActivity(activity);

    return activity.channelData?.settings?.selectedChannel?.id ?? '';
}

/**
 * Gets the TeamsMeetingInfo object from the current [Activity](xref:botframework-schema.Activity).
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current [Activity](xref:botframework-schema.Activity)'s team meeting info, or null.
 */
export function teamsGetTeamMeetingInfo(activity: Activity): TeamsMeetingInfo | null {
    validateActivity(activity);

    if (isTeamsChannelData(activity.channelData)) {
        return activity.channelData.meeting || null;
    }

    return null;
}

/**
 * Gets the TenantInfo object from the current [Activity](xref:botframework-schema.Activity).
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current [Activity](xref:botframework-schema.Activity)'s tenant info, or null.
 */
export function teamsGetTenant(activity: Activity): TenantInfo | null {
    validateActivity(activity);

    if (isTeamsChannelData(activity.channelData)) {
        return activity.channelData.tenant || null;
    }

    return null;
}

/**
 * Gets the TeamsInfo object from the current [Activity](xref:botframework-schema.Activity).
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current [Activity](xref:botframework-schema.Activity)'s team's info, or null.
 */
export function teamsGetTeamInfo(activity: Activity): TeamInfo | null {
    validateActivity(activity);

    const channelData = activity.channelData;
    if (isTeamsChannelData(channelData)) {
        const team = channelData.team;
        return team || null;
    }

    return null;
}

/**
 * Gets the Team Id from the current [Activity](xref:botframework-schema.Activity).
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current [Activity](xref:botframework-schema.Activity)'s team's Id, or null.
 */
export function teamsGetTeamId(activity: Activity): string | null {
    const team = teamsGetTeamInfo(activity);
    return team && team.id ? team.id : null;
}

/**
 * Activity helper methods for Teams.
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @returns The current [Activity](xref:botframework-schema.Activity)'s team's channel id, or null.
 */
export function teamsGetChannelId(activity: Activity): string | null {
    validateActivity(activity);

    const channelData = activity.channelData;
    if (isTeamsChannelData(channelData)) {
        const channel = channelData.channel;
        return channel && channel.id ? channel.id : null;
    }

    return null;
}

/**
 * Configures the current [Activity](xref:botframework-schema.Activity) to generate a notification within Teams.
 *
 * @param activity The current [Activity](xref:botframework-schema.Activity).
 * @param alertInMeeting Sent to a meeting chat, this will cause the Teams client to render it in a notification popup as well as in the chat thread.
 * @param externalResourceUrl Url to external resource. Must be included in manifest's valid domains.
 */
export function teamsNotifyUser(
    activity: Partial<Activity>,
    alertInMeeting = false,
    externalResourceUrl?: string
): void {
    validateActivity(activity);

    if (!isTeamsChannelData(activity.channelData)) {
        activity.channelData = {};
    }

    if (isTeamsChannelData(activity.channelData)) {
        activity.channelData.notification = { alert: !alertInMeeting, alertInMeeting, externalResourceUrl };
    }
}
