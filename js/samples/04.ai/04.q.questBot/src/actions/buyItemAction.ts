import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function buyItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('buyItem', async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        try {
            const { name, count } = normalizeItemName(data.name, parseNumber(data.count, 1));
            const cost = data.cost == 'all' ? inventory['gold'] ?? 0 : parseNumber(data.cost, 0);
            if (name) {
                const gold = inventory['gold'] ?? 0;
                if (cost <= gold) {
                    // Deduct item costs
                    inventory['gold'] = gold - cost;
    
                    // Add item(s) to inventory
                    const current = inventory[name] ?? 0;
                    inventory[name] = current + count;
                    await context.sendActivity(`${state.user.value.name.toLowerCase()}: +${count}(${name}), -${cost}(gold)`);
                    return true;
                } else {
                    await updateDMResponse(context, state, responses.notEnoughGold(gold));
                    return false;
                }
            } else {
                await updateDMResponse(context, state, responses.notAllowed());
                return false;
            }
        } finally {
            state.user.value.inventory = inventory;
        }
    });
}