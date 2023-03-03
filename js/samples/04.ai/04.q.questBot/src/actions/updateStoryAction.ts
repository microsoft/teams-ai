import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function updateStoryAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('updateStory', async (context, state, data: IDataEntities) => {
        const update = data.update ?? '';
        if (update.length > 0) {
            // Write story change to conversation state
            state.conversation.value.story = update;
        }
        
        return true;
    });
}