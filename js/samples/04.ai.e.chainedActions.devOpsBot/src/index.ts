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
    nextId: number;
    workItems: WorkItem[];
    members: string[];
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
    defaultPrompt: 'sequence'
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

// List for /reset command and then delete the conversation state
app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    state.deleteConversationState();
    await context.sendActivity(responses.reset());
});

// Register user related handlers
interface UserUpdate {
    added?: string[];
    removed?: string[];
}

app.ai.action('updateMembers', async (context: TurnContext, state: ApplicationTurnState, parameters: UserUpdate) => {
    parameters.added = parameters.added || [];
    parameters.removed = parameters.removed || [];
    if (parameters.added.length > 0 || parameters.removed.length > 0) {
        const conversation = ensureStateInitialized(state);
        parameters.removed.forEach((user) => {
            const index = conversation.members.indexOf(user);
            if (index > -1) {
                conversation.members.splice(index, 1);
            }
        });
        parameters.added.forEach((user) => {
            if (!conversation.members.includes(user)) {
                conversation.members.push(user);
            }
        });
        return `members updated. think about your next action`;
    } else {
        return `no member changes made. think about your next action`;
    }
});

// Register work item related handlers
interface WorkItem {
    id: number; // <- populated by GPT
    title: string; // <- populated by GPT
    assignedTo: string; // <- populated by GPT
    status: string; // <- populated by GPT
}

app.ai.action('createWI', async (context: TurnContext, state: ApplicationTurnState, parameters: WorkItem) => {
    const conversation = ensureStateInitialized(state);
    parameters.id = conversation.nextId++;
    parameters.status = 'proposed';
    conversation.workItems.push(parameters);
    if (parameters.assignedTo) {
        return `work item created with id ${parameters.id}. think about your next action`;
    } else {
        return `work item created with id ${parameters.id} but needs to be assigned. think about your next action`;
    }
});

app.ai.action('updateWI', async (context: TurnContext, state: ApplicationTurnState, parameters: WorkItem) => {
    const conversation = ensureStateInitialized(state);
    const workItem = conversation.workItems.find((x) => x.id == parameters.id);
    if (workItem) {
        if (parameters.title) workItem.title = parameters.title;
        if (parameters.assignedTo) workItem.assignedTo = parameters.assignedTo;
        if (parameters.status) workItem.status = parameters.status;
    }
    return `work item ${parameters.id} was updated. think about your next action`;
});

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context: TurnContext) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});

/**
 * This method is used to make sure that the conversation state is initialized.
 * @param {ApplicationTurnState} state The application turn state.
 * @returns {ConversationState} The conversation state
 */
function ensureStateInitialized(state: ApplicationTurnState): ConversationState {
    if (state.conversation.nextId == undefined) {
        state.conversation.nextId = 1;
    }
    if (!Array.isArray(state.conversation.workItems)) {
        state.conversation.workItems = [];
    }
    if (!Array.isArray(state.conversation.members)) {
        state.conversation.members = [];
    }
    return state.conversation;
}
