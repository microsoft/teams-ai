// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, InvokeResponse } from 'botframework-schema';

export interface BotFrameworkClient {
    /**
     * Forwards an activity to a another bot.
     *
     * @param fromBotId The MicrosoftAppId of the bot sending the activity.
     * @param toBotId The MicrosoftAppId of the bot receiving the activity.
     * @param toUrl The URL of the bot receiving the activity.
     * @param serviceUrl The callback Url for the skill host.
     * @param conversationId A conversation ID to use for the conversation with the skill.
     * @param activity Activity to forward.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postActivity: <T = any>(
        fromBotId: string,
        toBotId: string,
        toUrl: string,
        serviceUrl: string,
        conversationId: string,
        activity: Activity
    ) => Promise<InvokeResponse<T>>;
}
