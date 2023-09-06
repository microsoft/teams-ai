import {
    Application,
    ConversationHistory,
    DefaultPromptManager,
    DefaultTurnState,
    AI,
    AzureOpenAIPlanner,
    AzureOpenAIModerator,
    DefaultConversationState
} from '@microsoft/teams-ai';
import { ModerationSeverity } from '@microsoft/teams-ai/lib/OpenAIClients';
import { MemoryStorage, TurnContext } from 'botbuilder';
import * as path from 'path';

export type ApplicationTurnState = DefaultTurnState<DefaultConversationState>;
type TData = Record<string, any>;

// Create AI components
// Create a planner
const planner = new AzureOpenAIPlanner<ApplicationTurnState>({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    defaultModel: 'gpt35-turbo',
    logRequests: true
});

// Create a moderator
const moderator = new AzureOpenAIModerator<ApplicationTurnState>({
    apiKey: process.env.AZURE_MODERATOR_API_KEY!,
    endpoint: process.env.AZURE_MODERATOR_ENDPOINT!,
    apiVersion: '2023-04-30-preview',
    moderate: 'both',
    categories: [
        {
            category: 'Hate',
            severity: ModerationSeverity.High
        },
        {
            category: 'SelfHarm',
            severity: ModerationSeverity.High
        },
        {
            category: 'Sexual',
            severity: ModerationSeverity.High
        },
        {
            category: 'Violence',
            severity: ModerationSeverity.High
        }
    ]
    // breakByBlocklists: true,
    // blocklistNames: [] // Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~. You could attach multiple lists name here.
});

// Create a prompt manager
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));
const promptTemplate = 'chat';

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner,
        moderator,
        promptManager,
        prompt: promptTemplate,
        history: {
            assistantHistoryType: 'text',
            userPrefix: 'User:',
            assistantPrefix: 'AI:',
            maxTurns: 5,
            maxTokens: 600
        }
    }
});

// Export bots run() function
export const run = (context: TurnContext) => app.run(context);

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context, state) => {
    const membersAdded = context.activity.membersAdded || [];
    for (let member = 0; member < membersAdded.length; member++) {
        // Ignore the bot joining the conversation
        // eslint-disable-next-line security/detect-object-injection
        if (membersAdded[member].id !== context.activity.recipient.id) {
            await context.sendActivity(
                `Hello and welcome! With this sample you can see the functionality of the Content Safety Moderator of Azure Open AI services.`
            );
        }
    }
});

app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    state.conversation.delete();
    await context.sendActivity(`Ok lets start this over.`);
});

app.message('/history', async (context, state) => {
    const history = ConversationHistory.toString(state, 2000, '\n\n');
    await context.sendActivity(`<strong>Chat history:</strong><br>${history}`);
});

app.ai.action(AI.FlaggedInputActionName, async (context, state, data) => {
    let message = '';
    if (data?.categories?.hate) {
        message += `<strong>Hate speech</strong> detected. Severity: ${data.category_scores.hate}. `;
    }
    if (data?.categories?.sexual) {
        message += `<strong>Sexual content</strong> detected. Severity: ${data.category_scores.sexual}. `;
    }
    if (data?.categories?.selfHarm) {
        message += `<strong>Self harm</strong> detected. Severity: ${data.category_scores.selfHarm}. `;
    }
    if (data?.categories?.violence) {
        message += `<strong>Violence</strong> detected. Severity: ${data.category_scores.violence}. `;
    }

    await context.sendActivity(
        `I'm sorry your message was flagged due to triggering Azure OpenAI’s content management policy. Reason: ${message}`
    );
    return false;
});

app.ai.action(AI.FlaggedOutputActionName, async (context, state, data) => {
    await context.sendActivity(`I'm not allowed to talk about such things.`);
    return false;
});

app.ai.action(
    AI.UnknownActionName,
    async (context: TurnContext, state: ApplicationTurnState, data: Record<string, any>, action: string = ' ') => {
        await context.sendActivity(`<strong>${action}</strong> action missing`);
        return true;
    }
);

app.ai.action(AI.RateLimitedActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed because it was rate limited. Please try again later.');
    return false;
});
