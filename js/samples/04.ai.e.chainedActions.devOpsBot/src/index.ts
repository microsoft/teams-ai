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
    MemoryStorage,
    TurnContext
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
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error.message}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error.message}`,
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
    AI,
    Application,
    DefaultConversationState,
    DefaultPromptManager,
    DefaultTempState,
    DefaultTurnState,
    DefaultUserState,
    OpenAIPlanner
} from '@microsoft/teams-ai';
import * as responses from './responses';

// Strongly type the applications turn state
interface ConversationState extends DefaultConversationState {
    greeted: boolean;
    workItems: EntityData[];
}

type UserState = DefaultUserState;

interface TempState extends DefaultTempState {
    workItems: EntityData[];
}

type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, TempState>;

// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
    apiKey: `${process.env.OPENAIAPIKEY}`,
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
    id: number; // <- populated by GPT
    title: string; // <- populated by GPT
    assignedTo: string; // <- populated by GPT
    status: string; // <- populated by GPT
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
app.ai.action('createWI', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const id = createNewWorkItem(state, data);
    await context.sendActivity(`New work item created with ID: ${id} and assigned to: ${data.assignedTo}`);
    return false;
});

app.ai.action('assignWI', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    assignWorkItem(state, data);
    return true;
});

app.ai.action('updateWI', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    updateWorkItem(state, data);
    return true;
});

app.ai.action('triageWI', async (context, state, data: EntityData) => {
    triageWorkItem(state, data);
    return true;
});

app.ai.action('summarize', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const workItems = ensureWorkItemsInitialized(state).workItems;
    if (workItems.length != 0) {
        // Chain into a new summarization prompt
        state.temp.value.workItems = workItems;
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
    adapter.process(req, res as any, async (context: TurnContext) => {
        // Dispatch to application for routing
        await app.run(context);
    });
    return next();
});

/**
 * This method is used to create new work item.
 *
 * @param {ApplicationTurnState} state The application turn state.
 * @param {EntityData} workItemInfo Data containing the work item information.
 * @returns {number} The ID of the newly created work item.
 */
function createNewWorkItem(state: ApplicationTurnState, workItemInfo: EntityData): number {
    const conversation = ensureWorkItemsInitialized(state);

    if (workItemInfo.id == null) {
        workItemInfo.id = conversation.workItems.length + 1;
    }
    workItemInfo.status = 'Proposed';
    conversation.workItems.push(workItemInfo);
    return workItemInfo.id;
}

/**
 * This method is used to assign a work item to a person.
 *
 * @param {ApplicationTurnState} state The application turn state.
 * @param {EntityData} workItemInfo Data containing the work item information.
 */
function assignWorkItem(state: ApplicationTurnState, workItemInfo: EntityData): void {
    const conversation = ensureWorkItemsInitialized(state);

    if (workItemInfo.id != null) {
        const workItem = conversation.workItems.find((x) => x.id == workItemInfo.id);
        if (workItem != null) {
            workItem.assignedTo = workItemInfo.assignedTo;
        }
    }
}

/**
 * This method is used to triage work item.
 *
 * @param {ApplicationTurnState} state The application turn state.
 * @param {EntityData} workItemInfo Data containing the work item information.
 */
function triageWorkItem(state: ApplicationTurnState, workItemInfo: EntityData): void {
    const conversation = ensureWorkItemsInitialized(state);

    if (workItemInfo.id != null) {
        const workItem = conversation.workItems.find((x) => x.id == workItemInfo.id);
        if (workItem != null) {
            workItem.status = workItemInfo.status;
        }
    }
}

/**
 * This method is used to make sure that work items are initialized properly.
 *
 * @param {ApplicationTurnState} state The application turn state.
 * @returns {ConversationState} The conversation state
 */
function ensureWorkItemsInitialized(state: ApplicationTurnState): ConversationState {
    const conversation = state.conversation.value;
    if (typeof conversation.workItems != 'object') {
        conversation.workItems = [];
    }
    return conversation;
}

/**
 * This method is used to update the existing work item.
 *
 * @param {ApplicationTurnState} state The application turn state.
 * @param {EntityData} workItemInfo Data containing the work item information.
 */
function updateWorkItem(state: ApplicationTurnState, workItemInfo: EntityData): void {
    const conversation = ensureWorkItemsInitialized(state);

    if (workItemInfo.id != null) {
        const workItem = conversation.workItems.find((x) => x.id == workItemInfo.id);
        if (workItem != null) {
            if (workItemInfo.title !== null) workItem.title = workItemInfo.title;
            if (workItemInfo.assignedTo !== null) workItem.assignedTo = workItemInfo.assignedTo;
            if (workItemInfo.status !== null) workItem.status = workItemInfo.status;
        }
    }
}
