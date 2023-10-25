import { Activity, ActivityTypes } from 'botbuilder';

/**
 * Creates, for testing, an invoke activity with the given name, value and data.
 * Compatible with botbuilder's TestAdapter.
 * @param {string} name - The name of the invoke activity.
 * @param {any} value - The value of the invoke activity.
 * @param {any} channelData - The bot's channel data of the invoke activity.
 * @returns {Activity} - The created invoke activity.
 */
export function createTestInvoke(name: string, value: any, channelData: any = {}): Partial<Activity> {
    const activity: Partial<Activity> = {
        type: ActivityTypes.Invoke,
        name,
        channelData,
        value,
        // Not sure why, but the TestAdapter returns nothing unless this prop is set
        deliveryMode: 'expectReplies'
    };

    return activity;
}

/**
 * Creates a conversation update activity for testing.
 * Compatible with botbuilder's TestAdapter.
 * @param {any} channelData An object containing channel data
 * @returns {Partial<Activity>} A conversation update activity
 */
export function createTestConversationUpdate(channelData: any = {}): Partial<Activity> {
    const activity: Partial<Activity> = {
        type: ActivityTypes.ConversationUpdate,
        channelData
    };
    return activity;
}
