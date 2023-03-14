// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    ActivityTypes,
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

import { Application, DefaultTurnState, OpenAIPlanner } from 'botbuilder-m365';
import * as responses from './responses';

// Create prediction engine
const planner = new OpenAIPlanner({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    }
});

// Strongly type the applications turn state
interface ConversationState {
    secretWord: string;
    guessCount: number;
    remainingGuesses: number;
}
type ApplicationTurnState = DefaultTurnState<ConversationState>;

// Define storage and application
// - Not that we're not passing the application the prediction engine since we won't be chatting with
//   the app.
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage
});

// List for /reset command and then delete the conversation state
app.message('/quit', async (context, state) => {
    const { secretWord } = state.conversation.value;
    state.conversation.delete();
    await context.sendActivity(responses.quitGame(secretWord));
});

app.activity(ActivityTypes.Message, async (context, state) => {
    let { secretWord, guessCount, remainingGuesses } = state.conversation.value;
    if (secretWord) {
        guessCount++;
        remainingGuesses--;

        // Check for correct guess
        if (context.activity.text.toLowerCase().indexOf(secretWord.toLowerCase()) >= 0) {
            await context.sendActivity(responses.youWin(secretWord));
            secretWord = undefined;
            guessCount = remainingGuesses = 0;
        } else if (remainingGuesses == 0) {
            await context.sendActivity(responses.youLose(secretWord));
            secretWord = undefined;
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
    const response = await planner.prompt(context, state, {
        prompt: path.join(__dirname, '../src/prompt.txt'),
        promptConfig: {
            model: 'text-davinci-003',
            temperature: 0.4,
            max_tokens: 128,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        }
    });

    if (!response) {
        throw new Error(`The request to OpenAI was rate limited. Please try again later.`);
    }

    return response;
}
