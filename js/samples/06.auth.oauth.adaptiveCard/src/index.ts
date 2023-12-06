/* eslint-disable @typescript-eslint/no-unused-vars */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    ActivityTypes,
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationServiceClientCredentialFactory,
    MemoryStorage,
    TurnContext
} from 'botbuilder';

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
    {},
    new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.BOT_ID,
        MicrosoftAppPassword: process.env.BOT_PASSWORD,
        MicrosoftAppType: 'MultiTenant'
    })
);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context: any, error: any) => {
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

import { ApplicationBuilder, TurnState } from '@microsoft/teams-ai';
import { createUserProfileCard, createViewProfileCard } from './cards';
import { GraphClient } from './graphClient';

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                connectionName: process.env.OAUTH_CONNECTION_NAME ?? '',
                title: 'Sign in',
                text: 'Please sign in to use the bot.',
                endOnInvalidMessage: true,
                tokenExchangeUri: process.env.TokenExchangeUri ?? ''
            }
        },
        autoSignIn: (context: TurnContext) => {
            // Disable auto sign in for message activities
            if (context.activity.type == ActivityTypes.Message) {
                return Promise.resolve(false);
            }
            return Promise.resolve(true);
        }
    })
    .build();

// Handle message activities
app.activity(ActivityTypes.Message, async (context: TurnContext, _state: TurnState) => {
    const initialCard = createViewProfileCard();

    await context.sendActivity({ attachments: [initialCard] });
});

// Handle sign in adaptive card button click
app.adaptiveCards.actionExecute('signin', async (_context: TurnContext, state: TurnState) => {
    const token = state.temp.authTokens['graph'];
    if (!token) {
        throw new Error('No auth token found in state. Authentication failed.');
    }

    const user = await getUserDetailsFromGraph(token);
    const profileCard = createUserProfileCard(user.displayName, user.profilePhoto);

    return profileCard.content;
});

// Handle sign out adaptive card button click
app.adaptiveCards.actionExecute('signout', async (context: TurnContext, state: TurnState) => {
    await app.authentication.signOutUser(context, state);

    const initialCard = createViewProfileCard();

    return initialCard.content;
});

/**
 * Get the user details from Graph
 * @param {string} token The token to use to get the user details
 * @returns {Promise<{ displayName: string; profilePhoto: string }>} A promise that resolves to the user details
 */
async function getUserDetailsFromGraph(token: string): Promise<{ displayName: string; profilePhoto: string }> {
    // The user is signed in, so use the token to create a Graph Clilent and show profile
    const graphClient = new GraphClient(token);
    const profile = await graphClient.GetMyProfile();
    const profilePhoto = await graphClient.GetPhotoAsync();
    return { displayName: profile.displayName, profilePhoto: profilePhoto };
}

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});
