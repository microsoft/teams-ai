// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AI, Application, ConversationHistory, DefaultTurnState, OpenAIPredictionEngine, OpenAIPromptOptions } from 'botbuilder-m365';
import { ActivityTypes, MemoryStorage, TurnContext } from 'botbuilder';
import * as path from 'path';
import * as responses from './responses';
import { IItemList, IMapLocation, IQuest } from './interfaces';
import { map, quests } from './ShadowFalls';
import { baseDMActions, basePlayerActions, describeAction, describeMoveAction } from './actions';
import { normalizeItemName } from './items';

// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: selectMainPrompt,
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    },
    conversationHistory: {
        userPrefix: 'Player:',
        botPrefix: 'DM:',
        maxLines: 100,
        maxCharacterLength: 4000
    },
    logRequests: true
});

// Define model settings for listItems prompt.
const listItemsPromptOptions: OpenAIPromptOptions = {
    prompt: promptPath('listItems.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

// Define model settings for listItems prompt.
const newLocationPromptOptions: OpenAIPromptOptions = {
    prompt: promptPath('newLocation.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

// Strongly type the applications turn state
interface ConversationState {
    turn: number;
    questIndex: number;
    locationId: string;
    locationTurn: number;
    inventory: IItemList;
    dropped: IItemList;
    droppedTurn: number;
}

interface UserState {

}

interface TempState {
    quest: string;
    location: string;
    surroundings: string;
    gameState: string;
    dynamicExamples: string;
    dmActions: string;
    playerActions: string;
    listItems: IItemList;
    listType: string;
    origin: string;
}

type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    predictionEngine
});

// Export bots run() function
export const run = (context) => app.run(context);

app.turn('beforeTurn', async (context, state) => {
    if (context.activity.type == ActivityTypes.Message) {
        const conversation = state.conversation.value;

        // Initialize persisted game state
        let quest: IQuest;
        let location: IMapLocation;
        if (conversation.turn == undefined) {
            quest = quests[0];
            location = map.locations[quest.startLocation];
            conversation.turn = 0;
            conversation.questIndex = 0;
            conversation.locationId = location.id;
            conversation.locationTurn = 0;
            conversation.inventory = { map: 1, sword: 1, gold: 50 };
            conversation.dropped = {};
            conversation.droppedTurn = 0;
        } else {
            quest = quests[conversation.questIndex];
            location = map.locations[conversation.locationId];
        }

        // Increment game turn
        conversation.turn++;
        conversation.locationTurn++;

        // Age out dropped items
        if (conversation.droppedTurn > 0 && (conversation.turn - conversation.droppedTurn) >= 5) {
            conversation.dropped = {};
            conversation.droppedTurn = 0;
        }

        // Load temp variables for prompt use
        const temp = state.temp.value;
        temp.quest = `\tTitle: "${quest.title}"\n\tBackstory: ${quest.backstory}`;
        temp.location = location.details;
        temp.surroundings = describeSurroundings(location);
        temp.gameState = describeGameState(conversation);
        temp.dynamicExamples = describeMoveExamples(location);
        // temp.dmActions = describeDMActions(location);
        // temp.playerActions = describePlayerActions(location);
    }

    return true;
});

app.message('/reset', async (context, state) => {
    state.conversation.delete();
    await context.sendActivity(`Ok lets start this over.`);
});

app.message('/state', async (context, state) => {
    await context.sendActivity(JSON.stringify(state.conversation.value));
});

app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    const history = ConversationHistory.toString(state, 1000, `\n\n`)
    await context.sendActivity(`Tell steve to add support for a new '${action}' action...<br><br>${history}`);
    return false;
});

interface IDataEntities {
    name: string;
    cost: string;
    count: string;
    location: string;
}

app.ai.action('buyItem', async (context, state, data: IDataEntities) => {
    const inventory = state.conversation.value.inventory ?? {};
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
                await context.sendActivity(`inventory: ${name} +${count}`);
                return true;
            } else {
                await replaceDMResponse(context, state, responses.notEnoughGold(gold));
                return false;
            }
        } else {
            await replaceDMResponse(context, state, responses.dataError());
            return false;
        }
    } finally {
        state.conversation.value.inventory = inventory;
    }
});

app.ai.action('sellItem', async (context, state, data: IDataEntities) => {
    const inventory = state.conversation.value.inventory ?? {};
    try {
        const { name } = normalizeItemName(data.name);
        const price = parseNumber(data.cost, 0);
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
                await context.sendActivity(`inventory: ${name} -${count}`);
                return true;
            } else {
                await replaceDMResponse(context, state, responses.notInInventory(name));
                return false;
            }
        } else {
            await replaceDMResponse(context, state, responses.dataError());
            return false;
        }
    } finally {
        state.conversation.value.inventory = inventory;
    }
});

app.ai.action(['foundItem', 'takeItem'], async (context, state, data: IDataEntities) => {
    const inventory = state.conversation.value.inventory ?? {};
    try {
        const { name, count } = normalizeItemName(data.name, parseNumber(data.count, 1));
        if (name) {
            // Add item(s) to inventory
            const current = inventory[name] ?? 0;
            inventory[name] = current + count;
            await context.sendActivity(`inventory: ${name} +${count}`);
            return true;
        } else {
            await replaceDMResponse(context, state, responses.dataError());
            return false;
        }
    } finally {
        state.conversation.value.inventory = inventory;
    }
});

app.ai.action('dropItem', async (context, state, data: IDataEntities) => {
    const inventory = state.conversation.value.inventory ?? {};
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
                await context.sendActivity(`inventory: ${name} -${count}`);
                return true;
            } else {
                await replaceDMResponse(context, state, responses.notInInventory(data.name));
                return false;
            }
        } else {
            await replaceDMResponse(context, state, responses.dataError());
            return false;
        }
    } finally {
        state.conversation.value.inventory = inventory;
        state.conversation.value.dropped = dropped;
    }
});

app.ai.action('pickupItem', async (context, state, data: IDataEntities) => {
    const inventory = state.conversation.value.inventory ?? {};
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
                await context.sendActivity(`inventory: ${name} +${count}`);
                return true;
            } else {
                await replaceDMResponse(context, state, responses.notDropped(data.name));
                return false;
            }
        } else {
            await replaceDMResponse(context, state, responses.dataError());
            return false;
        }
    } finally {
        state.conversation.value.inventory = inventory;
        state.conversation.value.dropped = dropped;
    }
});

app.ai.action('listInventory', async (context, state) => {
    const items = state.conversation.value.inventory ?? {};
    if (Object.keys(items).length > 0) {
        state.temp.value.listItems = items;
        state.temp.value.listType = 'inventory';
        const result = await predictionEngine.prompt(context, state, listItemsPromptOptions);
        if (result?.data?.choices) {
            await replaceDMResponse(context, state, result.data.choices[0].text);
        } else {
            await replaceDMResponse(context, state, responses.dataError());
        }
    } else {
        await replaceDMResponse(context, state, responses.emptyInventory());
        return false;
    }

    return false;
});

app.ai.action('listDropped', async (context, state) => {
    const items = state.conversation.value.dropped ?? {};
    if (Object.keys(items).length > 0) {
        state.temp.value.listItems = items;
        state.temp.value.listType = 'dropped';
        const result = await predictionEngine.prompt(context, state, listItemsPromptOptions);
        if (result?.data?.choices) {
            await replaceDMResponse(context, state, result.data.choices[0].text);
        } else {
            await replaceDMResponse(context, state, responses.dataError());
        }
    } else {
        await replaceDMResponse(context, state, responses.emptyInventory());
        return false;
    }

    return false;
});

app.ai.action('changeLocation', async (context, state, data: IDataEntities) => {
    // GPT will sometimes hallucinate locations that don't exist. 
    // Ignore hallucinated locations and just let the story play out.
    const newLocation = (data.location ?? '').toLowerCase();
    if (!map.locations.hasOwnProperty(newLocation)) {
        return true;
    }

    // Does the current quest allow travel to this location?
    const conversation = state.conversation.value;
    const quest = quests[conversation.questIndex];
    if (quest.locations.indexOf(newLocation) >= 0) {
        // Update state to point to new location
        conversation.dropped = {};
        conversation.droppedTurn = 0;
        conversation.locationTurn = 1;
        conversation.locationId = newLocation;

        // Describe new location to player
        const location = map.locations[conversation.locationId];
        state.temp.value.origin = state.temp.value.location;
        state.temp.value.location = location.details;
        state.temp.value.surroundings = describeSurroundings(location);
        const result = await predictionEngine.prompt(context, state, newLocationPromptOptions);
        if (result?.data?.choices) {
            await replaceDMResponse(context, state, result.data.choices[0].text);
        } else {
            await replaceDMResponse(context, state, responses.dataError());
        }
    } else {
        await replaceDMResponse(context, state, responses.moveBlocked());
    }

    return false;
});

async function selectMainPrompt(context: TurnContext, state: ApplicationTurnState): Promise<string> {
    let prompt = 'prompt.txt';
    if (state.conversation.value.turn == 1) {
        prompt = 'startQuest.txt';
    }

    return await predictionEngine.expandPromptTemplate(context, state, promptPath(prompt)); 
}

function promptPath(name: string): string {
    return path.join(__dirname, '../src/prompts/', name);
}

function describeSurroundings(location: IMapLocation): string {
    let text = '';
    ['north', 'west', 'south', 'east', 'up', 'down'].forEach(direction => {
        if (typeof location[direction] == 'string') {
            if (text) {
                text += `\n`;
            }

            switch (direction) {
                case 'up':
                    text += `Directly above:\n`;
                    break;
                case 'down':
                    text += `Directly below:\n`;
                    break;
                default:
                    text += `To the ${direction}:\n`;
                    break;
            }

            const other = map.locations[location[direction]];

            text += `\tLocationId: "${other.id}"\n\tDescription: ${other.description}\n`;
        }
    });

    return text;
}

function describeGameState(state: ConversationState): string {
    return `\tTotalTurns: ${state.turn - 1}\n\tLocationTurns: ${state.locationTurn - 1}`
}

export function describeMoveExamples(location: IMapLocation): string {
    let text = ``;
    ['north', 'west', 'south', 'east', 'up', 'down'].forEach(direction => {
        if (location[direction]) {
            text += `Player: go ${direction}\nDM: DO changeLocation location="${location[direction]}"\n`
        } else {
            switch (direction) {
                case 'up':
                case 'down':
                    // No examples
                    break;
                default:
                    text += responses.directionNotAvailableExample(direction);
            }
        }
    });

    return text;
}

function describeDMActions(location: IMapLocation): string {
    const actions: string[] = [];
    baseDMActions.forEach(action => actions.push(describeAction(action)));
    return describeActionList(actions);
}

function describePlayerActions(location: IMapLocation): string {
    const actions: string[] = [];
    basePlayerActions.forEach(action => actions.push(describeAction(action)));
    actions.push(describeMoveAction(location));
    return describeActionList(actions);
}

function describeActionList(actions: string[]): string {
    let text = '';
    actions.forEach((entry, index) => {
        if (text) {
            text += `\n`;
        }

        text += `${index}. ${entry}`;
    });

    return text;
}

async function replaceDMResponse(context: TurnContext, state: ApplicationTurnState, response: string): Promise<void> {
    ConversationHistory.replaceLastLine(state, `DM: ${response}`);
    await context.sendActivity(response);
}

function parseNumber(text: string|undefined, minValue: number): number {
    try {
        const count = parseInt(text ?? `${minValue}`);
        return count >= minValue ? count : minValue;
    } catch (err) {
        return minValue;
    }
}