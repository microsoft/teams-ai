import { OpenAIModel, PromptManager, ActionPlanner, Application, TurnState, TeamsAdapter, FeedbackLoopData } from '@microsoft/teams-ai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from 'botbuilder';
import axios from 'axios';
import path from 'path';
import debug from 'debug';

const error = debug('azureopenai:app:error');
error.log = console.log.bind(console);

interface ConversationState {}
type ApplicationTurnState = TurnState<ConversationState>;

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
    azureDefaultDeployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2024-02-15-preview',
    azureADTokenProvider: getBearerTokenProvider(
        new DefaultAzureCredential(),
        'https://cognitiveservices.azure.com/.default'
    ),

    // Request logging
    logRequests: true,
    useSystemMessages: true
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
    storage,
    ai: {
        planner: planner,
        enable_feedback_loop: true
    },
    adapter: new TeamsAdapter(
        {},
        new ConfigurationServiceClientCredentialFactory({
            MicrosoftAppId: process.env.BOT_ID,
            MicrosoftAppPassword: process.env.BOT_PASSWORD,
            MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
            MicrosoftAppType: process.env.BOT_TYPE
        })
    )
});

app.conversationUpdate('membersAdded', async (context: TurnContext) => {
    await context.sendActivity(
        "Welcome! I'm a conversational bot that can tell you about your data. You can also type `/clear` to clear the conversation history."
    );
});

app.message('/clear', async (context: TurnContext, state: TurnState) => {
    state.deleteConversationState();
    await context.sendActivity("New chat session started: Previous messages won't be used as context for new queries.");
});

app.error(async (context: TurnContext, err: any) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    error(`[onTurnError] unhandled error: ${err}`);

    if (err instanceof axios.AxiosError) {
        error(err.toJSON());
        error(err.response?.data);
    } else {
        error(err);
    }
    
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

app.feedbackLoop(async (_context: TurnContext, _state: TurnState, feedbackLoopData: FeedbackLoopData ) => {
    if (feedbackLoopData.actionValue.reaction === 'like') {
        console.log('👍');
    } else {
        console.log('👎');
    }
});
