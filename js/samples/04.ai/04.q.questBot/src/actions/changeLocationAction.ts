import { Application, ConversationHistory, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, describeGameState, describeItemList, describeSurroundings, IDataEntities, titleCase, updateDMResponse } from "../bot";
import { findMapLocation, map, quests } from "../ShadowFalls";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function changeLocationAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('changeLocation', async (context, state, data: IDataEntities) => {
        // Lookup new location
        let newLocation = findMapLocation(data.location ?? '');
    
        // Dynamically create the location if it doesn't exist
        let isDynamic = false;
        if (!newLocation) {
            isDynamic = true;
            const name = data.name ? data.name : titleCase(data.location);
            const description = data.description ?? name;
            state.temp.value.newLocationName = name;
            state.temp.value.newLocationDescription = description;
            const details = await predictionEngine.prompt(context, state, prompts.createLocation);
            newLocation = {
                id: data.location,
                name: name,
                description: description,
                details: details || description,
                mapPaths: '',
                prompt: 'prompt.txt',
                encounterChance: name.toLowerCase().includes('dungeon') ? 0.4 : 0.2
            };
        }
    
        // Does the current quest allow travel to this location?
        const conversation = state.conversation.value;
        const quest = quests[conversation.questIndex];
        if (isDynamic || quest.locations.indexOf(newLocation.id) >= 0) {
            // Get the current locations description
            const origin = conversation.dynamicLocation ? conversation.dynamicLocation.description : map.locations[conversation.locationId].description; 
    
            // Update state to point to new location
            conversation.dropped = {};
            conversation.droppedTurn = 0;
            conversation.locationTurn = 1;
            conversation.locationId = newLocation.id;
            conversation.dynamicLocation = isDynamic ? newLocation : undefined;
    
            // Describe new location to player
            state.temp.value.origin = origin;
            state.temp.value.location = `${newLocation.name} - ${newLocation.details}`;
            state.temp.value.surroundings = describeSurroundings(newLocation);
            state.temp.value.droppedItems = describeItemList(conversation.dropped);
            state.temp.value.gameState = describeGameState(conversation);
            await context.sendActivity(`<b>${newLocation.name}</b><br>${newLocation.details.split('\n').join('<br>')}`);

            // Prepend details to conversation history
            const lastLine = ConversationHistory.getLastLine(state);
            if (lastLine.startsWith('DM:')) {
                ConversationHistory.replaceLastLine(state, `DM: ${newLocation.details} ${lastLine.substring(4).trim()}`);
            } else {
                ConversationHistory.addLine(state, `DM: ${newLocation.details}`);
            }
        } else {
            await updateDMResponse(context, state, responses.moveBlocked());
        }
    
        return true;
    });
}