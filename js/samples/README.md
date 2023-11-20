# Sample Library

The following samples highlight key capabilities of the Teams AI SDK.

## Basic Conversational Experiences

### Conversational Bots: [Echo Bot](01.messaging.a.echoBot/)

A conversational bot that listens for specific commands and offers a simple conversational flow: echoing the user's message back to them.

This sample illustrates basic conversational bot behavior in Microsoft Teams and shows the Teams AI SDK's ability to scaffold conversational bot components.

### Adaptive Cards: [Type Ahead Bot](02.messageExtensions.a.searchCommand/)

A Message Extension (ME) built to search NPM for a specific package and return the result as an Adaptive Card.

This sample illustrates the Teams AI SDK's ability to scaffold search-based Message Extensions and return Adaptive Card components.

### Message Extensions: [Search Command](03.adaptiveCards.a.typeAheadBot/)

A conversational bot that uses dynamic search to generate Adaptive Cards in Microsoft Teams.

This sample illustrates the Teams AI SDK's ability to scaffold conversational bot and Adaptive Card components.

## AI-Powered Experiences

### Conversational AI w/Natural Language: [Chef bot](04.ai.a.teamsChefBot/)

A conversational bot for Microsoft Teams, designed as a helper bot for building Teams app. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows Teams AI SDK capabilities like:

-   Conversational bot scaffolding
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history

### AI in Message Extensions: [GPT ME](04.ai.b.messageExtensions.aime/)

A Message Extension (ME) for Microsoft Teams that leverages the text-davinci-003 model to help users generate and update posts. The extension is designed to assist users in creating posts that are appropriate for a business environment.

This sample illustrates basic ME behavior in Microsoft Teams. The ME is built to allow GPT to facilitate the conversation by generating posts based on what the user requires. i.e., “Make my post sound more professional.”

It shows Teams AI SDK capabilities like:

-   Message extension scaffolding
-   Action mapping
-   Prompt engineering

### Intent to Action Mapping: [Light On/Off AI Assistant](04.ai.c.actionMapping.lightBot/)

A conversational bot for Microsoft Teams, designed as an AI assistant. The bot connects to a third-party service to turn a light on or off. The bot is built using Node.js and the Teams AI SDK library.

This sample illustrates more complex conversational bot behavior in Microsoft Teams than the Santa sample. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to third party app skills.

It shows a broad range of Teams AI SDK capabilities like:

-   Conversational bot scaffolding
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history
-   Topic filtering
-   Prediction engine mapping intents to actions with third party business logic
-   Mixing GPT-powered conversational responses with manually defined responses

### Chained Actions: [List Generator AI Assistant](04.ai.d.chainedActions.listBot/)

Similar to the Light On/Off sample, this is a conversational bot for Microsoft Teams, designed as an AI assistant. This bot showcases how to map intents to actions, but instead of returning text, it generates dynamically created Adaptive Cards as a response.

This sample illustrates complex conversational bot behavior in Microsoft Teams and showcases the richness of possibilities for responses.

It shows a broad range of Teams AI SDK capabilities like:

-   Conversational bot scaffolding
-   Adaptive Cards
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history
-   Topic filtering
-   Prediction engine mapping intents to actions with third party business logic
-   Mixing GPT-powered conversational responses with manually defined responses

### Chained Actions: [DevOps AI Assistant](04.ai.e.chainedActions.devOpsBot)

Similar to the List Generator AI Assistant sample, this is a conversational bot for Microsoft Teams, designed as an AI assistant. This bot showcases how to map intents to actions, but instead of returning text, it generates dynamically created Adaptive Cards as a response.

This sample illustrates complex conversational bot behavior in Microsoft Teams and showcases the richness of possibilities for responses.

It shows a broad range of Teams AI SDK capabilities like:

-   Conversational bot scaffolding
-   Adaptive Cards
-   Natural language modelling
-   Prompt engineering
-   Localization across languages
-   Conversational session history
-   Topic filtering
-   Prediction engine mapping intents to actions with third party business logic
-   Mixing GPT-powered conversational responses with manually defined responses

## OpenAI Assistants

### Basic Assistant: [Math Tutor Assistant](06.ai.a.assistants.mathBot/)

This example shows how to create a basic conversational experience using OpenAI's Assistants API's. It leverages OpenAI's Code Interpreter tool to create an assistant that's an expert on math.

### Assistant with Actions: [Food Ordering Assistant](06.ai.a.assistants.orderBot/)

This example shows how to create a conversational assistant that uses tools to call actions in your bots code. It's a food ordering assistant for a fictional restaurant called The Pub and is capable of complex interactions with the user as it takes their order.
