import { TurnContext } from 'botbuilder';
import { Application } from '@microsoft/botbuilder-m365';
import { ApplicationTurnState, IDataEntities } from '../bot';
import { findMapLocation } from '../ShadowFalls';

/**
 * @param app
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
 * @param context
 * @param state
 * @param data
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
 * @param title
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
