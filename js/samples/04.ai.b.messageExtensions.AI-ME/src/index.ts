// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    Attachment,
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    MemoryStorage,
    MessageFactory,
    MessagingExtensionResult,
    TaskModuleTaskInfo,
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

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error.toString()}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error.toString()}`,
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

import {
    Application,
    DefaultConversationState,
    DefaultPromptManager,
    DefaultTempState,
    DefaultTurnState,
    DefaultUserState,
    OpenAIPlanner
} from '@microsoft/teams-ai';
import { createInitialView, createEditView, createPostCard } from './cards';

// This Message Extension can either drop the created card into the compose window (default.)
// Or use Teams botMessagePreview feature to post the activity directly to the feed onBehalf of the user.
// Set PREVIEW_MODE to true to enable this feature and update your manifest accordingly.
const PREVIEW_MODE = false;

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing environment OPENAI_API_KEY');
}

interface TempState extends DefaultTempState {
    post: string | undefined;
    prompt: string | undefined;
}

type ApplicationTurnState = DefaultTurnState<DefaultConversationState, DefaultUserState, TempState>;

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_API_KEY is set.');
}
// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'text-davinci-003',
    logRequests: true
});
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));

// Define storage and application
// - Note that we're not passing a prompt for our AI options as we won't be chatting with the app.
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    adapter,
    botAppId: process.env.MicrosoftAppId,
    ai: {
        planner,
        promptManager
    }
});

app.messageExtensions.fetchTask('CreatePost', async (context: TurnContext, state: ApplicationTurnState) => {
    // Return card as a TaskInfo object
    const card = createInitialView();
    return createTaskInfo(card);
});

interface SubmitData {
    verb: 'generate' | 'update' | 'preview' | 'post';
    prompt?: string;
    post?: string;
}

app.messageExtensions.submitAction<SubmitData>(
    'CreatePost',
    async (context: TurnContext, state: ApplicationTurnState, data: SubmitData) => {
        try {
            switch (data.verb) {
                case 'generate':
                    // Call GPT and return response view
                    return await updatePost(context, state, 'generate', data);
                case 'update':
                    // Call GPT and return an updated response view
                    return await updatePost(context, state, 'update', data);
                case 'preview': {
                    // Preview the post as an adaptive card
                    const card = createPostCard(data.post!);
                    const activity = MessageFactory.attachment(card);
                    return {
                        type: 'botMessagePreview',
                        activityPreview: activity
                    } as MessagingExtensionResult;
                }
                case 'post': {
                    const attachments = [createPostCard(data.post!)] || undefined;
                    // Drop the card into compose window
                    return {
                        type: 'result',
                        attachmentLayout: 'list',
                        attachments
                    } as MessagingExtensionResult;
                    break;
                }
            }
        } catch (err: any) {
            return `Something went wrong: ${err.toString()}`;
        }
    }
);

app.messageExtensions.botMessagePreviewEdit(
    'CreatePost',
    async (context: TurnContext, state: DefaultTurnState, previewActivity: any) => {
        // Get post text from previewed card
        const post: string = previewActivity?.attachments?.[0]?.content?.body[0]?.text ?? '';
        const card = createEditView(post, PREVIEW_MODE);
        return createTaskInfo(card);
    }
);

app.messageExtensions.botMessagePreviewSend(
    'CreatePost',
    async (context: TurnContext, state: DefaultTurnState, previewActivity: any) => {
        // Create a new activity using the card in the preview activity
        const card = previewActivity?.attachments?.[0];
        const activity = card && MessageFactory.attachment(card);
        if (!activity) {
            throw new Error('No card found in preview activity');
        }
        activity.channelData = {
            onBehalfOf: [
                {
                    itemId: 0,
                    mentionType: 'person',
                    mri: context.activity.from.id,
                    displayname: context.activity.from.name
                }
            ]
        };

        // Send new activity to chat
        await context.sendActivity(activity);
    }
);

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});

/**
 * Creates a task module task info object with the given card.
 * @param {Attachment} card - The card to include in the task module task info object.
 * @returns {TaskModuleTaskInfo} The task module task info object.
 */
function createTaskInfo(card: Attachment): TaskModuleTaskInfo {
    return {
        title: `Create Post`,
        width: 'medium',
        height: 'medium',
        card
    };
}

/**
 * Updates a post with the given data and returns a task module task info object with the updated post.
 * @param {TurnContext} context - The context object for the current turn of conversation.
 * @param {ApplicationTurnState} state - The state object for the current turn of conversation.
 * @param {string} prompt - The prompt to use for generating the updated post.
 * @param {SubmitData} data - The data to use for updating the post.
 * @returns {Promise<TaskModuleTaskInfo>} A task module task info object with the updated post.
 */
async function updatePost(
    context: TurnContext,
    state: ApplicationTurnState,
    prompt: string,
    data: SubmitData
): Promise<TaskModuleTaskInfo> {
    // Create new or updated post
    state.temp.value['post'] = data.post;
    state.temp.value['prompt'] = data.prompt;
    const post = await app.ai.completePrompt(context, state, prompt);
    if (!post) {
        throw new Error(`The request to OpenAI was rate limited. Please try again later.`);
    }

    // Return card
    const card = createEditView(post, PREVIEW_MODE);
    return createTaskInfo(card);
}
