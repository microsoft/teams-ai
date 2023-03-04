import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function consumeItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('consumeItem', async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        try {
            const { name } = normalizeItemName(data.name);
            const count = data.count == 'all' ? inventory[name] ?? 0 : parseNumber(data.count, 1);
            if (name) {
                const current = inventory[name] ?? 0;
                if (current >= count) {
                    // Remove item(s) from inventory
                    inventory[name] = current - count;
    
                    // Prune inventory
                    if (inventory[name] <= 0) {
                        delete inventory[name];
                    }
    
                    await context.sendActivity(`${state.user.value.name.toLowerCase()}: -${count}(${name})`);
                    return true;
                } else {
                    await updateDMResponse(context, state, responses.notEnoughItems(data.name));
                    return false;
                }
            } else {
                // Just let the story continue
                return true;
            }
        } finally {
            state.user.value.inventory = inventory;
        }
    });
}