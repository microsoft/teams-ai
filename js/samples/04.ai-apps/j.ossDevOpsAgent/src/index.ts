// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { ConfigurationServiceClientCredentialFactory, ConversationReference, TurnContext } from 'botbuilder';
import { TeamsAdapter } from '@microsoft/teams-ai';

import * as bot from './bot';
import { createPullRequestCard } from './cards';

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

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
    await context.sendActivity(
        'The bot encountered an error or bug. To continue to run this bot, please fix the bot source code.'
    );
};

bot.adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nTo test your bot in Teams, sideload the app manifest.json within Teams Apps.');
});

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    await bot.adapter.process(req, res as any, async (context: TurnContext) => {
        await bot.run(context);
    });
});

// Endpoint to GitHub repository webhook
server.post('/api/webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    // Handle pull request assigning events
    if (event === 'pull_request' && (payload.action === 'assigned')) {        
        const adaptiveCard = createPullRequestCard(payload);

        const conversationReference: Partial<ConversationReference> = { 
            conversation: { name: 'GitHub Webook', id: bot.conversation_id, conversationType: 'personal', isGroup: false }, 
            serviceUrl: bot.service_url 
        };

        bot.adapter.continueConversationAsync(process.env.BOT_ID!, conversationReference, async (context) => {
            await context.sendActivity({ attachments: [adaptiveCard] });
        });
    }

    (res as restify.Response).send(200, 'Event received');
});