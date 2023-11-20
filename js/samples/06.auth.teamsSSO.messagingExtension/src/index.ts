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
    ConfigurationServiceClientCredentialFactory,
    MemoryStorage,
    MessagingExtensionAttachment,
    MessagingExtensionResult,
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

import axios from 'axios';
import { ApplicationBuilder, AuthError, TurnState } from '@microsoft/teams-ai';
import { createNpmPackageCard, createNpmSearchResultCard, createSignOutCard } from './cards';
import { GraphClient } from './graphClient';

interface ConversationState {
    count: number;
}
type ApplicationTurnState = TurnState<ConversationState>;

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder<ApplicationTurnState>()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                scopes: ['User.Read'],
                msalConfig: {
                    auth: {
                        clientId: process.env.AAD_APP_CLIENT_ID!,
                        clientSecret: process.env.AAD_APP_CLIENT_SECRET!,
                        authority: `${process.env.AAD_APP_OAUTH_AUTHORITY_HOST}/${process.env.AAD_APP_TENANT_ID}`,
                    }
                },
                signInLink: `https://${process.env.BOT_DOMAIN}/auth-start.html`,
                endOnInvalidMessage: true
            }
        }
    })
    .build();

// Handles when the user makes a Messaging Extension query.
app.messageExtensions.query('searchCmd', async (_context: TurnContext, state: TurnState, query) => {
    const searchQuery = query.parameters.queryText ?? '';
    const count = query.count ?? 10;

    const results: MessagingExtensionAttachment[] = [];

    if (searchQuery == 'profile') {
        const token = state.temp.authTokens['graph'];
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
    } as MessagingExtensionResult;
});

// Listen for item selection
app.messageExtensions.selectItem(async (_context: TurnContext, _state: TurnState, item) => {
    // Generate detailed result
    const card = createNpmPackageCard(item);

    // Return results
    return {
        attachmentLayout: 'list',
        attachments: [card],
        type: 'result'
    } as MessagingExtensionResult;
});

// Handles when the user clicks the Messaging Extension "Sign Out" command.
app.messageExtensions.fetchTask('signOutCommand', async (context: TurnContext, state: ApplicationTurnState) => {
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
app.messageExtensions.submitAction('signOutCommand', async (_context: TurnContext, _state: TurnState) => {
    return null;
});

app.authentication.get('graph').onUserSignInSuccess(async (context: TurnContext, state: ApplicationTurnState) => {
    // Successfully logged in
    await context.sendActivity('Successfully logged in');
    await context.sendActivity(`Token string length: ${state.temp.authTokens['graph']!.length}`);
    await context.sendActivity(`This is what you said before the AuthFlow started: ${context.activity.text}`);
});

app.authentication
    .get('graph')
    .onUserSignInFailure(async (context: TurnContext, _state: ApplicationTurnState, error: AuthError) => {
        // Failed to login
        await context.sendActivity('Failed to login');
        await context.sendActivity(`Error message: ${error.message}`);
    });


/**
 * Get the user details from Graph
 * @param {string} token The token to use to get the user details
 * @returns {Promise<{ displayName: string; profilePhoto: string }>} A promise that resolves to the user details
 */
async function getUserDetailsFromGraph(token: string): Promise<{ displayName: string; profilePhoto: string }> {
    // The user is signed in, so use the token to create a Graph Clilent and show profile
    const graphClient = new GraphClient(token);
    const profile = await graphClient.getMyProfile();
    const profilePhoto = await graphClient.getProfilePhotoAsync ();
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

server.get(
    "/auth-:name(start|end).html",
    restify.plugins.serveStatic({
      directory: path.join(__dirname, "public"),
    })
  );
