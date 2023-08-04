/* eslint-disable security/detect-object-injection */
import { CardFactory, MessageFactory, TurnContext } from 'botbuilder';
import { Application, ResponseParser } from '@microsoft/teams-ai';
import { ApplicationTurnState, IDataEntities, updateDMResponse } from '../bot';
import { normalizeItemName, searchItemList, textToItemList } from '../items';
import * as responses from '../responses';

/**
 * Adds inventory actions to the given application.
 * @param {Application<ApplicationTurnState>} app The application to add the actions to.
 */
export function inventoryAction(app: Application<ApplicationTurnState>): void {
    app.ai.action('inventory', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const operation = (data.operation ?? '').toLowerCase();
        switch (operation) {
            case 'update':
                return await updateList(context, state, data);
            case 'list':
                return await printList(app, context, state);
            default:
                await context.sendActivity(`[inventory.${operation}]`);
                return true;
        }
    });
}
/**
 * Updates the user's inventory based on the given data.
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {ApplicationTurnState} state The state object for the current turn of conversation.
 * @param {IDataEntities} data The data entities for the current turn of conversation.
 * @returns {Promise<boolean>} A promise that resolves to true if the inventory was updated successfully, or false otherwise.
 */
async function updateList(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const items = Object.assign({}, state.user.value.inventory);
    try {
        // Remove items first
        const changes: string[] = [];
        const remove = textToItemList(data.items);
        for (const item in remove) {
            // Normalize the items name and count
            // - This converts 'coins:1' to 'gold:10'
            const { name, count } = normalizeItemName(item, remove[item]);
            if (!name) {
                continue;
            }

            if (count > 0) {
                // Add the item
                if (Object.prototype.hasOwnProperty.call(items, name)) {
                    items[name] = items[name] + count;
                } else {
                    items[name] = count;
                }
                changes.push(`+${count}(${name})`);
            } else if (count < 0) {
                // remove the item
                const key = searchItemList(name, items);
                if (key) {
                    if (count < items[key]) {
                        changes.push(`-${count}(${key})`);
                        items[key] = items[key] - count;
                    } else {
                        // Hallucinating number of items in inventory
                        changes.push(`-${items[key]}(${key})`);
                        delete items[key];
                    }
                } else {
                    // Hallucinating item as being in inventory
                    changes.push(`-${count}(${name})`);
                }
            }
        }

        // Report inventory changes to user
        const playerName = state.user.value.name.toLowerCase();
        await context.sendActivity(`${playerName}: ${changes.join(', ')}`);

        // Save inventory changes
        state.user.value.inventory = items;
    } catch (err) {
        await updateDMResponse(context, state, responses.dataError());
        return false;
    }

    return true;
}

/**
 * Prints the user's inventory to the conversation.
 * @param {Application<ApplicationTurnState>} app The application object for the current turn of conversation.
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {ApplicationTurnState} state The state object for the current turn of conversation.
 * @returns {Promise<boolean>} A promise that resolves to true if the inventory was printed successfully, or false otherwise.
 */
async function printList(
    app: Application<ApplicationTurnState>,
    context: TurnContext,
    state: ApplicationTurnState
): Promise<boolean> {
    const items = state.user.value.inventory;
    if (Object.keys(items).length > 0) {
        state.temp.value.listItems = items;
        state.temp.value.listType = 'inventory';
        const newResponse = await app.ai.completePrompt(context, state, 'listItems');
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
