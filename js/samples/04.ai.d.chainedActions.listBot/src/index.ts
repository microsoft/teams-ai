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
    ConfigurationBotFrameworkAuthenticationOptions,
    MemoryStorage
} from 'botbuilder';

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
    process.env as ConfigurationBotFrameworkAuthenticationOptions
);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Create storage to use
//const storage = new MemoryStorage();

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
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

import { Application, DefaultTurnState, OpenAIPlanner, AI } from 'botbuilder-m365';
import * as responses from './responses';

// Create prediction engine
const planner = new OpenAIPlanner({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: path.join(__dirname, '../src/prompt.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.0,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Human:', ' AI:']
    },
    logRequests: true
});

// Strongly type the applications turn state
interface ConversationState {
    greeted: boolean;
    listNames: string[];
    lists: Record<string, string[]>;
}

interface UserState {}

interface TempState {
    lists: Record<string, string[]>;
}

type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    planner
});

// Define an interface to strongly type data parameters for actions
interface EntityData {
    list: string; // <- populated by GPT
    item: string; // <- populated by GPT
}

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context, state) => {
    if (!state.conversation.value.greeted) {
        state.conversation.value.greeted = true;
        await context.sendActivity(responses.greeting());
    }
});

// List for /reset command and then delete the conversation state
app.message('/reset', async (context, state) => {
    state.conversation.delete();
    await context.sendActivity(responses.reset());
});

// Register action handlers
app.ai.action('addItem', async (context, state, data: EntityData) => {
    const items = getItems(state, data.list);
    items.push(data.item);
    setItems(state, data.list, items);
    return true;
});

app.ai.action('removeItem', async (context, state, data: EntityData) => {
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

app.ai.action('findItem', async (context, state, data: EntityData) => {
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

app.ai.action('summarizeLists', async (context, state, data: EntityData) => {
    const lists = state.conversation.value.lists;
    if (lists) {
        // Chain into a new summarization prompt
        state.temp.value.lists = lists;
        await app.ai.chain(context, state, {
            prompt: path.join(__dirname, '../src/summarizeAllLists.txt'),
            promptConfig: {
                model: 'text-davinci-003',
                temperature: 0.0,
                max_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            }
        });
    } else {
        await context.sendActivity(responses.noListsFound());
    }

    // End the current chain
    return false;
});

// Register a handler to handle unknown actions that might be predicted
app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    await context.sendActivity(responses.unknownAction(action));
    return false;
});

// Register a handler to deal with a user asking something off topic
app.ai.action(AI.OffTopicActionName, async (context, state) => {
    await context.sendActivity(responses.offTopic());
    return false;
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
    if (typeof state.conversation.value.lists != 'object') {
        state.conversation.value.lists = {};
        state.conversation.value.listNames = [];
    }

    if (!state.conversation.value.lists.hasOwnProperty(listName)) {
        state.conversation.value.lists[listName] = [];
        state.conversation.value.listNames.push(listName);
    }
}
