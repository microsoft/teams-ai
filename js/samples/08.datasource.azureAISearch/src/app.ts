import { OpenAIModel, PromptManager, ActionPlanner, Application, AI, TurnState, TeamsAdapter, ApplicationBuilder } from "@microsoft/teams-ai";
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from "botbuilder";
import path from "path";
import { AzureAISearchDataSource } from "./AzureAISearchDataSource";
import { addResponseFormatter } from "./responseFormatter";

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
            MicrosoftAppId: process.env.BOT_ID,
            MicrosoftAppPassword: process.env.BOT_PASSWORD,
            MicrosoftAppType: 'MultiTenant'
        })
    ),
    ai: {
        planner
    }
});

// Add a custom response formatter to convert markdown code blocks to <pre> tags
addResponseFormatter(app);


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