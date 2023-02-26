// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AI, Application, ConversationHistory, DefaultTurnState, OpenAIPredictionEngine } from 'botbuilder-m365';
import { ActivityTypes, MemoryStorage, TurnContext } from 'botbuilder';
import * as responses from './responses';
import { IItemList, IMapLocation } from './interfaces';
import { map, quests } from './ShadowFalls';
import * as prompts from './prompts';
import { addActions } from './actions';

// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: selectMainPrompt,
    promptConfig: prompts.prompt.promptConfig,
    conversationHistory: {
        userPrefix: 'Player:',
        botPrefix: 'DM:',
        maxLines: 100,
        maxCharacterLength: 4000
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
}

export interface UserState {
    name: string;
    inventory: IItemList;
}

export interface TempState {
    quest: string;
    location: string;
    mapPaths: string;
    surroundings: string;
    gameState: string;
    dynamicExamples: string;
    dmActions: string;
    playerActions: string;
    listItems: IItemList;
    listType: string;
    origin: string;
    newLocation: string;
    dynamicMapLocation: string;
}

export interface IDataEntities {
    name: string;
    cost: string;
    count: string;
    location: string;
}

export type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

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
        // Initialize player state
        const player = state.user.value;
        if (!player.name) {
            player.name = (context.activity.from?.name ?? '').split(' ')[0];
            if (player.name.length == 0) {
                player.name = 'Adventurer';
            }
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

            // Load temp variables for prompt use
            const temp = state.temp.value;
            const quest = quests[conversation.questIndex];
            const location = conversation.dynamicLocation ? conversation.dynamicLocation : map.locations[conversation.locationId];
            temp.quest = `\tTitle: "${quest.title}"\n\tBackstory: ${quest.backstory}`;
            temp.location = location.details;
            temp.mapPaths = location.mapPaths;
            temp.surroundings = describeSurroundings(location);
            temp.gameState = describeGameState(conversation);
            temp.dynamicExamples = describeMoveExamples(location);
        } else {
            conversation.inQuest = false;
        }
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

export async function updateDMResponse(context: TurnContext, state: ApplicationTurnState, newResponse: string, wholeLine = false): Promise<void> {
    if (wholeLine) {
        // The model likely hallucinated something and we don't want to encourage it to run the same DO again.
        ConversationHistory.replaceLastLine(state, `DM: ${newResponse}`);
    } else {
        // This will replace the last SAY if there was one, otherwise it will append the response as a THEN SAY 
        ConversationHistory.updateResponse(state, newResponse, 'DM: ');
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
    // Because we include conversation history in a lot of prompts,
    // we will sometimes get a response with a THEN SAY. We can ignore
    // everything before the say.
    const sayPos = response.indexOf('SAY ');
    if (sayPos > 0) {
        return response.substring(sayPos + 4).trim();
    } else {
        return response;
    }

}

export function titleCase(text: string): string {
    return text.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }
  