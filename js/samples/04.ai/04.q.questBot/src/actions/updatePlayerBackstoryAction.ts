import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, updateDMResponse } from "../bot";
import * as prompts from '../prompts';
import * as responses from '../responses';

export function updatePlayerBackstoryAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('updatePlayerBackstory', async (context, state, data: IDataEntities) => {
        const update = data.update ?? '';
        if (update.length > 0 && update != '<update>') {
            state.temp.value.update = update;
            const backstory = await predictionEngine.prompt(context, state, prompts.updateBackstory);
            if (backstory) {
                // Save updated backstory
                state.user.value.backstory = backstory;
            } else {
                await updateDMResponse(context, state, responses.dataError());
            }
        }
        
        return true;
    });
}