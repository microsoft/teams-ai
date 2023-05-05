// Import required packages
import * as restify from "restify";

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
  MemoryStorage,
  ActivityTypes,
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

import { Application, DefaultPromptManager, DefaultTurnState, OpenAIPlanner } from '@microsoft/botbuilder-m365';
import * as responses from './responses';
import path from "path";

if (!config.openAIAPIKey) {
    throw new Error('Missing environment openAIAPIKey');
}

// Strongly type the applications turn state
interface ConversationState {
    secretWord: string;
    guessCount: number;
    remainingGuesses: number;
}
type ApplicationTurnState = DefaultTurnState<ConversationState>;

// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
    apiKey: config.openAIAPIKey,
    defaultModel: 'text-davinci-003',
    logRequests: true
});
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, './prompts'));

// Define storage and application
// - Note that we're not passing a prompt in our AI options as we manually ask for hints.
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner,
        promptManager
    }
});

// List for /reset command and then delete the conversation state
app.message('/quit', async (context: TurnContext, state: ApplicationTurnState) => {
    const { secretWord } = state.conversation.value;
    state.conversation.delete();
    await context.sendActivity(responses.quitGame(secretWord));
});

app.activity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
    let { secretWord, guessCount, remainingGuesses } = state.conversation.value;
    if (secretWord && secretWord.length < 1) {
        throw new Error('No secret word is assigned.');
    }
    if (secretWord) {
        guessCount++;
        remainingGuesses--;

        // Check for correct guess
        if (context.activity.text.toLowerCase().indexOf(secretWord.toLowerCase()) >= 0) {
            await context.sendActivity(responses.youWin(secretWord));
            secretWord = '';
            guessCount = remainingGuesses = 0;
        } else if (remainingGuesses == 0) {
            await context.sendActivity(responses.youLose(secretWord));
            secretWord = '';
            guessCount = remainingGuesses = 0;
        } else {
            // Ask GPT for a hint
            const response = await getHint(context, state);
            if (response.toLowerCase().indexOf(secretWord.toLowerCase()) >= 0) {
                await context.sendActivity(`[${guessCount}] ${responses.blockSecretWord()}`);
            } else if (remainingGuesses == 1) {
                await context.sendActivity(`[${guessCount}] ${responses.lastGuess(response)}`);
            } else {
                await context.sendActivity(`[${guessCount}] ${response}`);
            }
        }
    } else {
        // Start new game
        secretWord = responses.pickSecretWord();
        guessCount = 0;
        remainingGuesses = 20;
        await context.sendActivity(responses.startGame());
    }

    // Save game state
    state.conversation.value.secretWord = secretWord;
    state.conversation.value.guessCount = guessCount;
    state.conversation.value.remainingGuesses = remainingGuesses;
});

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
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
 * @param context
 * @param state
 */
async function getHint(context: TurnContext, state: ApplicationTurnState): Promise<string> {
    state.temp.value.input = context.activity.text;
    const hint = await app.ai.completePrompt(context, state, 'hint');

    if (!hint) {
        throw new Error(`The request to OpenAI was rate limited. Please try again later.`);
    }

    return hint;
}
