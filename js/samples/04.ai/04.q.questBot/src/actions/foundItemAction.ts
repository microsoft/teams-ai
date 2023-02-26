import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { normalizeItemName } from "../items";
import * as responses from '../responses';

export function foundItemAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action(['foundItem', 'takeItem'], async (context, state, data: IDataEntities) => {
        const inventory = state.user.value.inventory ?? {};
        try {
            const { name, count } = normalizeItemName(data.name, parseNumber(data.count, 1));
            if (name) {
                // Add item(s) to inventory
                const current = inventory[name] ?? 0;
                inventory[name] = current + count;
                await context.sendActivity(`${state.user.value.name}: ${name} +${count}`);
                return true;
            } else {
                await updateDMResponse(context, state, responses.dataError(), true);
                return false;
            }
        } finally {
            state.user.value.inventory = inventory;
        }
    });
}