// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AI, Application, ConversationHistory, DefaultTurnState, OpenAIPredictionEngine } from 'botbuilder-m365';
import { ActivityTypes, TurnContext } from 'botbuilder';
import * as responses from './responses';
import { IItemList, IMapLocation } from './interfaces';
import { map } from './ShadowFalls';
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
        maxLines: 4,
        maxCharacterLength: 2000
    },
    logRequests: true
});

// Strongly type the applications turn state
export interface ConversationState {
    greeted: boolean;
    turn: number;
    location: ILocation;
    locationTurn: number;
    quests: { [title: string]: IQuest };
    players: string[];
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
    equipped: string;
    inventory: IItemList;
}

export interface TempState {
    playerAnswered: boolean;
    prompt: string;
    promptInstructions: string;
    playerInfo: string;
    gameState: string;
    quests: string;
    location: string;
    conditions: string;
    listItems: IItemList;
    listType: string;
    timeOfDay: string;
    season: string;
    backstoryChange: string;
    equippedChange: string;
}

export interface IDataEntities {
    action: string;
    add: string;
    description: string;
    remove: string;
    title: string;
    name: string;
    backstory: string;
    equipped: string;
    until: string;
    days: string;
}

export interface IQuest {
    title: string;
    description: string;
}

export interface ILocation {
    title: string;
    description: string;
    encounterChance: number;
}

export type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

// Define storage and application
const storage = new LastWriterWinsStore(process.env.StorageConnectionString, process.env.StorageContainer);
const app = new Application<ApplicationTurnState>({
    storage,
    predictionEngine
});

// Export bots run() function
export const run = (context) => app.run(context);

export const DEFAULT_BACKSTORY =  `Lives in Shadow Falls.`;
export const DEFAULT_EQUIPPED = `Wearing clothes.`;

app.turn('beforeTurn', async (context, state) => {
    if (context.activity.type == ActivityTypes.Message) {
        const conversation = state.conversation.value;
        const player = state.user.value;
        const temp = state.temp.value;

        // Initialize player state
        if (!player.name) {
            player.name = (context.activity.from?.name ?? '').split(' ')[0];
            if (player.name.length == 0) {
                player.name = 'Adventurer';
            }
        }

        if (!player.backstory) {
            player.backstory = DEFAULT_BACKSTORY;
        }

        if (!player.equipped) {
            player.equipped = DEFAULT_EQUIPPED;
        }

        if (player.inventory == undefined) {
            player.inventory = { map: 1, sword: 1, hatchet: 1, gold: 50 };
        }

        // Add player to session
        if (Array.isArray(conversation.players)) {
            if (conversation.players.indexOf(player.name) < 0) {
                conversation.players.push(player.name);
            }
        } else {
            conversation.players = [player.name]
        }

        // Update message text to include players name
        // - This ensures their name is in the chat history
        const useHelpPrompt = context.activity.text.trim().toLowerCase() == 'help';
        context.activity.text = `[${player.name}] ${context.activity.text}`;

        // Are we just starting?
        let newDay = false;
        let location: ILocation;
        if (!conversation.greeted) {
            newDay = true;
            conversation.greeted = true;
            temp.prompt = 'intro.txt';

            // Create starting location
            const village = map.locations['village'];
            location = {
                title: village.name,
                description: village.details,
                encounterChance: village.encounterChance
            };

            // Initialize conversation state
            conversation.turn = 1;
            conversation.location = location;
            conversation.locationTurn = 1;
            conversation.quests = {};
            conversation.story = `The story begins.`;
            conversation.day = Math.floor(Math.random() * 365) + 1;
            conversation.time = Math.floor(Math.random() * 14) + 6; // Between 6am and 8pm
            conversation.nextEncounterTurn = 5 + Math.floor(Math.random() * 15);
        
            // Send location title as a message
            await context.sendActivity(`🧙 <b>${location.title}</b>`);
            app.startTypingTimer(context);
        } else {
            location = conversation.location;
            temp.prompt = 'prompt.txt';

            // Increment game turn
            conversation.turn++;
            conversation.locationTurn++;

            // Pass time
            conversation.time += 0.25;
            if (conversation.time >= 24) {
                newDay = true;
                conversation.time -= 24;
                conversation.day += 1;
                if (conversation.day > 365) {
                    conversation.day = 1;
                }
            }
        }

        // User is asking for help
        if (useHelpPrompt) {
            temp.prompt = 'help.txt';
        }

        // Load temp variables for prompt use
        temp.playerAnswered = false;
        temp.promptInstructions = 'Answer the players query.';
        temp.playerInfo = describePlayerInfo(player);
        temp.location = `${location.title} - ${location.description}`;
        temp.quests = describeQuests(conversation);
        temp.gameState = describeGameState(conversation);
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
            conversation.nextEncounterTurn = conversation.turn + (5 + Math.floor(Math.random() * 15));
        }
    }

    return true;
});

app.turn('afterTurn', async (context, state) => {
    const lastSay = ConversationHistory.getLastSay(state);
    if (!lastSay && !state.temp.value.playerAnswered) {
        // We sometime only get told to update the story so lets just read back
        // the current story to the user.
        const story = state.conversation.value.story;
        await context.sendActivity(story);
    }

    return true;
});

app.message('/state', async (context, state) => {
    await context.sendActivity(JSON.stringify(state));
});

app.message(['/reset-profile', '/reset-user'], async (context, state) => {
    state.user.delete();
    state.conversation.value.players = [];
    await context.sendActivity(`I've reset your profile.`);
});

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
    const player = state.user.value;
    const backstory = player.backstory.split('\n').join('<br>');
    const equipped = player.equipped.split('\n').join('<br>')
    await context.sendActivity(`🤴 <b>${player.name}</b><br><b>Backstory:</b> ${backstory}<br><b>Equipped:</b> ${equipped}`);
});


app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    await context.sendActivity(`<b>${action}</b> action missing`);
    return true;
});

addActions(app, predictionEngine);

async function selectMainPrompt(context: TurnContext, state: ApplicationTurnState): Promise<string> {
    const prompt = state.temp.value.prompt;
    return await predictionEngine.expandPromptTemplate(context, state, prompts.getPromptPath(prompt)); 
}

export function describeGameState(conversation: ConversationState): string {
    return `\tTotalTurns: ${conversation.turn - 1}\n\tLocationTurns: ${conversation.locationTurn - 1}`
}

export function describeQuests(conversation: ConversationState): string {
    let text = '';
    let connector = '';
    for (const key in conversation.quests) {
        const quest = conversation.quests[key];
        text += `${connector}"${quest.title}" - ${quest.description}`;
        connector = '\n\n'
    }

    return text.length > 0 ? text : 'none';
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
    let text = `\tName: ${player.name}\n\tBackstory: ${player.backstory}\n\tEquipped: ${player.equipped}\n\tInventory:\n`;
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
            connector = '\nThen ';
        } else {
            const response = entry.substring(entry.indexOf(' ')).trim();
            if (text.length > 0) {
                text += ` and the DM replied with \`${response}\``;
            } else {
                text += ` The DM said \`${response}\``;
            }
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


  