/* eslint-disable security/detect-object-injection */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationServiceClientCredentialFactory,
    MemoryStorage,
    TurnContext
} from 'botbuilder';

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
    {},
    new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.BOT_ID,
        MicrosoftAppPassword: process.env.BOT_PASSWORD,
        MicrosoftAppType: 'MultiTenant'
    })
);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Create storage to use
//const storage = new MemoryStorage();

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error.toString()}`);
    console.log(error);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error.toString()}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo test your bot in Teams, sideload the app manifest.json within Teams Apps.');
});

import {
    Application,
    ActionPlanner,
    OpenAIModel,
    PromptManager,
    TurnState,
    DefaultConversationState
} from '@microsoft/teams-ai';
import * as responses from './responses';

// Strongly type the applications turn state
interface ConversationState extends DefaultConversationState {
    greeted: boolean;
    lists: Record<string, string[]>;
}
type ApplicationTurnState = TurnState<ConversationState>;


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
    defaultPrompt: 'monologue',
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner
    }
});

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context: TurnContext, state: ApplicationTurnState) => {
    if (!state.conversation.greeted) {
        state.conversation.greeted = true;
        await context.sendActivity(responses.greeting());
    }
});

// ListEN for /reset command and then delete the conversation state
app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    state.deleteConversationState();
    await context.sendActivity(responses.reset());
});

// Register action handlers
interface ListOnly {
    list: string;
}

interface ListAndItems extends ListOnly {
    items?: string[];
}

app.ai.action('createList', async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
    ensureListExists(state, parameters.list);
    if (Array.isArray(parameters.items) && parameters.items.length > 0) {
        await app.ai.doAction(context, state, 'addItems', parameters);
        return `list created and items added. think about your next action`;
    } else {
        return `list created. think about your next action`;
    }
});

app.ai.action('deleteList', async (context: TurnContext, state: ApplicationTurnState, parameters: ListOnly) => {
    deleteList(state, parameters.list);
    return `list deleted. think about your next action`;
});

app.ai.action('addItems', async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
    const items = getItems(state, parameters.list);
    items.push(...(parameters.items ?? []));
    setItems(state, parameters.list, items);
    return `items added. think about your next action`;
});

app.ai.action('removeItems', async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
    const items = getItems(state, parameters.list);
    (parameters.items ?? []).forEach((item: string) => {
        const index = items.indexOf(item);
        if (index >= 0) {
            items.splice(index, 1);
        }
    });
    setItems(state, parameters.list, items);
    return `items removed. think about your next action`;
});

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});

/**
 * Retrieves the items for a given list from the conversation state.
 * @param {ApplicationTurnState} state - The current turn state.
 * @param {string} list - The name of the list to retrieve items for.
 * @returns {string[]} - The items in the specified list.
 */
function getItems(state: ApplicationTurnState, list: string): string[] {
    ensureListExists(state, list);
    return state.conversation.lists[list];
}

/**
 * Sets the items for a given list in the conversation state.
 * @param {ApplicationTurnState} state - The current turn state.
 * @param {string} list - The name of the list to set items for.
 * @param {string[]} items - The items to set for the specified list.
 */
function setItems(state: ApplicationTurnState, list: string, items: string[]): void {
    ensureListExists(state, list);
    state.conversation.lists[list] = items ?? [];
}

/**
 * Ensures that a list with the given name exists in the conversation state.
 * @param {ApplicationTurnState} state - The current turn state.
 * @param {string} listName - The name of the list to ensure exists.
 */
function ensureListExists(state: ApplicationTurnState, listName: string): void {
    if (typeof state.conversation.lists != 'object') {
        state.conversation.lists = {};
    }

    if (!Object.prototype.hasOwnProperty.call(state.conversation.lists, listName)) {
        state.conversation.lists[listName] = [];
    }
}

/**
 * Deletes a list from the conversation state.
 * @param {ApplicationTurnState} state - The current turn state.
 * @param {string} listName - The name of the list to delete.
 */
function deleteList(state: ApplicationTurnState, listName: string): void {
    if (typeof state.conversation.lists == 'object' && Object.prototype.hasOwnProperty.call(state.conversation.lists, listName)) {
        delete state.conversation.lists[listName];
    }
}
