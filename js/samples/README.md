# Sample Library

The following samples highlight key capabilities of the M365 BotBuilder SDK.

## Basic Conversational Experiences

### Conversational Bots: [Echo Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/messaging/echoBot)

A conversational bot that listens for specific commands and offers a simple conversational flow: echoing the user's message back to them.

This sample illustrates basic conversational bot behavior in Microsoft Teams and shows the M365 BotBuilder SDK's ability to scaffold conversational bot components.

### Adaptive Cards: [Type Ahead Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/adaptiveCards/typeAheadBot)

A conversational bot that uses dynamic search to generate Adaptive Cards in Microsoft Teams.

This sample illustrates the M365 BotBuilder SDK's ability to scaffold conversational bot and Adaptive Card components.

### Message Extensions: [Search Command](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/messageExtensions/searchCommand)

A Message Extension (ME) built to search NPM for a specific package and return the result as an Adaptive Card.

This sample illustrates the M365 BotBuilder SDK's ability to scaffold search-based Message Extensions and return Adaptive Card components.

## AI-Powered Experiences

### Conversational AI w/Natural Language: [Hal9000 Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)

A conversational bot for Microsoft Teams, designed to mimic the AI character Hal 9000 from the movie "2001: A Space Odyssey". The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows M365 BotBuilder SDK capabilities like:

-   Conversational bot scaffolding
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history

### AI in Message Extensions: [GPT ME](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/gptME)

A Message Extension (ME) for Microsoft Teams that leverages the text-davinci-003 model to help users generate and update posts. The extension is designed to assist users in creating posts that are appropriate for a business environment.

This sample illustrates basic ME behavior in Microsoft Teams. The ME is built to allow GPT to facilitate the conversation by generating posts based on what the user requires. i.e., “Make my post sound more professional.”

It shows M365 botbuilder SDK capabilities like:

-   Message extension scaffolding
-   Action mapping
-   Prompt engineering

### Intent to Action Mapping: [Light On/Off AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/lightBot)

A conversational bot for Microsoft Teams, designed as an AI assistant. The bot connects to a third-party service to turn a light on or off. The bot is built using Node.js and the M365 BotBuilder library.

This sample illustrates more complex conversational bot behavior in Microsoft Teams than the Hal9000 sample. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to third party app skills.

It shows a broad range of M365 botbuilder SDK capabilities like:

-   Conversational bot scaffolding
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history
-   Topic filtering
-   Prediction engine mapping intents to actions with third party business logic
-   Mixing GPT-powered conversational responses with manually defined responses

### Chained Actions: [List Generator AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/listBot)

Similar to the Light On/Off sample, this is a conversational bot for Microsoft Teams, designed as an AI assistant. This bot showcases how to map intents to actions, but instead of returning text, it generates dynamically created Adaptive Cards as a response.

This sample illustrates complex conversational bot behavior in Microsoft Teams and showcases the richness of possibilities for responses.

It shows a broad range of M365 botbuilder SDK capabilities like:

-   Conversational bot scaffolding
-   Adaptive Cards
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history
-   Topic filtering
-   Prediction engine mapping intents to actions with third party business logic
-   Mixing GPT-powered conversational responses with manually defined responses
