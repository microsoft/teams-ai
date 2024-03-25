// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import debug from 'debug';
import * as restify from 'restify';
import { app } from './app';
import { TeamsAdapter } from '@microsoft/teams-ai';

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const log = debug('azureopenai:server');
log.log = console.log.bind(console);

// Create HTTP server.
const server = restify.createServer();
const port = process.env.port || process.env.PORT || 3978;

server.use(restify.plugins.bodyParser());

server.listen(port, () => {
    log(`listening on ${port} 🚀`);
    log('To test your bot in Teams, sideload the app manifest.json within Teams Apps.');
});

server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await (app.adapter as TeamsAdapter).process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});
