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
const responses = require("./responses");
// Create prediction engine
const predictionEngine = new botbuilder_m365_1.OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: path.join(__dirname, '../src/prompt.txt'),
    promptConfig: {
        model: "text-davinci-003",
        temperature: 0.0,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [" Human:", " AI:"],
    },
    topicFilter: path.join(__dirname, '../src/topicFilter.txt'),
    topicFilterConfig: {
        model: "text-davinci-003",
        temperature: 0.0,
        max_tokens: 128,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.0,
        stop: [" Human:", " AI:"],
    },
    logRequests: true
});
// Define storage and application
const storage = new botbuilder_1.MemoryStorage();
const app = new botbuilder_m365_1.Application({
    storage,
    predictionEngine
});
// Register action handlers
app.ai.action('LightsOn', (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    state.conversation.value.lightsOn = true;
    yield context.sendActivity(`[lights on]`);
    return true;
}));
app.ai.action('LightsOff', (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    state.conversation.value.lightsOn = false;
    yield context.sendActivity(`[lights off]`);
    return true;
}));
app.ai.action('Pause', (context, state, data) => __awaiter(void 0, void 0, void 0, function* () {
    const time = data.time ? parseInt(data.time) : 1000;
    yield context.sendActivity(`[pausing for ${time / 1000} seconds]`);
    yield new Promise((resolve) => setTimeout(resolve, time));
    return true;
}));
app.ai.action('LightStatus', (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    // Send the user a static response with the status of the lights.
    const response = responses.lightStatus(state.conversation.value.lightsOn);
    yield context.sendActivity(response);
    // Since we might be prompting the user with a followup question, we need to do
    // some surgery on the {{conversation.history}} to append a THEN SAY command. This
    // lets the model know we just asked the user a question and it can predict the
    // next action based on their response.
    botbuilder_m365_1.ConversationHistory.appendToLastLine(state, ` THEN SAY ${response}`);
    // End the current chain since we've manually just prompted the user for input.
    return false;
}));
// Register a handler to handle unknown actions that might be predicted
app.ai.action(botbuilder_m365_1.AI.UnknownActionName, (context, state, data, action) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.sendActivity(responses.unknownAction(action));
    return false;
}));
// Register a handler to deal with a user asking something off topic
app.ai.action(botbuilder_m365_1.AI.OffTopicActionName, (context, state) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.sendActivity(responses.offTopic());
    return false;
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