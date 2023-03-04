import { Application, ConversationHistory, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, titleCase } from "../bot";
import { findMapLocation } from "../ShadowFalls";

export function changeLocationAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('changeLocation', async (context, state, data: IDataEntities) => {
        // Lookup new location
        let newLocation = findMapLocation(data.name ?? '');
    
        // Dynamically create the location if it doesn't exist
        let isDynamic = false;
        const name = data.name 
        const description = data.description ?? name;
        if (!newLocation) {
            isDynamic = true;
            state.temp.value.newLocationName = name;
            state.temp.value.newLocationDescription = description;
            newLocation = {
                id: data.location,
                name: name,
                description: description,
                details: description,
                mapPaths: '',
                prompt: 'prompt.txt',
                encounterChance: getEncounterChance(name)
            };
        }
    
        // Update state to point to new location
        const conversation = state.conversation.value;
        conversation.dropped = {};
        conversation.droppedTurn = 0;
        conversation.locationTurn = 1;
        conversation.locationId = newLocation.id;
        conversation.dynamicLocation = isDynamic ? newLocation : undefined;
    
        // Describe new location to player
        const details = (data.description ?? newLocation.details).trim();
        await context.sendActivity(`<b>${name}</b><br>${details.split('\n').join('<br>')}`);

        // Prepend details to conversation history
        const lastLine = ConversationHistory.getLastLine(state);
        if (lastLine.startsWith('DM:')) {
            ConversationHistory.replaceLastLine(state, `DM: ${details} ${lastLine.substring(4).trim()}`);
        } else {
            ConversationHistory.addLine(state, `DM: ${details}`);
        }
    
        return true;
    });
}

function getEncounterChance(name: string): number {
    name = name.toLowerCase();
    if (name.includes('dungeon') || name.includes('cave')) {
        return 0.4;
    } else {
        return 0.2;
    }
}