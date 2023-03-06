import { TurnContext } from "botbuilder";
import { Application, ConversationHistory, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, updateDMResponse } from "../bot";
import { findMapLocation } from "../ShadowFalls";
import * as prompts from '../prompts';

export function locationAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('location', async (context, state, data: IDataEntities) => {
        const action = (data.action ?? '').toLowerCase();
        switch (action) {
            case 'change':
            case 'update':
                return await updateLocation(predictionEngine, context, state, data);
            default:
                await context.sendActivity(`[location.${action}]`);
                return true;
        }
    });
}

async function updateLocation(predictionEngine: OpenAIPredictionEngine, context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
        const conversation = state.conversation.value;
        const currentLocation = conversation.location;

        // Create new location object
        const title =  (data.title ?? '').trim();
        conversation.location = {
            title: title,
            description: (data.description ?? '').trim(),
            encounterChance: getEncounterChance(title)
        }

        // Has the location changed?
        // - Ignore the change if the location hasn't changed.
        if (currentLocation?.title !== conversation.location.title) {
            conversation.locationTurn = 1;
            await context.sendActivity(`🧭 <b>${conversation.location.title}</b><br>${conversation.location.description.split('\n').join('<br>')}`);
        }
    
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