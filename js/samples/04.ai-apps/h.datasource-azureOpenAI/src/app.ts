import { OpenAIModel, PromptManager, ActionPlanner, Application, TurnState, TeamsAdapter } from '@microsoft/teams-ai';
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from 'botbuilder';
import path from 'path';
import debug from 'debug';

const error = debug('azureopenai:app:error');
error.log = console.log.bind(console);

interface ConversationState {}
type ApplicationTurnState = TurnState<ConversationState>;

if (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    throw new Error('Missing environment variables - please check that AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT');
}

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-35-turbo',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2024-02-15-preview',

    // Request logging
    logRequests: true
});

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: 'chat'
});

// Define storage and application
const storage = new MemoryStorage();
export const app = new Application<ApplicationTurnState>({
    ai: {
        planner: planner,
        enable_feedback_loop: true
    },
    storage: storage,
    adapter: new TeamsAdapter(
        {},
        new ConfigurationServiceClientCredentialFactory({
            MicrosoftAppId: process.env.BOT_ID, // Set to "" if using the Teams Test Tool
            MicrosoftAppPassword: process.env.BOT_PASSWORD, // Set to "" if using the Teams Test Tool
            MicrosoftAppType: 'MultiTenant'
        })
    )
});

app.error(async (context: TurnContext, err: any) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    error(`[onTurnError] unhandled error: ${err}`);
    error(err);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${err}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
});

app.feedbackLoop(async (context, state, feedbackLoopData) => {
    if (feedbackLoopData.actionValue.reaction === 'like') {
        console.log('👍');
    } else {
        console.log('👎');
    }
});
