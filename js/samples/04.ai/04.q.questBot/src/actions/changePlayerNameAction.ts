import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, updateDMResponse } from "../bot";
import * as responses from '../responses';

export function changePlayerNameAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('changePlayerName', async (context, state, data: IDataEntities) => {
        const newName = (data.name ?? '');
        if (newName) {
            // Update players for current quest
            const conversation = state.conversation.value;
            const player = state.user.value;
            if (Array.isArray(conversation.players)) {
                const pos = conversation.players.indexOf(player.name);
                if (pos >= 0) {
                    conversation.players.splice(pos, 1);
                }
                conversation.players.push(newName)
            }
    
            player.name = newName;
            await context.sendActivity(`<b>${newName}</b>`);
            return true;
        } else {
            await updateDMResponse(context, state, responses.dataError(), true);
            return false;
        }
    });
}