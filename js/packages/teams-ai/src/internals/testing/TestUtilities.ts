import { Activity, ActivityTypes, TestAdapter, TurnContext } from 'botbuilder';
import { TeamsAdapter } from '../../TeamsAdapter';
import { TurnState } from '../../TurnState';

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

/**
 * Returns turn context and state for testing.
 * @remarks Compatible with botbuilder's TestAdapter and TeamsAdapter. Use _ on import if either value is not needed. For example, `const [context, _] = createTestTurnContextAndState(...)`.
 * @param {TeamsAdapter | TestAdapter} adapter - The adapter to use for the turn context
 * @param {Partial<Activity>} activity - The activity to use for the turn context
 * @returns {[TurnContext, TurnState]} - The created turn context and state.
 */
export const createTestTurnContextAndState = async (
    adapter: TeamsAdapter | TestAdapter,
    activity: Partial<Activity>
): Promise<[TurnContext, TurnState]> => {
    const context = new TurnContext(adapter, {
        channelId: 'msteams',
        recipient: { id: 'bot', name: 'Bot' },
        from: { id: 'user', name: 'User' },
        conversation: {
            id: 'convo',
            isGroup: false,
            conversationType: 'personal',
            name: 'convo'
        },
        ...activity
    });

    const state = new TurnState();
    await state.load(context);
    state.temp = {
        input: '',
        inputFiles: [],
        lastOutput: '',
        actionOutputs: {},
        authTokens: {}
    };

    return [context, state];
};
