import { TurnContext } from 'botbuilder';
import { Application } from '@microsoft/teams-ai';
import { ApplicationTurnState, IDataEntities } from '../bot';
import { findMapLocation } from '../ShadowFalls';

/**
 * Registers the 'location' action with the given application object.
 * @param {Application<ApplicationTurnState>} app The application object to register the action with.
 */
export function locationAction(app: Application<ApplicationTurnState>): void {
    app.ai.action('location', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'change':
            case 'update':
                return await updateLocation(context, state, data);
            default:
                await context.sendActivity(`[location.${action}]`);
                return true;
        }
    });
}

/**
 * Updates the location of the conversation and sends a message to the user if the location has changed.
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {ApplicationTurnState} state The application state object for the current turn of conversation.
 * @param {IDataEntities} data The data entities extracted from the user's input.
 * @returns {Promise<boolean>} A promise that resolves to true if the location was successfully updated.
 */
async function updateLocation(
    context: TurnContext,
    state: ApplicationTurnState,
    data: IDataEntities
): Promise<boolean> {
    const conversation = state.conversation.value;
    const currentLocation = conversation.location;

    // Create new location object
    const title = (data.title ?? '').trim();
    conversation.location = {
        title: title,
        description: (data.description ?? '').trim(),
        encounterChance: getEncounterChance(title)
    };

    // Has the location changed?
    // - Ignore the change if the location hasn't changed.
    if (currentLocation?.title !== conversation.location.title) {
        conversation.locationTurn = 1;
        await context.sendActivity(
            `🧭 <strong>${conversation.location.title}</strong><br>${conversation.location.description
                .split('\n')
                .join('<br>')}`
        );
    }

    state.temp.value.playerAnswered = true;
    return true;
}

/**
 * Calculates the encounter chance for a given location title.
 * @param {string} title The title of the location.
 * @returns {number} The encounter chance for the location.
 */
function getEncounterChance(title: string): number {
    title = title.toLowerCase();
    const location = findMapLocation(title);
    if (location) {
        return location.encounterChance;
    } else if (title.includes('dungeon') || title.includes('cave')) {
        return 0.4;
    } else {
        return 0.2;
    }
}
