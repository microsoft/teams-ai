import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { Application, OpenAIPlanner, ResponseParser } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, updateDMResponse } from "../bot";
import { normalizeItemName, searchItemList, textToItemList } from "../items";
import * as responses from "../responses";
import * as prompts from "../prompts"

export function inventoryAction(app: Application<ApplicationTurnState>, planner: OpenAIPlanner): void {
    app.ai.action('inventory', async (context, state, data: IDataEntities) => {
        const action = (data.action ?? '').toLowerCase();
        switch (action) {
            case 'update':
                return await updateList(context, state, data);
            case 'list':
                return await printList(planner, context, state);
            default:
                await context.sendActivity(`[inventory.${action}]`);
                return true;
        }
    });
}

async function updateList(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    let items = Object.assign({}, state.user.value.inventory);
    try {
        // Remove items first
        let removed: string[] = [];
        const remove = textToItemList(data.remove);
        for (const item in remove) {
            const { name, count } = normalizeItemName(item, remove[item]);
            if (name && count > 0) {
                // Search for closest match in inventory
                const key = searchItemList(name, items);
                if (key) {
                    if (count < items[key]) {
                        removed.push(`-${count}(${key})`);
                        items[key] = items[key] - count;
                    } else {
                        // Hallucinating number of items in inventory
                        removed.push(`-${items[key]}(${key})`);
                        delete items[key];
                    }
                } else {
                    // Hallucinating item as being in inventory
                    removed.push(`-${count}(${name})`);
                }
            }
        }


        // Add items next
        let added: string[] = [];
        const add = textToItemList(data.add);
        for (const item in add) {
            const { name, count } = normalizeItemName(item, add[item]);
            if (name && count > 0) {
                if (items.hasOwnProperty(name)) {
                    items[name] = items[name] + count;
                } else {
                    items[name] = count;
                }
                added.push(`+${count}(${name})`);
            }
        }

        // Report inventory changes to user
        const playerName = state.user.value.name.toLowerCase();
        if (added.length == 1 && removed.length > 0) {
            // Report combined add+remove
            await context.sendActivity(`${playerName}: ${added[0]}, ${removed.join(', ')}`);
        } else {
            // Report added items
            if (added.length > 0) {
                await context.sendActivity(`${playerName}: ${added.join(', ')}`);
            }

            // Report removed items
            if (removed.length > 0) {
                await context.sendActivity(`${playerName}: ${removed.join(', ')}`);
            }
        }

        // Save inventory changes
        state.user.value.inventory = items;
    } catch (err) {
        await updateDMResponse(context, state, responses.dataError());
        return false;
    }

    return true;
}

async function printList(planner: OpenAIPlanner, context: TurnContext, state: ApplicationTurnState): Promise<boolean> {
    const items = state.user.value.inventory;
    if (Object.keys(items).length > 0) {
        state.temp.value.listItems = items;
        state.temp.value.listType = 'inventory';
        const newResponse = await planner.prompt(context, state, prompts.listItems);
        if (newResponse) {
            const card = ResponseParser.parseAdaptiveCard(newResponse);
            if (card) {
                await context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(card)));
                state.temp.value.playerAnswered = true;
                return true;
            }
        } 

        await updateDMResponse(context, state, responses.dataError());
    } else {
        await updateDMResponse(context, state, responses.emptyInventory());
    }

    return false;
}
