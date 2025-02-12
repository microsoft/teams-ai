// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import fetch from 'node-fetch';
import {
    ApplicationBuilder,
    OpenAIModel,
    PromptManager,
    ActionPlanner,
    TurnState,
    FeedbackLoopData,
    AI,
    TeamsAdapter
} from '@microsoft/teams-ai';
import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from 'botbuilder';
import axios from 'axios';
import debug from 'debug';
import { createListPRsCard, createGetPRCard } from './cards';
import { configureUserAuthentication } from './userAuth';

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const error = debug('oss:app:error');
error.log = console.log.bind(console);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
export const adapter = new TeamsAdapter(
    {},
    new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.BOT_ID,
        MicrosoftAppPassword: process.env.BOT_PASSWORD,
        MicrosoftAppType: 'MultiTenant'
    })
);

export const run = (context: TurnContext) => app.run(context);

interface ConversationState {
    count: number;
}

// Saved for proactive messaging with the webhook
export var conversation_id = '';
export var service_url = '';

interface GetPRParameters {
    pull_request_id: string;
}

export type ApplicationTurnState = TurnState<ConversationState>;

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
     azureApiKey: process.env.AZURE_OPENAI_KEY!,
     azureDefaultDeployment: 'gpt-4o',
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
    defaultPrompt: 'tools'
});

const storage = new MemoryStorage();
const app = new ApplicationBuilder<ApplicationTurnState>()
    .withStorage(storage)
    .withAIOptions({
        planner: planner,
        enable_feedback_loop: true,
    })
    .withAuthentication(adapter, {
        settings: {
            github: {
                connectionName: process.env.OAUTH_CONNECTION_NAME ?? '',
                title: 'Sign in to GitHub',
                text: 'Please sign in to GitHub to continue.',
                endOnInvalidMessage: true
            }
        }
    })
    .build();

// Register authentication handlers
configureUserAuthentication(app);

app.ai.action('ListPRs', async (context: TurnContext, state: ApplicationTurnState) => {
    conversation_id = context.activity.conversation.id;
    service_url = context.activity.serviceUrl;

    const token = state.temp.authTokens['github'];
    if (!token) {
        await context.sendActivity('Please sign in to GitHub first.');
        return AI.StopCommandName;
    }

    try {
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPOSITORY;

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=all`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Teams-Bot'
                }
            }
        );

        if (response.ok) {
            const pullRequests = await response.json();
            const card = createListPRsCard(pullRequests);
            await context.sendActivity({ attachments: [card] });
            return AI.StopCommandName;
        } else {
            const errorBody = await response.text();
            console.error('GitHub API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            throw new Error(`GitHub API returned ${response.status}: ${errorBody}`);
        }
    } catch (error) {
        console.error('GitHub API Error:', error);
        await context.sendActivity('Error accessing GitHub API');
        return AI.StopCommandName;
    }
});

app.ai.action('GetPR', async (context: TurnContext, state: ApplicationTurnState, parameters: GetPRParameters) => {
    conversation_id = context.activity.conversation.id;
    service_url = context.activity.serviceUrl;

    const token = state.temp.authTokens['github'];
    if (!token) {
        await context.sendActivity('Please sign in to GitHub first.');
        return AI.StopCommandName;
    }

    try {
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPOSITORY;

        // Fetch pull request data directly within the action
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${parameters.pull_request_id}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Teams-Bot'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('GitHub API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            throw new Error(`GitHub API returned ${response.status}: ${errorBody}`);
        }

        const prData = await response.json();
        const card = createGetPRCard(prData);
        await context.sendActivity({ attachments: [card] });
        return AI.StopCommandName;

    } catch (error) {
        console.error('GitHub API Error:', error);
        await context.sendActivity('Error accessing GitHub API');
        return AI.StopCommandName;
    }
});

app.message('login', async (context: TurnContext, state: ApplicationTurnState) => {
    let count = state.conversation.count ?? 0;
    state.conversation.count = ++count;

    console.log(state.temp.authTokens['github']);
    await context.sendActivity(`[${count}] you said: ${context.activity.text}`);
});

app.feedbackLoop(async (context: TurnContext, _state: TurnState, feedbackLoopData: FeedbackLoopData) => {
    if (feedbackLoopData.actionValue.reaction === 'like') {
        console.log('👍');
    } else {
        console.log('👎');
    }
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