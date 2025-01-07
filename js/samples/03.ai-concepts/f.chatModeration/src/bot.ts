import {
    Application,
    ActionPlanner,
    OpenAIModel,
    PromptManager,
    AzureContentSafetyModerator,
    ModerationSeverity,
    AI,
    OpenAIModerator,
    Moderator
} from '@microsoft/teams-ai';
import { ActivityTypes, CardFactory, MemoryStorage, TaskModuleTaskInfo, TurnContext } from 'botbuilder';
import * as path from 'path';

if (!process.env.OPENAI_KEY && !process.env.AZURE_OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set.');
}

// Create AI components
const model = new OpenAIModel({
    // OpenAI Support
    apiKey: process.env.OPENAI_KEY!,
    defaultModel: 'gpt-3.5-turbo',

    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-3.5-turbo',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2023-03-15-preview',

    // Request logging
    logRequests: true
});

// Create appropriate moderator
let moderator: Moderator;
if (process.env.OPENAI_KEY) {
    moderator = new OpenAIModerator({
        apiKey: process.env.OPENAI_KEY!,
        moderate: 'both'
    });
} else {
    if (!process.env.AZURE_CONTENT_SAFETY_KEY || !process.env.AZURE_CONTENT_SAFETY_ENDPOINT) {
        throw new Error(
            'Missing environment variables - please check that both AZURE_CONTENT_SAFETY_KEY and AZURE_CONTENT_SAFETY_ENDPOINT are set.'
        );
    }

    moderator = new AzureContentSafetyModerator({
        apiKey: process.env.AZURE_CONTENT_SAFETY_KEY!,
        endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT!,
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
        // haltOnBlocklistHit: true,
        // blocklistNames: [] // Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~. You could attach multiple lists name here.
    });
}

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
const app = new Application({
    storage,
    ai: {
        planner,
        moderator,
        enable_feedback_loop: true,
        feedback_loop_type: 'custom'
    }
});

// Export bots run() function
export const run = (context: TurnContext) => app.run(context);

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context, state) => {
    const membersAdded = context.activity.membersAdded || [];
    for (let member = 0; member < membersAdded.length; member++) {
        // Ignore the bot joining the conversation
        if (membersAdded[member].id !== context.activity.recipient.id) {
            await context.sendActivity(
                `Hello and welcome! With this sample, you can see the functionality of the Content Safety Moderator of Azure Open AI services.
        Additionally, you can explore the feedback functionality by using the following commands:

- **Default Feedback:** Test the default feedback feature.
- **Custom Feedback:** Try out the custom feedback option.`
            );
        }
    }
});

app.message('/reset', async (context, state) => {
    state.deleteConversationState();
    await context.sendActivity(`Ok lets start this over.`);
});

app.message('default feedback', async (context, state) => {

    await context.sendActivity({
        type: ActivityTypes.Message,
        text: "We'd love to hear your thoughts! Please click below to provide feedback.",
        channelData: {
          feedbackLoop: {
            type: "default"
          }
        },
      });
});

app.message('custom feedback', async (context, state) => {

    await context.sendActivity({
        type: ActivityTypes.Message,
        text: "We'd love to hear your thoughts! Please click below to provide feedback.",
        channelData: {
          feedbackLoop: {
            type: "custom"
          }
        },
      });
});

app.messages.fetch(async (context, state, data) => {
    var taskInfo = {} as any; // TaskModuleTaskInfo
    const createAdaptiveCardAttachment = () =>
         CardFactory.adaptiveCard({
            version: '1.0.0',
            type: 'AdaptiveCard',
            body: [
                {
                    type: 'TextBlock',
                    text: 'Enter Text Here'
                },
                {
                    type: 'Input.Text',
                    id: 'usertext',
                    placeholder: 'This is a custom feedback form built with Adaptive Card.',
                    IsMultiline: true
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Submit'
                }
            ]
        });

    const setTaskInfo = (taskInfo: any, uiSettings: any) => {
        taskInfo.height = uiSettings.height;
        taskInfo.width = uiSettings.width;
        taskInfo.title = uiSettings.title;
    }

    taskInfo.card = createAdaptiveCardAttachment();

    setTaskInfo(taskInfo, {
      width: 400,
      height: 200,
      title: 'Custom Feedback Form',
      id: path,
      buttonTitle: 'Custom Feedback Form'
    });

    return Promise.resolve(taskInfo as string | TaskModuleTaskInfo);
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

app.feedbackLoop(async (context, state, data) => {
    await context.sendActivity('Thank you for your feedback!');
    const Feedback = typeof data.actionValue.feedback === 'string' ? JSON.parse(data.actionValue.feedback) : data.actionValue.feedback;
    await context.sendActivity('Provided reaction: '+ data.actionValue.reaction + '<br>Feedback: ' + (Feedback.usertext != undefined ? Feedback.usertext : Feedback.feedbackText));
});