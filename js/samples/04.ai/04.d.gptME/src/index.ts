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

import { Application, DefaultTurnState, OpenAIPredictionEngine } from 'botbuilder-m365';
import { createInitialView, createEditView, createPostCard } from './cards';

// This Message Extension can either drop the created card into the compose window (default.) 
// Or use Teams botMessagePreview feature to post the activity directly to the feed onBehalf of the user.
// Set PREVIEW_MODE to true to enable this feature and update your manifest accordingly.
const PREVIEW_MODE = false;

// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    }
});

// Define storage and application
// - Not that we're not passing the application the prediction engine since we won't be chatting with
//   the app.
const storage = new MemoryStorage();
const app = new Application({
    storage,
    adapter,
    botAppId: process.env.MicrosoftAppId
});

app.messageExtensions.fetchTask('CreatePost', async (context, state) => {
    // Return card as a TaskInfo object
    const card = createInitialView();
    return createTaskInfo(card);
});

interface SubmitData {
    verb: 'generate' | 'update' | 'preview' | 'post';
    prompt?: string;
    post?: string;
}

app.messageExtensions.submitAction<SubmitData>('CreatePost', async (context, state, data) => {
    try {
        switch (data.verb) {
            case 'generate':
                // Call GPT and return response view
                return await updatePost(context, state, '../src/generate.txt', data);
            case 'update':
                // Call GPT and return an updated response view
                return await updatePost(context, state, '../src/update.txt', data);
            case 'preview':
                // Preview the post as an adaptive card
                const card = createPostCard(data.post!);
                const activity = MessageFactory.attachment(card);
                return {
                    type: 'botMessagePreview',
                    activityPreview: activity
                } as MessagingExtensionResult;
            case 'post':
                // Drop the card into compose window
                return {
                    type: 'result',
                    attachmentLayout: 'list',
                    attachments: [createPostCard(data.post)]
                } as MessagingExtensionResult;
                break;
        }
    } catch (err: any) {
        return `Something went wrong: ${err.toString()}`;
    }
});

app.messageExtensions.botMessagePreviewEdit('CreatePost', async (context, state, previewActivity) => {
    // Get post text from previewed card
    const post: string = previewActivity?.attachments[0]?.content?.body[0]?.text ?? '';
    const card = createEditView(post, PREVIEW_MODE);
    return createTaskInfo(card);
});

app.messageExtensions.botMessagePreviewSend('CreatePost', async (context, state, previewActivity) => {
    // Create a new activity using the card in the preview activity
    const card = previewActivity?.attachments[0];
    const activity = MessageFactory.attachment(card);
    activity.channelData = {
        onBehalfOf: [
            { itemId: 0, mentionType: 'person', mri: context.activity.from.id, displayname: context.activity.from.name }
        ]
    };

    // Send new activity to chat
    await context.sendActivity(activity);
});

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});

function createTaskInfo(card: Attachment): TaskModuleTaskInfo {
    return {
        title: `Create Post`,
        width: 'medium',
        height: 'medium',
        card
    };
}

async function updatePost(
    context: TurnContext,
    state: DefaultTurnState,
    prompt: string,
    data: SubmitData
): Promise<TaskModuleTaskInfo> {
    const post = await callPrompt(context, state, prompt, data);
    const card = createEditView(post, PREVIEW_MODE);
    return createTaskInfo(card);
}

async function callPrompt(
    context: TurnContext,
    state: DefaultTurnState,
    prompt: string,
    data?: Record<string, any>
): Promise<string> {
    const response = await predictionEngine.prompt(
        context,
        state,
        {
            prompt: path.join(__dirname, prompt),
            promptConfig: {
                model: 'text-davinci-003',
                temperature: 0.7,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            }
        },
        data
    );

    if (response.status != 429) {
        return response.data?.choices[0]?.text ?? '';
    } else {
        throw new Error(`The request to OpenAI was rate limited. Please try again later.`);
    }
}
