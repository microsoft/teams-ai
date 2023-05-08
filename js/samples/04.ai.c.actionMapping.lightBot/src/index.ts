// Import required packages
import * as restify from "restify";

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
  MemoryStorage
} from "botbuilder";

import config from "./config";

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.botId,
  MicrosoftAppPassword: config.botPassword,
  MicrosoftAppType: "MultiTenant",
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  await context.sendActivity(`The bot encountered unhandled error:\n ${error.message}`);
  await context.sendActivity("To continue to run this bot, please fix the bot source code.");
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;


// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

import { AI, Application, DefaultPromptManager, DefaultTurnState, OpenAIPlanner } from '@microsoft/botbuilder-m365';
import * as responses from './responses';
import path from "path";

interface ConversationState {
    lightsOn: boolean;
}
type ApplicationTurnState = DefaultTurnState<ConversationState>;
type TData = Record<string, any>;

if (!config.openAIKey) {
    throw new Error('Missing environment variables - please check that OpenAIKey is set.');
}

// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
    apiKey: config.openAIKey,
    defaultModel: 'gpt-3.5-turbo',
    logRequests: true
});
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, './prompts'));

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

// Add a prompt function for getting the current status of the lights
app.ai.prompts.addFunction(
    'getLightStatus',
    async (context: TurnContext, state: ApplicationTurnState) => {
        return state.conversation.value.lightsOn ? 'on' : 'off';
    }
);

// Register action handlers
app.ai.action(
    'LightsOn',
    async (context: TurnContext, state: ApplicationTurnState) => {
        state.conversation.value.lightsOn = true;
        await context.sendActivity(`[lights on]`);
        return true;
    }
);

app.ai.action(
    'LightsOff',
    async (context: TurnContext, state: ApplicationTurnState) => {
        state.conversation.value.lightsOn = false;
        await context.sendActivity(`[lights off]`);
        return true;
    }
);

app.ai.action(
    'Pause',
    async (context: TurnContext, state: ApplicationTurnState, data: TData) => {
    const time = data.time ? parseInt(data.time) : 1000;
        await context.sendActivity(`[pausing for ${time / 1000} seconds]`);
        await new Promise((resolve) => setTimeout(resolve, time));
        return true;
    }
);

// Register a handler to handle unknown actions that might be predicted
app.ai.action(
    AI.UnknownActionName,
    async (context: TurnContext, state: ApplicationTurnState, data: TData, action: string | undefined) => {
        await context.sendActivity(responses.unknownAction(action || 'unknown'));
        return false;
    }
);

// Listen for incoming requests.
server.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context) => {
    await app.run(context);
  });
});
