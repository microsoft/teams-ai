import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function craftItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('craftItem', async (context, state, data: IDataEntities) => {
        const { name } = normalizeItemName(data.name);
        const count = parseNumber(data.count, 1);
        const resources = (data.resources ?? '').split(',');
        if (name) {
            // Consume resources
            let changeList = '';
            const inventory = Object.assign({}, state.user.value.inventory);
            for (let i = 0; i < resources.length; i++) {
                const parts = resources[i].split(':');
                if (parts.length == 2) {
                    const resource = normalizeItemName(parts[0]);
                    const cost = parseNumber(parts[1], 1);
                    const have = inventory[resource.name] ?? 0;
                    if (have >= cost) {
                        // Remove item(s) from inventory
                        inventory[resource.name] = have - cost;
        
                        // Prune inventory
                        if (inventory[resource.name] <= 0) {
                            delete inventory[resource.name];
                        }
        
                        if (changeList.length > 0) {
                            changeList += ', ';
                        }

                        changeList += `-${cost}(${resource.name})`;
                    } else {
                        await updateDMResponse(context, state, responses.notEnoughItems(resource.name));
                        return false;
                    }
                }
            }

            // Add crafted item(s) to inventory
            const current = inventory[name] ?? 0;
            inventory[name] = current + count;
            state.user.value.inventory = inventory;

            await context.sendActivity(`${state.user.value.name.toLowerCase()}: +${count}(${name}), ${changeList}`);
            return true;
        } else {
            await updateDMResponse(context, state, responses.notAllowed());
            return false;
        }
    });
}