import { OpenAIModel, PromptManager, ActionPlanner, Application, AI, TurnState, TeamsAdapter, ApplicationBuilder } from "@microsoft/teams-ai";
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from "botbuilder";
import path from "path";
import { AzureAISearchDataSource } from "./AzureAISearchDataSource";
import { addResponseFormatter } from "./responseFormatter";
import debug from "debug";

const error = debug('azureaisearch:app:error');
error.log = console.log.bind(console);

interface ConversationState {}
type ApplicationTurnState = TurnState<ConversationState>;

if (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_SEARCH_ENDPOINT || !process.env.AZURE_SEARCH_KEY) {
    throw new Error('Missing environment variables - please check that AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_ENDPOINT are all set.');
}

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-35-turbo',
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
    defaultPrompt: 'chat'
});

// Register your data source with planner
planner.prompts.addDataSource(
    new AzureAISearchDataSource({
        name: 'azure-ai-search',
        indexName: 'restaurants',
        azureAISearchApiKey: process.env.AZURE_SEARCH_KEY!,
        azureAISearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT!,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY!,
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        azureOpenAIEmbeddingDeployment: 'text-embedding-ada-002'
    })
);

// Define storage and application
const storage = new MemoryStorage();
export const app = new Application<ApplicationTurnState>({
    storage: storage,
    adapter: new TeamsAdapter(
        {},
        new ConfigurationServiceClientCredentialFactory({
            MicrosoftAppId: process.env.BOT_ID, // Set to "" if using the Teams Test Tool
            MicrosoftAppPassword: process.env.BOT_PASSWORD, // Set to "" if using the Teams Test Tool 
            MicrosoftAppType: 'MultiTenant'
        })
    ),
    ai: {
        planner
    }
});

// Add a custom response formatter to convert markdown code blocks to <pre> tags
addResponseFormatter(app);

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

// Register other AI actions
app.ai.action(
    AI.FlaggedInputActionName,
    async (context: TurnContext, _state: ApplicationTurnState, data: Record<string, any>) => {
        await context.sendActivity(`I'm sorry your message was flagged: ${JSON.stringify(data)}`);
        return AI.StopCommandName;
    }
);

app.ai.action(AI.FlaggedOutputActionName, async (context: TurnContext, state: ApplicationTurnState, data: any) => {
    await context.sendActivity(`I'm not allowed to talk about such things.`);
    return AI.StopCommandName;
});