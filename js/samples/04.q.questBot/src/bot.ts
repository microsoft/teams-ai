// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    AI,
    Application,
    ActionPlanner,
    OpenAIModel,
    PromptManager,
    TurnState,
    DefaultConversationState,
    DefaultUserState,
    DefaultTempState
} from '@microsoft/teams-ai';
import { ActivityTypes, TurnContext } from 'botbuilder';
import * as path from 'path';
import * as responses from './responses';
import { IItemList } from './interfaces';
import { map } from './ShadowFalls';
import { addActions } from './actions';
import { LastWriterWinsMemoryStore } from './LastWriterWinsStore';
import { describeConditions, describeSeason, generateTemperature, generateWeather } from './conditions';
import { ICampaign, ICampaignObjective, campaignValidator } from './ICampaign';

// Strongly type the applications turn state
export interface ConversationState extends DefaultConversationState {
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

export interface UserState extends DefaultUserState {
    name: string;
    backstory: string;
    equipped: string;
    inventory: IItemList;
}

export interface TempState extends DefaultTempState {
    playerAnswered: boolean;
    prompt: string;
    promptInstructions: string;
    listItems: IItemList;
    listType: string;
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

export interface IQuest {
    title: string;
    description: string;
}

export interface ILocation {
    title: string;
    description: string;
    encounterChance: number;
}

export type ApplicationTurnState = TurnState<ConversationState, UserState, TempState>;

if (!process.env.OPENAI_KEY && !process.env.AZURE_OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set.');
}

// Create AI components
const model = new OpenAIModel({
    // OpenAI Support
    apiKey: process.env.OPENAI_KEY!,
    defaultModel: 'gpt-3.5-turbo',

    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-3.5-turbo',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2023-03-15-preview',

    // Request logging
    logRequests: true
});

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: (_context: TurnContext, state: ApplicationTurnState) => prompts.getPrompt(state.temp.prompt),
});

// Define storage and application
// - Note that we're not passing a prompt in our AI options as we manually ask for hints.
const storage = new LastWriterWinsMemoryStore();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner
    }
});

// Export bots run() function
export const run = (context: TurnContext) => app.run(context);

export const DEFAULT_BACKSTORY = `Lives in Shadow Falls.`;
export const DEFAULT_EQUIPPED = `Wearing clothes.`;
export const CONVERSATION_STATE_VERSION = 1;

app.turn('beforeTurn', async (context: TurnContext, state: ApplicationTurnState) => {
    if (context.activity.type == ActivityTypes.Message) {
        let conversation = state.conversation;
        const player = state.user;
        const temp = state.temp;

        // Clear conversation state on version change
        if (conversation.version !== CONVERSATION_STATE_VERSION) {
            state.deleteConversationState();
            conversation = state.conversation;
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
            temp.prompt = 'intro';

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
            const response = await planner.completePrompt<ICampaign>(context, state, 'createCampaign', campaignValidator);
            if (response.status != 'success') {
                throw new Error('Failed to create campaign');
            }
            campaign = response.message?.content!;
            if (campaign && campaign.title && Array.isArray(campaign.objectives)) {
                // Send campaign title as a message
                conversation.campaign = campaign;
                await context.sendActivity(`🧙 <strong>${campaign.title}</b>`);
                app.startTypingTimer(context);
            } else {
                state.deleteConversationState();
                await context.sendActivity(responses.dataError());
                return false;
            }
        } else {
            campaign = conversation.campaign;
            location = conversation.location;
            temp.prompt = 'prompt';

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
        let nextObjective: ICampaignObjective = {} as ICampaignObjective;
        if (Object.entries(campaign).length > 0) {
            campaignFinished = true;
            for (let i = 0; i < campaign.objectives.length; i++) {
                // eslint-disable-next-line security/detect-object-injection
                const objective = campaign.objectives[i];
                if (!objective.completed) {
                    // Ignore if the objective is already a quest
                    if (!Object.prototype.hasOwnProperty.call(conversation.quests, objective.title.toLowerCase())) {
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
            temp.prompt = 'help';
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

        // Has a new day passed?
        if (newDay) {
            const season = describeSeason(conversation.day);
            conversation.temperature = generateTemperature(season);
            conversation.weather = generateWeather(season);
        }

        // Load temp variables for prompt use
        temp.playerAnswered = false;
        temp.promptInstructions = 'Answer the players query.';

        if (campaignFinished) {
            temp.promptInstructions =
                'The players have completed the campaign. Congratulate them and tell them they can continue adventuring or use "/reset" to start over with a new campaign.';
            conversation.campaign = {} as ICampaign;
        } else if (objectiveAdded) {
            temp.prompt = 'newObjective';
            temp.objectiveTitle = nextObjective.title;
        } else if (conversation.turn >= conversation.nextEncounterTurn && Math.random() <= location.encounterChance) {
            // Generate a random encounter
            temp.promptInstructions = 'An encounter occurred! Describe to the player the encounter.';
            conversation.nextEncounterTurn = conversation.turn + (5 + Math.floor(Math.random() * 15));
        }
    }

    return true;
});

app.message('/state', async (context: TurnContext, state) => {
    await context.sendActivity(JSON.stringify(state));
});

app.message(['/reset-profile', '/reset-user'], async (context: TurnContext, state) => {
    state.deleteUserState();
    state.conversation.players = [];
    await context.sendActivity(`I've reset your profile.`);
});

app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    state.deleteConversationState();
    await context.sendActivity(`Ok lets start this over.`);
});

app.message('/story', async (context: TurnContext, state: ApplicationTurnState) => {
    await context.sendActivity(`<strong>The story so far:</strong><br>${state.conversation.story ?? ''}`);
});

app.message('/profile', async (context: TurnContext, state: ApplicationTurnState) => {
    const player = state.user;
    const backstory = player.backstory.split('\n').join('<br>');
    const equipped = player.equipped.split('\n').join('<br>');
    await context.sendActivity(
        `🤴 <strong>${player.name}</strong><br><strong>Backstory:</strong> ${backstory}<br><strong>Equipped:</strong> ${equipped}`
    );
});

addActions(app, planner);

// Register prompt functions
/*
app.ai.prompts.addFunction('describeGameState', async (_context: TurnContext, state: ApplicationTurnState) => {
    const conversation = state.conversation;
    return `\tTotalTurns: ${conversation.turn - 1}\n\tLocationTurns: ${conversation.locationTurn - 1}`;
});

app.ai.prompts.addFunction('describeCampaign', async (_context: TurnContext, state: ApplicationTurnState) => {
    const conversation = state.conversation;
    if (conversation.campaign) {
        return `"${conversation.campaign.title}" - ${conversation.campaign.playerIntro}`;
    } else {
        return '';
    }
});

app.ai.prompts.addFunction('describeQuests', async (_context: TurnContext, state: ApplicationTurnState) => {
    const conversation = state.conversation;
    let text = '';
    let connector = '';
    for (const key in conversation.quests) {
        // eslint-disable-next-line security/detect-object-injection
        const quest = conversation.quests[key];
        text += `${connector}"${quest.title}" - ${quest.description}`;
        connector = '\n\n';
    }

    return text.length > 0 ? text : 'none';
});

app.ai.prompts.addFunction('describePlayerInfo', async (_context: TurnContext, state: ApplicationTurnState) => {
    const player = state.user;
    let text = `\tName: ${player.name}\n\tBackstory: ${player.backstory}\n\tEquipped: ${player.equipped}\n\tInventory:\n`;
    text += describeItemList(player.inventory, `\t\t`);
    return text;
});

app.ai.prompts.addFunction('describeLocation', async (_context: TurnContext, state: ApplicationTurnState) => {
    const conversation = state.conversation;
    if (conversation.location) {
        return `"${conversation.location.title}" - ${conversation.location.description}`;
    } else {
        return '';
    }
});

app.ai.prompts.addFunction('describeConditions', async (_context: TurnContext, state: ApplicationTurnState) => {
    const conversation = state.conversation;
    return describeConditions(conversation.time, conversation.day, conversation.temperature, conversation.weather);
});
*/

/**
 * Returns a string representation of the given item list.
 * @param {IItemList} items - The item list to describe.
 * @param {string} [indent] - The indentation string to use.
 * @returns {string} The string representation of the item list.
 */
export function describeItemList(items: IItemList, indent = '\t'): string {
    let text = '';
    let delim = '';
    for (const key in items) {
        // eslint-disable-next-line security/detect-object-injection
        text += `${delim}\t\t${key}: ${items[key]}`;
        delim = '\n';
    }

    return text;
}

/**
 * Updates the conversation history with the new response and sends the response to the user.
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {ApplicationTurnState} state The state object for the current turn of conversation.
 * @param {string} newResponse The new response to add to the conversation history and send to the user.
 * @returns {Promise<void>} A promise that resolves when the response has been sent to the user.
 */
export async function updateDMResponse(
    context: TurnContext,
    state: ApplicationTurnState,
    newResponse: string
): Promise<void> {
    // if (ConversationHistory.getLastLine(state).startsWith('DM:')) {
    //     ConversationHistory.replaceLastLine(state, `DM: ${newResponse}`);
    // } else {
    //     ConversationHistory.addLine(state, `DM: ${newResponse}`);
    // }

    await context.sendActivity(newResponse);
}

/**
 * Parses a string to a number.
 * @param {string | undefined} text - The string to parse.
 * @param {number} [minValue] - The minimum value to return.
 * @returns {number} The parsed number.
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
 * Trims the prompt response by removing common junk that gets returned by the model.
 * @param {string} response - The response to trim.
 * @returns {string} The trimmed response.
 */
export function trimPromptResponse(response: string): string {
    // Remove common junk that gets returned by the model.
    return response.replace('DM: ', '').replace('```', '');
}

/**
 * Converts a string to title case.
 * @param {string} text - The string to convert to title case.
 * @returns {string} The title case version of the input string.
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
