"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import required packages
const dotenv_1 = require("dotenv");
const path = require("path");
const restify = require("restify");
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const botbuilder_1 = require("botbuilder");
// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
(0, dotenv_1.config)({ path: ENV_FILE });
const botFrameworkAuthentication = new botbuilder_1.ConfigurationBotFrameworkAuthentication(process.env);
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
// Create storage to use
//const storage = new MemoryStorage();
// Catch-all for errors.
const onTurnErrorHandler = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    // Send a message to the user
    yield context.sendActivity('The bot encountered an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
});
// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;
// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});
const botbuilder_m365_1 = require("botbuilder-m365");
const cards_1 = require("./cards");
const axios_1 = require("axios");
// Define storage and application
const storage = new botbuilder_1.MemoryStorage();
const app = new botbuilder_m365_1.Application({
    storage
});
// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    const membersAdded = context.activity.membersAdded;
    for (let member = 0; member < membersAdded.length; member++) {
        // Ignore the bot joining the conversation
        if (membersAdded[member].id !== context.activity.recipient.id) {
            yield context.sendActivity(`Hello and welcome! With this sample you can see the functionality of static and dynamic search in adaptive card`);
        }
    }
}));
// Listen for messages that trigger returning an adaptive card
app.message(/dynamic/i, (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    const attachment = (0, cards_1.createDynamicSearchCard)();
    yield context.sendActivity({ attachments: [attachment] });
}));
app.message(/static/i, (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    const attachment = (0, cards_1.createStaticSearchCard)();
    yield context.sendActivity({ attachments: [attachment] });
}));
// Listen for query from dynamic search card
app.adaptiveCards.search('npmpackages', (context, state, query) => __awaiter(void 0, void 0, void 0, function* () {
    // Execute query
    const searchQuery = query.parameters.queryText;
    const response = yield axios_1.default.get(`http://registry.npmjs.com/-/v1/search?${new URLSearchParams({ text: searchQuery, size: '8' }).toString()}`);
    // Format search results
    const npmPackages = [];
    response.data.objects.forEach(obj => {
        const result = {
            title: obj.package.name,
            value: `${obj.package.name} - ${obj.package.description}`
        };
        npmPackages.push(result);
    });
    // Return search results
    return npmPackages;
}));
// Listen for submit buttons
app.adaptiveCards.actionSubmit('DynamicSubmit', (context, state, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.sendActivity(`Dynamically selected option is: ${data.choiceSelect}`);
}));
app.adaptiveCards.actionSubmit('StaticSubmit', (context, state, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.sendActivity(`Statically selected option is: ${data.choiceSelect}`);
}));
// Listen for ANY message to be received. MUST BE AFTER ANY OTHER HANDLERS
app.activity(botbuilder_1.ActivityTypes.Message, (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.sendActivity(`Try saying "static search" or "dynamic search".`);
}));
// Listen for incoming server requests.
server.post('/api/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Route received a request to adapter for processing
    yield adapter.process(req, res, (context) => __awaiter(void 0, void 0, void 0, function* () {
        // Dispatch to application for routing
        yield app.run(context);
    }));
}));
//# sourceMappingURL=index.js.map