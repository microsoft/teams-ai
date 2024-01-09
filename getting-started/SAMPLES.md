# Samples

_**Navigation**_
- [00.OVERVIEW](./README.md)
- [01.QUICKSTART](./QUICKSTART.md)
- [**02.SAMPLES**](./SAMPLES.md)
___


After completing the quickstart guide, the next step is to try out the samples. 

Samples are E2E teams apps that are easy to set up locally. There are various samples to showcase the different features supported.

The following is a list of all the samples we support organized into four categories. If you are new to the library it is recommended to start with the basic samples.

When you are ready to dive into the AI Samples, try the fully conversational Teams Chef Bot sample that illustrates how to use Retrieval Augmentation Generation to ground the AI model’s answers in custom documents and datasets.

- [Samples](#samples)
  - [Basic Samples](#basic-samples)
  - [AI Samples](#ai-samples)
  - [User Authentication Samples](#user-authentication-samples)
  - [Advanced Samples](#advanced-samples)

## Basic Samples

These samples showcase basic functionalities to build message extensions and conversational bots.

| Name                               | Description                                                                                       | Languages Supported                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *Echo bot*                         | Bot that echos back the users message.                                                            | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/01.messaging.a.echoBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/01.messaging.echoBot)                               |
| *Search Command Message Extension* | Message Extension to search NPM for a specific package and return the result as an Adaptive Card. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/02.messageExtensions.a.searchCommand), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/02.messageExtensions.a.searchCommand) |
| *Type-Ahead Bot*                   | Bot that shows how to incorporate Adaptive Cards into the coversational flow.                     | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.adaptiveCards.a.typeAheadBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/03.adaptiveCards.a.typeAheadBot)           |

## AI Samples

These samples showcase the AI features supported by the library. It builds on the basics of implementing conversational bots and message extensions.

| Name                   | Description                                                                                                         | Languages Supported                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *Teams Chef Bot*       | Bot that helps the user build Teams apps by answering queries against external data source.                         | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.a.teamsChefBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.a.teamsChefBot)                         |
| *AI Message Extension* | Message Extension that leverages GPT models to help users generate and update posts.                                | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.b.messageExtensions.AI-ME), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.b.messageExtensions.gptME)   |
| *Light Bot*            | Bot that can switch the light on or off. It uses AI to map users message to predefined actions (or skills)          | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.c.actionMapping.lightBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.c.actionMapping.lightBot)     |
| *List Bot*             | Bot that helps the user maintain task lists. It can add, remove, update, and search lists and tasks.                | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.d.chainedActions.listBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.d.chainedActions.listBot)     |
| *DevOps Bot*           | Bot that helps the user perform DevOps actions such as create, update, triage and summarize work items.             | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.e.chainedActions.devOpsBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.e.chainedActions.devOpsBot) |
| *Card Master Bot*      | Bot with AI vision support that is able to generate Adaptive Cards from uploaded images by using GPT vision models. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.f.vision.cardMaster)                                                                                                               |
| *Twenty Questions Bot* | Bot that plays a game of twenty questions with the user.                                                            | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.e.twentyQuestions), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.e.twentyQuestions)                         |
| *Chat Moderation Bot*  | Bot that shows how to incorporate content safety control when using AI features.                                    | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/05.chatModeration)                                                                                                                       |
| *Math Tutor Bot*       | Bot that is an expert in math. It uses OpenAI's Assisstants API.                                                    | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.assistants.a.mathBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.assistants.a.mathBot)                   |
| *Food Ordering Bot*    | Bot that can take a food order for a fictional restaurant called The Pub.                                           | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.assistants.b.orderBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.assistants.b.orderBot)                 |

## User Authentication Samples

Being able to access user specific data from other third party services is a cruicial capability of any Teams app. These samples showcase the different ways to authenticate a user to third party services such as Microsoft Graph.

There are two approaches to user authentication: `OAuth` and `TeamsSSO`.

The `OAuth` approach requires creating an OAuth connection in the Azure Bot service. It uses the Bot Framework's token service to handle the OAuth2.0 flow on behalf of the bot server.

The `TeamsSSO` approach implements the OAuth 2.0 protocol within the bot web server itself. It gives you more flexibility on how to configure Azure Active Directory (AAD), like using a client certificate. There is no need to create an OAuth connection in Azure Bot service.

Both of these approaches can be used to achieve the same functionality, such as using the SSO flow to authenticate the user.

| Name                         | Description                                                                                                 | Languages Supported                                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *OAuth Bot*                  | User authentication in a conversational bot with the `OAuth` apporach.                                      | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.oauth.bot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.oauth.bot)                                 |
| *OAuth Message Extension*    | User authentication in a message extension with the `OAuth` approach.                                       | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.oauth.messageExtension), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.oauth.messageExtension)       |
| *OAuth Adaptive Card Bot*    | User authentication in a conversational bot using ACv2 cards (Adaptive Cards v2) with the `OAuth` approach. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.oauth.adaptiveCard)                                                                                                                |
| *TeamsSSO Bot*               | User authentication in a conversational bot using the `TeamsSSO` approach.                                  | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.teamsSSO.bot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.teamsSSO.bot)                           |
| *TeamsSSO Message Extension* | User authentication in a message extension with the `TeamsSSO` approach.                                    | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.teamsSSO.messageExtension), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.teamsSSO.messageExtension) |

## Advanced Samples

These samples a combination of advanced features such as AI, user authentication, basic conversational bot and message extension capabilities, resulting in their complexity.

| Name      | Description                                                                                                                                                                                             | Languages Supported                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| *Who Bot* | Bot that can tell you who your manager is, when's your next meeting...etc. It will authenticate that user, use AI to map user intents to actions in which it will call Graph to get specific user data. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/07.whoBot) |
