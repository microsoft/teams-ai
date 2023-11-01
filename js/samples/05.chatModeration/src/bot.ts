import {
    Application,
    ActionPlanner,
    OpenAIModel,
    PromptManager,
    AzureOpenAIModerator,
    ModerationSeverity,
    AI,
    OpenAIModerator
} from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';
import * as path from 'path';

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_API_KEY is set.');
}

// Create AI components
const model = new OpenAIModel({
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-3.5-turbo',
    logRequests: true
});

const moderator = new OpenAIModerator({
    apiKey: process.env.OPENAI_API_KEY!,
    moderate: 'both',
});

// if (!process.env.AZURE_API_KEY) {
//     throw new Error('Missing environment variables - please check that AZURE_API_KEY is set.');
// }
//
// const model = new OpenAIModel({
//     azureApiKey: process.env.AZURE_API_KEY || '',
//     azureDefaultDeployment: 'gpt35turbo',
//     azureEndpoint: process.env.AZURE_AI_ENDPOINT || '',
//     azureApiVersion: '2023-03-15-preview',
//     logRequests: true
// });
//
// Create a moderator
// const moderator = new AzureOpenAIModerator({
//     apiKey: process.env.AZURE_MODERATOR_API_KEY!,
//     endpoint: process.env.AZURE_MODERATOR_ENDPOINT!,
//     apiVersion: '2023-04-30-preview',
//     moderate: 'both',
//     categories: [
//         {
//             category: 'Hate',
//             severity: ModerationSeverity.High
//         },
//         {
//             category: 'SelfHarm',
//             severity: ModerationSeverity.High
//         },
//         {
//             category: 'Sexual',
//             severity: ModerationSeverity.High
//         },
//         {
//             category: 'Violence',
//             severity: ModerationSeverity.High
//         }
//     ]
//     // breakByBlocklists: true,
//     // blocklistNames: [] // Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~. You could attach multiple lists name here.
// });

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: 'chat',
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
    storage,
    ai: {
        planner,
        moderator
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

app.message('/reset', async (context, state) => {
    state.deleteConversationState();
    await context.sendActivity(`Ok lets start this over.`);
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
    return AI.StopCommandName;
});

app.ai.action(AI.FlaggedOutputActionName, async (context, state, data) => {
    await context.sendActivity(`I'm not allowed to talk about such things.`);
    return AI.StopCommandName;
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed. Please try again later.');
    return AI.StopCommandName;
});
