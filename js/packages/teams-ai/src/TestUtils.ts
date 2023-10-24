import { Activity, ActivityTypes } from 'botbuilder';

/**
 * Creates, for testing, an invoke activity with the given name, value and data.
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
        value
    };

    return activity;
}
