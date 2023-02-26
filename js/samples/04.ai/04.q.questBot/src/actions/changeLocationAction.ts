import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, describeSurroundings, IDataEntities, titleCase, updateDMResponse } from "../bot";
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
            const name = titleCase(data.location);
            state.temp.value.newLocation = name;
            const description = await predictionEngine.prompt(context, state, prompts.createLocation);
            if (description) {
                isDynamic = true;
                newLocation = {
                    id: name.toLowerCase(),
                    name: name,
                    description: description,
                    details: description,
                    mapPaths: '',
                    prompt: 'prompt.txt'
                };
            } else {
                await updateDMResponse(context, state, responses.dataError());
                return false;
            }
        }
    
        // GPT will sometimes generate a changeLocation for the current location.
        // Ignore that and just let the story play out.
        if (newLocation.id == state.conversation.value.locationId) {
            return true;
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
            state.temp.value.location = newLocation.details;
            state.temp.value.surroundings = describeSurroundings(newLocation);
            const newResponse = await predictionEngine.prompt(context, state, prompts.newLocation);
            if (newResponse) {
                await context.sendActivity(`<b>${newLocation.name}</b>`);
                await updateDMResponse(context, state, newResponse);
            } else {
                await updateDMResponse(context, state, responses.dataError());
            }
        } else {
            await updateDMResponse(context, state, responses.moveBlocked());
        }
    
        return false;
    });
}