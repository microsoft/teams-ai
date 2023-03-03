import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, trimPromptResponse, updateDMResponse } from "../bot";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function useMapAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('useMap', async (context, state) => {
        // Populate map entry for dynamic locations
        const location = state.conversation.value.dynamicLocation;
        if (location) {
            state.temp.value.dynamicMapLocation = `${location.name}:\n- Details: ${location.details}\n`;
        } else {
            state.temp.value.dynamicMapLocation = '';
        }
    
        // Use the map to answer player
        let newResponse = await predictionEngine.prompt(context, state, prompts.useMap);
        if (newResponse) {
            await updateDMResponse(context, state, trimPromptResponse(newResponse).split('\n').join('<br>'));
        } else {
            await updateDMResponse(context, state, responses.dataError());
        }
        return false;
    });
}