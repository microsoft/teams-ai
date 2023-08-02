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
    DefaultTurnState,
    OpenAIPlanner,
    AI,
    DefaultConversationState,
    DefaultUserState,
    DefaultTempState,
    DefaultPromptManager
} from '@microsoft/teams-ai';
import * as responses from './responses';

// Strongly type the applications turn state
interface ConversationState extends DefaultConversationState {
    greeted: boolean;
    listNames: string[];
    lists: Record<string, string[]>;
}

type UserState = DefaultUserState;

interface TempState extends DefaultTempState {
    lists: Record<string, string[]>;
}

type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAIKey environment variable');
}

// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'text-davinci-003',
    logRequests: true
});
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner,
        promptManager,
        prompt: 'chatGPT'
    }
});

// Define an interface to strongly type data parameters for actions
interface EntityData {
    list: string; // <- populated by GPT
    item: string; // <- populated by GPT
}

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context: TurnContext, state: ApplicationTurnState) => {
    if (!state.conversation.value.greeted) {
        state.conversation.value.greeted = true;
        await context.sendActivity(responses.greeting());
    }
});

// List for /reset command and then delete the conversation state
app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    state.conversation.delete();
    await context.sendActivity(responses.reset());
});

// Register action handlers
app.ai.action('createList', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    ensureListExists(state, data.list);
    return true;
});

app.ai.action('deleteList', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    deleteList(state, data.list);
    return true;
});

app.ai.action('addItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    items.push(data.item);
    setItems(state, data.list, items);
    return true;
});

app.ai.action('removeItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        items.splice(index, 1);
        setItems(state, data.list, items);
        return true;
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));

        // End the current chain
        return false;
    }
});

app.ai.action('findItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        await context.sendActivity(responses.itemFound(data.list, data.item));
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));
    }

    // End the current chain
    return false;
});

app.ai.action('summarizeLists', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const lists = state.conversation.value.lists;
    if (lists) {
        // Chain into a new summarization prompt
        state.temp.value.lists = lists;
        await app.ai.chain(context, state, 'summarize');
    } else {
        await context.sendActivity(responses.noListsFound());
    }

    // End the current chain
    return false;
});

// Register a handler to handle unknown actions that might be predicted
app.ai.action(
    AI.UnknownActionName,
    async (context: TurnContext, state: ApplicationTurnState, data: EntityData, action?: string) => {
        await context.sendActivity(responses.unknownAction(action!));
        return false;
    }
);

// Listen for incoming server requests.
server.post('/api/messages', (req, res, next) => {
    // Route received a request to adapter for processing
    adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });

    return next();
});

/**
 * @param state
 * @param list
 */
function getItems(state: ApplicationTurnState, list: string): string[] {
    ensureListExists(state, list);
    return state.conversation.value.lists[list];
}

/**
 * @param state
 * @param list
 * @param items
 */
function setItems(state: ApplicationTurnState, list: string, items: string[]): void {
    ensureListExists(state, list);
    state.conversation.value.lists[list] = items ?? [];
}

/**
 * @param state
 * @param listName
 */
function ensureListExists(state: ApplicationTurnState, listName: string): void {
    const conversation = state.conversation.value;
    if (typeof conversation.lists != 'object') {
        conversation.lists = {};
        conversation.listNames = [];
    }

    if (!Object.prototype.hasOwnProperty.call(conversation.lists, listName)) {
        conversation.lists[listName] = [];
        conversation.listNames.push(listName);
    }
}

/**
 * @param state
 * @param listName
 */
function deleteList(state: ApplicationTurnState, listName: string): void {
    const conversation = state.conversation.value;
    if (typeof conversation.lists == 'object' && Object.prototype.hasOwnProperty.call(conversation.lists, listName)) {
        delete conversation.lists[listName];
    }

    if (Array.isArray(conversation.listNames)) {
        const pos = conversation.listNames.indexOf(listName);
        if (pos >= 0) {
            conversation.listNames.splice(pos, 1);
        }
    }
}
