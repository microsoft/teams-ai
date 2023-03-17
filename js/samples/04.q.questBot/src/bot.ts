// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AI, Application, ConversationHistory, DefaultTurnState, OpenAIPlanner, ResponseParser } from 'botbuilder-m365';
import { ActivityTypes, TurnContext } from 'botbuilder';
import * as responses from './responses';
import { IItemList } from './interfaces';
import { map } from './ShadowFalls';
import * as prompts from './prompts';
import { addActions } from './actions';
import { LastWriterWinsStore } from './LastWriterWinsStore';
import {
    describeConditions,
    describeSeason,
    describeTimeOfDay,
    generateTemperature,
    generateWeather
} from './conditions';

// Create prediction engine
const planner = new OpenAIPlanner({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: selectMainPrompt,
    promptConfig: prompts.prompt.promptConfig,
    conversationHistory: {
        userPrefix: 'Player: ',
        botPrefix: 'DM: ',
        maxLines: 2,
        maxCharacterLength: 2000
    },
    logRequests: true
});

// Strongly type the applications turn state
export interface ConversationState {
    version: number;
    greeted: boolean;
    turn: number;
    location: ILocation;
    locationTurn: number;
    campaign: ICampaign;
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
    campaign: string;
    quests: string;
    location: string;
    conditions: string;
    listItems: IItemList;
    listType: string;
    timeOfDay: string;
    season: string;
    backstoryChange: string;
    equippedChange: string;
    originalText: string;
    newText: string;
    objectiveTitle: string;
}

export interface IDataEntities {
    operation: string;
    description: string;
    items: string;
    title: string;
    name: string;
    backstory: string;
    equipped: string;
    until: string;
    days: string;
}

export interface ICampaign {
    title: string;
    playerIntro: string;
    objectives: ICampaignObjective[];
}

export interface ICampaignObjective {
    title: string;
    description: string;
    completed: boolean;
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
    planner
});

// Export bots run() function
export const run = (context) => app.run(context);

export const DEFAULT_BACKSTORY = `Lives in Shadow Falls.`;
export const DEFAULT_EQUIPPED = `Wearing clothes.`;
export const CONVERSATION_STATE_VERSION = 1;

app.turn('beforeTurn', async (context, state) => {
    if (context.activity.type == ActivityTypes.Message) {
        let conversation = state.conversation.value;
        const player = state.user.value;
        const temp = state.temp.value;

        // Clear conversation state on version change
        if (conversation.version !== CONVERSATION_STATE_VERSION) {
            state.conversation.delete();
            conversation = state.conversation.value;
            conversation.version = CONVERSATION_STATE_VERSION;
        }

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
            conversation.players = [player.name];
        }

        // Update message text to include players name
        // - This ensures their name is in the chat history
        const useHelpPrompt = context.activity.text.trim().toLowerCase() == 'help';
        context.activity.text = `[${player.name}] ${context.activity.text}`;

        // Are we just starting?
        let newDay = false;
        let campaign: ICampaign;
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

            // Create campaign
            const response = await planner.prompt(context, state, prompts.createCampaign);
            campaign = ResponseParser.parseJSON(response);
            if (campaign && campaign.title && Array.isArray(campaign.objectives)) {
                // Send campaign title as a message
                conversation.campaign = campaign;
                await context.sendActivity(`🧙 <strong>${campaign.title}</b>`);
                app.startTypingTimer(context);
            } else {
                state.conversation.delete();
                await context.sendActivity(responses.dataError());
                return false;
            }
        } else {
            campaign = conversation.campaign;
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

        // Find next campaign objective
        let campaignFinished = false;
        let nextObjective: ICampaignObjective;
        if (campaign) {
            campaignFinished = true;
            for (let i = 0; i < campaign.objectives.length; i++) {
                const objective = campaign.objectives[i];
                if (!objective.completed) {
                    // Ignore if the objective is already a quest
                    if (!conversation.quests.hasOwnProperty(objective.title.toLowerCase())) {
                        nextObjective = objective;
                    }

                    campaignFinished = false;
                    break;
                }
            }
        }

        // Is user asking for help
        let objectiveAdded = false;
        if (useHelpPrompt && !campaignFinished) {
            temp.prompt = 'help.txt';
        } else if (nextObjective && Math.random() < 0.2) {
            // Add campaign objective as a quest
            conversation.quests[nextObjective.title.toLowerCase()] = {
                title: nextObjective.title,
                description: nextObjective.description
            };

            // Notify user of new quest
            objectiveAdded = true;
            await context.sendActivity(
                `✨ <strong>${nextObjective.title}</strong><br>${nextObjective.description
                    .trim()
                    .split('\n')
                    .join('<br>')}`
            );
            app.startTypingTimer(context);
        }

        // Load temp variables for prompt use
        temp.playerAnswered = false;
        temp.promptInstructions = 'Answer the players query.';
        temp.playerInfo = describePlayerInfo(player);
        temp.campaign = describeCampaign(campaign);
        temp.quests = describeQuests(conversation);
        temp.location = `"${location.title}" - ${location.description}`;
        temp.gameState = describeGameState(conversation);
        temp.timeOfDay = describeTimeOfDay(conversation.time);
        temp.season = describeSeason(conversation.day);

        if (newDay) {
            conversation.temperature = generateTemperature(temp.season);
            conversation.weather = generateWeather(temp.season);
        }

        temp.conditions = describeConditions(
            conversation.time,
            conversation.day,
            conversation.temperature,
            conversation.weather
        );

        if (campaignFinished) {
            temp.promptInstructions =
                'The players have completed the campaign. Congratulate them and tell them they can continue adventuring or use "/reset" to start over with a new campaign.';
            conversation.campaign = undefined;
        } else if (objectiveAdded) {
            temp.prompt = 'newObjective.txt';
            temp.objectiveTitle = nextObjective.title;
        } else if (conversation.turn >= conversation.nextEncounterTurn && Math.random() <= location.encounterChance) {
            // Generate a random encounter
            temp.promptInstructions = 'An encounter occurred! Describe to the player the encounter.';
            conversation.nextEncounterTurn = conversation.turn + (5 + Math.floor(Math.random() * 15));
        }
    }

    return true;
});

app.turn('afterTurn', async (context, state) => {
    const lastSay = ConversationHistory.getLastSay(state);
    if (!lastSay) {
        // We have a dangling `DM: ` so remove it
        ConversationHistory.removeLastLine(state);

        // Reply with the current story if we haven't answered player
        if (!state.temp.value.playerAnswered) {
            const story = state.conversation.value.story;
            if (story) {
                await context.sendActivity(story);
            }
        }
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
    await context.sendActivity(`<strong>Chat history:</strong><br>${history}`);
});

app.message('/story', async (context, state) => {
    await context.sendActivity(`<strong>The story so far:</strong><br>${state.conversation.value.story ?? ''}`);
});

app.message('/profile', async (context, state) => {
    const player = state.user.value;
    const backstory = player.backstory.split('\n').join('<br>');
    const equipped = player.equipped.split('\n').join('<br>');
    await context.sendActivity(
        `🤴 <strong>${player.name}</strong><br><strong>Backstory:</strong> ${backstory}<br><strong>Equipped:</strong> ${equipped}`
    );
});

app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    await context.sendActivity(`<strong>${action}</strong> action missing`);
    return true;
});

addActions(app, planner);

/**
 * @param context
 * @param state
 */
async function selectMainPrompt(context: TurnContext, state: ApplicationTurnState): Promise<string> {
    const prompt = state.temp.value.prompt;
    return await planner.expandPromptTemplate(context, state, prompts.getPromptPath(prompt));
}

/**
 * @param conversation
 */
export function describeGameState(conversation: ConversationState): string {
    return `\tTotalTurns: ${conversation.turn - 1}\n\tLocationTurns: ${conversation.locationTurn - 1}`;
}

/**
 * @param campaign
 */
export function describeCampaign(campaign?: ICampaign): string {
    if (campaign) {
        return `"${campaign.title}" - ${campaign.playerIntro}`;
    } else {
        return '';
    }
}

/**
 * @param conversation
 */
export function describeQuests(conversation: ConversationState): string {
    let text = '';
    let connector = '';
    for (const key in conversation.quests) {
        const quest = conversation.quests[key];
        text += `${connector}"${quest.title}" - ${quest.description}`;
        connector = '\n\n';
    }

    return text.length > 0 ? text : 'none';
}

/**
 * @param player
 */
export function describePlayerInfo(player: UserState): string {
    let text = `\tName: ${player.name}\n\tBackstory: ${player.backstory}\n\tEquipped: ${player.equipped}\n\tInventory:\n`;
    text += describeItemList(player.inventory, `\t\t`);
    return text;
}

/**
 * @param items
 * @param indent
 */
export function describeItemList(items: IItemList, indent = '\t'): string {
    let text = '';
    let delim = '';
    for (const key in items) {
        text += `${delim}\t\t${key}: ${items[key]}`;
        delim = '\n';
    }

    return text;
}

/**
 * @param state
 */
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

/**
 * @param context
 * @param state
 * @param newResponse
 */
export async function updateDMResponse(
    context: TurnContext,
    state: ApplicationTurnState,
    newResponse: string
): Promise<void> {
    if (ConversationHistory.getLastLine(state).startsWith('DM:')) {
        ConversationHistory.replaceLastLine(state, `DM: ${newResponse}`);
    } else {
        ConversationHistory.addLine(state, `DM: ${newResponse}`);
    }

    await context.sendActivity(newResponse);
}

/**
 * @param text
 * @param minValue
 */
export function parseNumber(text: string | undefined, minValue?: number): number {
    try {
        const count = parseInt(text ?? `${minValue ?? 0}`);
        if (typeof minValue == 'number') {
            return count >= minValue ? count : minValue;
        } else {
            return count;
        }
    } catch (err) {
        return minValue ?? 0;
    }
}

/**
 * @param response
 */
export function trimPromptResponse(response: string): string {
    // Remove common junk that gets returned by the model.
    return response.replace('DM: ', '').replace('```', '');
}

/**
 * @param text
 */
export function titleCase(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map(function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}
