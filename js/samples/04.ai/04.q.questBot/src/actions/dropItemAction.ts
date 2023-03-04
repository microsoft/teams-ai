import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function dropItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('dropItem', async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        const dropped = state.conversation.value.dropped ?? {};
        try {
            const { name } = normalizeItemName(data.name);
            const count = data.count == 'all' ? inventory[name] ?? 0 : parseNumber(data.count, 1);
            if (name) {
                const current = inventory[name] ?? 0;
                if (current > 0) {
                    // Remove item(s) from inventory
                    const current = inventory[name] ?? 0;
                    const countDropped = count > current ? current : count;
                    inventory[name] = current - countDropped;
    
                    // Prune inventory
                    if (inventory[name] <= 0) {
                        delete inventory[name];
                    }
    
                    // Add to dropped
                    const droppedCurrent = dropped[name] ?? 0;
                    dropped[name] = droppedCurrent + countDropped;
    
                    // Update droppedTurn
                    state.conversation.value.droppedTurn = state.conversation.value.turn;
                    await context.sendActivity(`${state.user.value.name.toLowerCase()}: -${count}(${name})`);
                    return true;
                } else {
                    await updateDMResponse(context, state, responses.notInInventory(data.name));
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