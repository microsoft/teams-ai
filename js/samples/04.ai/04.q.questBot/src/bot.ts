// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AI, Application, ConversationHistory, DefaultTurnState, OpenAIPredictionEngine } from 'botbuilder-m365';
import { ActivityTypes, TurnContext } from 'botbuilder';
import * as responses from './responses';
import { IItemList, IMapLocation } from './interfaces';
import { map, quests } from './ShadowFalls';
import * as prompts from './prompts';
import { addActions } from './actions';
import { LastWriterWinsStore } from './LastWriterWinsStore';
import { describeConditions, describeSeason, describeTimeOfDay, generateTemperature, generateWeather } from './conditions';

// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: selectMainPrompt,
    promptConfig: prompts.prompt.promptConfig,
    conversationHistory: {
        userPrefix: 'Player: ',
        botPrefix: 'DM: ',
        maxLines: 2,
        maxCharacterLength: 2000,
        includeDoCommands: false
    },
    logRequests: true
});

// Strongly type the applications turn state
export interface ConversationState {
    inQuest: boolean;
    turn: number;
    questIndex: number;
    locationId: string;
    locationTurn: number;
    dropped: IItemList;
    droppedTurn: number;
    players: string[];
    dynamicLocation: IMapLocation;
    time: number;
    day: number;
    temperature: string;
    weather: string;
    story: string;
    nextEncounterTurn: number;
}

export interface UserState {
    name: string;
    backstory: string;
    inventory: IItemList;
}

export interface TempState {
    quest: string;
    location: string;
    mapPaths: string;
    surroundings: string;
    gameState: string;
    dynamicExamples: string;
    listItems: IItemList;
    listType: string;
    origin: string;
    newLocationName: string;
    newLocationDescription: string;
    dynamicMapLocation: string;
    timeOfDay: string;
    season: string;
    promptInstructions: string;
    conversation: string;
    playerInfo: string;
    droppedItems: string;
    conditions: string;
    playerUtterance: string;
    update: string;
}

export interface IDataEntities {
    name: string;
    cost: string;
    count: string;
    location: string;
    resources: string;
    until: string;
    days: string;
    update: string;
    description: string;
}

export type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

// Define storage and application
const storage = new LastWriterWinsStore();
const app = new Application<ApplicationTurnState>({
    storage,
    predictionEngine
});

// Export bots run() function
export const run = (context) => app.run(context);

app.turn('beforeTurn', async (context, state) => {
    if (context.activity.type == ActivityTypes.Message) {
        // Initialize player state
        const player = state.user.value;
        if (!player.name) {
            player.name = (context.activity.from?.name ?? '').split(' ')[0];
            if (player.name.length == 0) {
                player.name = 'Adventurer';
            }
        }

        if (!player.backstory) {
            player.backstory = `Lives in Shadow Falls.`;
        }

        if (player.inventory == undefined) {
            player.inventory = { map: 1, sword: 1, hatchet: 1, gold: 50 };
        }

        // Add player to session
        const conversation = state.conversation.value;
        if (Array.isArray(conversation.players)) {
            if (conversation.players.indexOf(player.name) < 0) {
                conversation.players.push(player.name);
            }
        } else {
            conversation.players = [player.name]
        }

        // Update message text to include players name
        // - This ensures their name is in the chat history
        context.activity.text = `[${player.name}] ${context.activity.text}`;

        const temp = state.temp.value;
        temp.promptInstructions = 'Answer the players query.';
        temp.conversation = describePlayerDMConversation(state);
        temp.playerInfo = describePlayerInfo(player);
        temp.droppedItems = describeItemList(conversation.dropped ?? {});
        

        // Are we in a quest?
        if (conversation.inQuest === true) {
            // Increment game turn
            conversation.turn++;
            conversation.locationTurn++;

            // Age out dropped items
            if (conversation.droppedTurn > 0 && (conversation.turn - conversation.droppedTurn) >= 5) {
                conversation.dropped = {};
                conversation.droppedTurn = 0;
            }

            // Pass time
            let newDay = false;
            conversation.time += 0.25;
            if (conversation.time >= 24) {
                newDay = true;
                conversation.time -= 24;
                conversation.day += 1;
                if (conversation.day > 365) {
                    conversation.day = 1;
                }
            }

            // Load temp variables for prompt use
            const quest = quests[conversation.questIndex];
            const location = conversation.dynamicLocation ? conversation.dynamicLocation : map.locations[conversation.locationId];
            temp.quest = `"${quest.title}" - ${quest.backstory}`;
            temp.location = `${location.name} - ${location.details}`;
            temp.mapPaths = location.mapPaths;
            temp.surroundings = describeSurroundings(location);
            temp.gameState = describeGameState(conversation);
            temp.dynamicExamples = describeMoveExamples(location);
            temp.timeOfDay = describeTimeOfDay(conversation.time);
            temp.season = describeSeason(conversation.day);

            if (newDay) {
                conversation.temperature = generateTemperature(temp.season);
                conversation.weather = generateWeather(temp.season);
            }

            temp.conditions = describeConditions(conversation.time, conversation.day, conversation.temperature, conversation.weather);

            // Generate a random encounter
            if (conversation.turn >= conversation.nextEncounterTurn && Math.random() <= location.encounterChance) {
                temp.promptInstructions = 'An encounter occurred! Describe to the player the encounter.';
                conversation.nextEncounterTurn = 5 + Math.floor(Math.random() * 15);
            }
        } else {
            conversation.inQuest = false;
        }
    }

    return true;
});

app.message('start quest', async (context, state) => {
    await app.ai.doAction(context, state, 'startQuest');
})

app.message('/reset', async (context, state) => {
    state.conversation.delete();
    await context.sendActivity(`Ok lets start this over.`);
});

app.message('/forget', async (context, state) => {
    ConversationHistory.clear(state);
    await context.sendActivity(`Ok forgot all conversation history.`);
});

app.message('/history', async (context, state) => {
    const history = ConversationHistory.toString(state, 4000, `\n\n`);
    await context.sendActivity(`<b>Chat history:</b><br>${history}`);
});

app.message('/story', async (context, state) => {
    await context.sendActivity(`<b>The story so far:</b><br>${state.conversation.value.story ?? ''}`);
});

app.message('/profile', async (context, state) => {
    await context.sendActivity(`<b>${state.user.value.name}</b><br>${state.user.value.backstory.split('\n').join('<br>')}`);
});


app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    await context.sendActivity(`<b>${action}</b> action missing`);
    return true;
});

addActions(app, predictionEngine);

async function selectMainPrompt(context: TurnContext, state: ApplicationTurnState): Promise<string> {
    let prompt = 'prompt.txt';
    if (!state.conversation.value.inQuest) {
        prompt = 'preQuest.txt';
    }

    return await predictionEngine.expandPromptTemplate(context, state, prompts.getPromptPath(prompt)); 
}

export function describeSurroundings(location: IMapLocation): string {
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

export function describeGameState(state: ConversationState): string {
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

export function describePlayerInfo(player: UserState): string {
    let text = `\tName: ${player.name}\n\tBackstory: ${player.backstory}\n\tInventory:\n`;
    text += describeItemList(player.inventory, `\t\t`);
    return text;
}

export function describeItemList(items: IItemList, indent: string = '\t'): string {
    let text = '';
    let delim = '';
    for (const key in items) {
        text += `${delim}\t\t${key}: ${items[key]}`;
        delim = '\n';
    }

    return text;
}

export function describePlayerDMConversation(state: ApplicationTurnState): string {
    let text = '';
    let connector = '';
    const history: string[] = state.conversation.value[ConversationHistory.StatePropertyName] ?? [];
    for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        if (entry.startsWith('Player:')) {
            const nameStart = entry.indexOf('[') + 1;
            const nameEnd = entry.indexOf(']', nameStart);
            const player = entry.substring(nameStart, nameEnd);
            const utterance = entry.substring(nameEnd + 1).trim();
            text += `${connector}${player} said \`${utterance}\``;
            connector = 'Then ';
        } else {
            const response = entry.substring(entry.indexOf(' ')).trim();
            text += ` and the DM replied with \`${response}\``;
        }
    }

    return text;
}

export async function updateDMResponse(context: TurnContext, state: ApplicationTurnState, newResponse: string): Promise<void> {
    if (ConversationHistory.getLastLine(state).startsWith('DM:')) {
        ConversationHistory.replaceLastLine(state,`DM: ${newResponse}`);
    } else {
        ConversationHistory.addLine(state, `DM: ${newResponse}`);
    }
    
    await context.sendActivity(newResponse);
}

export function parseNumber(text: string|undefined, minValue: number): number {
    try {
        const count = parseInt(text ?? `${minValue}`);
        return count >= minValue ? count : minValue;
    } catch (err) {
        return minValue;
    }
}

export function trimPromptResponse(response: string): string {
    // Remove common junk that gets returned by the model.
    return response.replace('DM: ', '').replace('```', '');
}

export function titleCase(text: string): string {
    return text.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}


  