import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function sellItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('sellItem', async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        try {
            // GPT can send in both a count and price when selling gold so for price to 0
            const { name } = normalizeItemName(data.name);
            const price = name == 'gold' ? 0 : parseNumber(data.cost, 0);
            const count = data.count == 'all' ? inventory[name] ?? 0 : parseNumber(data.count, 0);
            if (name) {
                const current = inventory[name] ?? 0;
                if (current > 0) {
                    // Add price to gold
                    const gold = inventory['gold'] ?? 0;
                    inventory['gold'] = gold + price;
    
                    // Remove item(s) from inventory
                    const current = inventory[name] ?? 0;
                    inventory[name] = count > current ? current - count : 0;
    
                    // Prune inventory
                    if (inventory[name] <= 0) {
                        delete inventory[name];
                    }
                    await context.sendActivity(`${state.user.value.name.toLowerCase()}: +${price}(gold), -${count}(${name})`);
                    return true;
                } else {
                    await updateDMResponse(context, state, responses.notInInventory(name));
                    return false;
                }
            } else {
                await updateDMResponse(context, state, responses.dataError());
                return false;
            }
        } finally {
            state.user.value.inventory = inventory;
        }
    });
}