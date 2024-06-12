import { OpenAIModel, PromptManager, ActionPlanner, Application, TurnState, TeamsAdapter } from '@microsoft/teams-ai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from 'botbuilder';
import axios from 'axios';
import path from 'path';
import debug from 'debug';
import fs from 'fs';

const error = debug('azureopenai:app:error');
error.log = console.log.bind(console);

interface ConversationState {}
type ApplicationTurnState = TurnState<ConversationState>;

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
    azureDefaultDeployment: 'gpt-35-turbo',
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
    defaultPrompt: async () => {
        const prompt = await prompts.getPrompt('chat');

        prompt.config.completion.model = 'gpt-4o';

        if (process.env.AZURE_SEARCH_ENDPOINT) {
            (prompt.config.completion as any).data_sources = [
                {
                    type: 'azure_search',
                    parameters: {
                        endpoint: process.env.AZURE_SEARCH_ENDPOINT,
                        index_name: process.env.AZURE_SEARCH_INDEX,
                        semantic_configuration: 'default',
                        query_type: 'simple',
                        fields_mapping: {},
                        in_scope: true,
                        strictness: 3,
                        top_n_documents: 5,
                        role_information: fs
                            .readFileSync(path.join(__dirname, '../src/prompts/chat/skprompt.txt'))
                            .toString('utf-8'),
                        authentication: {
                            type: 'system_assigned_managed_identity'
                        }
                    }
                }
            ];
        }

        return prompt;
    }
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
            MicrosoftAppId: process.env.BOT_ID, // Set to "" if using the Teams Test Tool
            MicrosoftAppPassword: process.env.BOT_PASSWORD, // Set to "" if using the Teams Test Tool
            MicrosoftAppType: 'MultiTenant'
        })
    )
});

app.conversationUpdate('membersAdded', async (context) => {
    await context.sendActivity(
        "Welcome! I'm a conversational bot that can tell you about your data. You can also type `/clear` to clear the conversation history."
    );
});

app.message('/clear', async (context, state) => {
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

app.feedbackLoop(async (_context, _state, feedbackLoopData) => {
    if (feedbackLoopData.actionValue.reaction === 'like') {
        console.log('👍');
    } else {
        console.log('👎');
    }
});
