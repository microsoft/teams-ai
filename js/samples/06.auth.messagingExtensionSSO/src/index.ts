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
    CardFactory,
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    MemoryStorage,
    MessagingExtensionAttachment,
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

import axios from 'axios';
import { ApplicationBuilder, DefaultTurnState } from '@microsoft/teams-ai';
import { createNpmPackageCard, createNpmSearchResultCard, createSignOutCard, createUserProfileCard } from './cards';
import { SimpleGraphClient } from './simpleGraphClient';

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder<DefaultTurnState>()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                connectionName: process.env.ConnectionName ?? '',
                title: 'Sign in',
                text: 'Please sign in to use the bot.',
                endOnInvalidMessage: true
            }
        },
        autoSignIn: (context: TurnContext) => {
            const signOutActivity = context.activity.value?.commandId === 'signOutCommand';
            if (signOutActivity) {
                return Promise.resolve(false);
            }

            return Promise.resolve(true);
        }
    })
    .build();

// Handles when the user makes a Messaging Extension query.
app.messageExtensions.query('searchCmd', async (_context: TurnContext, state: DefaultTurnState, query) => {
    const searchQuery = query.parameters.queryText ?? '';
    const count = query.count ?? 10;

    const results: MessagingExtensionAttachment[] = [];

    if (searchQuery == 'profile') {
        const token = state.temp.value.authTokens['graph'];
        if (!token) {
            throw new Error('No auth token found in state. Authentication failed.');
        }

        const user = await getUserDetailsFromGraph(token);
        const profileCard = CardFactory.thumbnailCard(user.displayName, CardFactory.images([user.profilePhoto]));

        results.push(profileCard);
    } else {
        const response = await axios.get(
            `http://registry.npmjs.com/-/v1/search?${new URLSearchParams({
                size: count.toString(),
                text: searchQuery
            }).toString()}`
        );

        // Format search results
        response?.data?.objects?.forEach((obj: any) => results.push(createNpmSearchResultCard(obj.package)));
    }

    // Return results as a list
    return {
        attachmentLayout: 'list',
        attachments: results,
        type: 'result'
    };
});

// Listen for item selection
app.messageExtensions.selectItem(async (_context: TurnContext, _state: DefaultTurnState, item) => {
    // Generate detailed result
    const card = createNpmPackageCard(item);

    // Return results
    return {
        attachmentLayout: 'list',
        attachments: [card],
        type: 'result'
    };
});

// Handles when the user clicks the Messaging Extension "Sign Out" command.
app.messageExtensions.fetchTask('signOutCommand', async (context: TurnContext, state: DefaultTurnState) => {
    await app.authentication.signOutUser(context, state, 'graph');

    const signoutCard = createSignOutCard();

    return {
        card: signoutCard,
        heigth: 100,
        width: 400,
        title: 'Adaptive Card: Inputs'
    };
});

// Handles the 'Close' button on the confirmation Task Module after the user signs out.
app.messageExtensions.submitAction('signOutCommand', async (_context: TurnContext, _state: DefaultTurnState) => {
    return null;
});

// Handles when the user clicks the Messaging Extension "Compose" command.
app.messageExtensions.fetchTask('showProfile', async (_context: TurnContext, state: DefaultTurnState) => {
    const token = state.temp.value.authTokens['graph'];
    if (!token) {
        throw new Error('No auth token found in state. Authentication failed.');
    }

    const user = await getUserDetailsFromGraph(token);
    const profileCard = createUserProfileCard(user.displayName, user.profilePhoto);

    return {
        card: profileCard,
        heigth: 250,
        width: 400,
        title: 'Show Profile Card'
    };
});

// Matches any link that ends in `.com`.
app.messageExtensions.queryLink(async (_context: TurnContext, state: DefaultTurnState, _url: string) => {
    const token = state.temp.value.authTokens['graph'];
    if (!token) {
        throw new Error('No auth token found in state. Authentication failed.');
    }

    const user = await getUserDetailsFromGraph(token);
    const profileCard = CardFactory.thumbnailCard(user.displayName, CardFactory.images([user.profilePhoto]));

    return {
        type: 'result',
        attachments: [profileCard],
        attachmentLayout: 'list'
    };
});

// Listen for item tap
app.messageExtensions.selectItem(async (_context: TurnContext, _state: DefaultTurnState, item) => {
    // Generate detailed result
    const card = createNpmPackageCard(item);

    // Return results
    return {
        attachmentLayout: 'list',
        attachments: [card],
        type: 'result'
    };
});

/**
 * Get the user details from Graph
 * @param {string} token The token to use to get the user details
 * @returns {Promise<{ displayName: string; profilePhoto: string }>} A promise that resolves to the user details
 */
async function getUserDetailsFromGraph(token: string): Promise<{ displayName: string; profilePhoto: string }> {
    // The user is signed in, so use the token to create a Graph Clilent and show profile
    const graphClient = new SimpleGraphClient(token);
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
