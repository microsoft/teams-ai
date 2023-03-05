import { TurnContext } from "botbuilder";
import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, ILocation } from "../bot";
import { findMapLocation } from "../ShadowFalls";

export function locationAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('location', async (context, state, data: IDataEntities) => {
        const action = (data.action ?? '').toLowerCase();
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

async function updateLocation(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
        const conversation = state.conversation.value;

        // Create new location
        const title =  (data.title ?? '').trim();
        const location: ILocation = {
            title: title,
            description: (data.description ?? '').trim(),
            encounterChance: getEncounterChance(title)
        }

        // Reset location turn
        if (!conversation.location || location.title != conversation.location.title) {
            conversation.locationTurn = 1;
        }

        // Save updated location to conversation
        conversation.location = location;

        // Tell use the location has changed
        await context.sendActivity(`🧭 <b>${location.title}</b><br>${location.description.split('\n').join('<br>')}`);
        state.temp.value.playerAnswered = true;
        
        return true;
}


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