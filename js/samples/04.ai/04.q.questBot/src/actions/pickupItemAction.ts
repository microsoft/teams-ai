import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function pickupItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('pickupItem', async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        const dropped = state.conversation.value.dropped ?? {};
        try {
            const { name } = normalizeItemName(data.name);
            const count = data.count == 'all' ? dropped[name] ?? 0 : parseNumber(data.count, 1);
            if (name) {
                const currentDropped = dropped[name] ?? 0;
                if (currentDropped > 0) {
                    // Remove item(s) from dropped
                    const pickupCount = count > currentDropped ? currentDropped : count;
                    dropped[name] = currentDropped - pickupCount;
    
                    // Prune dropped
                    if (dropped[name] <= 0) {
                        delete dropped[name];
                    }
    
                    // Add to inventory
                    const current = inventory[name] ?? 0;
                    inventory[name] = current + pickupCount;
    
                    // Update droppedTurn
                    state.conversation.value.droppedTurn = state.conversation.value.turn;
                    await context.sendActivity(`${state.user.value.name.toLowerCase()}: +${count}(${name})`);
                    return true;
                } else {
                    await updateDMResponse(context, state, responses.notDropped(data.name));
                    return false;
                }
            } else {
                await updateDMResponse(context, state, responses.notAllowed());
                return false;
            }
        } finally {
            state.user.value.inventory = inventory;
            state.conversation.value.dropped = dropped;
        }
    });
}