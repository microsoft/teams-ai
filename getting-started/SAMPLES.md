# Samples

_**Navigation**_

- [00.OVERVIEW](./README.md)
- [CONCEPTS](./CONCEPTS/README.md)
- [MIGRATION](./MIGRATION/README.md)
- [QUICKSTART](./QUICKSTART.md)
- [**SAMPLES**](./SAMPLES.md)
- [OTHER](./OTHER/README.md)

---

> [!IMPORTANT]
> If you plan to contribute to the package and develop locally, you can modify the sample projects to avoid dependency issues. Before running a sample in Teams Toolkit, modify the `teamsapp.local.yml` and remove the step to run `npm install`. The Teams AI repo uses Yarn instead and `yarn install` is run in the `/js` directory instead.

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

| Name                               | Description                                                                                       | Languages Supported                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _Echo bot_                         | Bot that echos back the users message.                                                            | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/01.getting-started/a.echoBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/01.messaging.echoBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/01.messaging.a.echoBot) |
| _Search Command Message Extension_ | Message Extension to search NPM for a specific package and return the result as an Adaptive Card. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/02.teams-features/a.messageExtensions.searchCommand), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/02.messageExtensions.a.searchCommand), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/02.messageExtensions.a.searchCommand)                                                       |
| _Type-Ahead Bot_                   | Bot that shows how to incorporate Adaptive Cards into the coversational flow.                     | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/02.teams-features/b.adaptiveCards.typeAheadBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/03.adaptiveCards.a.typeAheadBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/03.adaptiveCards.a.typeAheadBot)                                                                 |

## AI Concepts

These samples showcase the AI features supported by the library. It builds on the basics of implementing conversational bots and message extensions.

| Name                    | Description                                                                                                | Languages Supported                                                                                                                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| _Twenty Questions Bot_  | Bot that plays a game of twenty questions with the user.                                                   | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/a.twentyQuestions), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.e.twentyQuestions), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/04.ai.a.twentyQuestions)                                                                                                                       |
| _AI Message Extensions_ | Message Extension that leverages GPT models to help users generate and update posts.                       | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/b.AI-messageExtensions), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.b.messageExtensions.gptME), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/04.ai.b.messageExtensions.AI-ME) |
| _Light Bot_             | Bot that can switch the light on or off. It uses AI to map users message to predefined actions (or skills) | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/c.actionMapping-lightBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.c.actionMapping.lightBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/04.ai.c.actionMapping.lightBot) |
| _List Bot_              | Bot that helps the user maintain task lists. It can add, remove, update, and search lists and tasks.       | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/d.chainedActions-listBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/04.ai.d.chainedActions.listBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/04.ai.d.chainedActions.listBot)                                                                                                      |
| _Llama Model_           | Bot that exemplifies how users can create custom models for other LLMs.                                    | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/e.customModel-LLAMA)                                                                                                                                                                                                                |
| _Chat Moderation Bot_   | Bot that shows how to incorporate content safety control when using AI features.                           | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/03.ai-concepts/f.chatModeration), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/05.chatModeration)                                                                                                                           |

## AI Apps

| Name                 | Description                                                                                                                                                                                             | Languages Supported                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| _Teams Chef Bot_     | Bot that helps the user build Teams apps by answering queries against external data source.                                                                                                             | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/a.teamsChefBot)                                                                                                       |
| _DevOps Bot_         | Bot that helps the user perform DevOps actions such as create, update, triage and summarize work items.                                                                                                 | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/b.devOpsBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/04.ai.e.chainedActions.devOpsBot)                                                                                                          |
| _Card Gazer Bot_     | Bot with AI vision support that is able to generate Adaptive Cards from uploaded images by using GPT vision models.                                                                                     | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/c.vision-cardGazer)                                                                                                   |
| _Math Tutor Bot_     | Bot that is an expert in math. It uses OpenAI's Assisstants API.                                                                                                                                        | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/d.assistants-mathBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.assistants.a.mathBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/06.assistants.a.mathBot)   |
| _Food Ordering Bot_  | Bot that can take a food order for a fictional restaurant called The Pub.                                                                                                                               | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/e.assistants-orderBot), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.assistants.b.orderBot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/06.assistants.b.orderBot) |
| **Advanced Samples** | The samples below combine advanced features such as AI, user authentication, basic conversational bot and message extension capabilities, resulting in their complexity.                                |                                                                                                                                                                                                  |
| _Who Bot_            | Bot that can tell you who your manager is, when's your next meeting...etc. It will authenticate that user, use AI to map user intents to actions in which it will call Graph to get specific user data. | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/f.whoBot)                                                                                                             |
| _Azure AI Search_    | Q&A over your Azure AI Search data.                                                                                                                                                                     | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/g.datasource-azureAISearch)                                                                                           |
| _Azure AI Search_    | Q&A over Azure data sources through `Azure OpenAI on Your Data`.                                                                                                                                        | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai-apps/h.datasource-azureOpenAI)                                                                                             |

## User Authentication Samples

Being able to access user specific data from other third party services is a cruicial capability of any Teams app. These samples showcase the different ways to authenticate a user to third party services such as Microsoft Graph.

There are two approaches to user authentication: `OAuth` and `TeamsSSO`.

The `OAuth` approach requires creating an OAuth connection in the Azure Bot service. It uses the Bot Framework's token service to handle the OAuth2.0 flow on behalf of the bot server.

The `TeamsSSO` approach implements the OAuth 2.0 protocol within the bot web server itself. It gives you more flexibility on how to configure Azure Active Directory (AAD), like using a client certificate. There is no need to create an OAuth connection in Azure Bot service.

Both of these approaches can be used to achieve the same functionality, such as using the SSO flow to authenticate the user.

| Name                         | Description                                                                                                 | Languages Supported                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _OAuth Bot_                  | User authentication in a conversational bot with the `OAuth` apporach.                                      | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/05.authentication/a.oauth-adaptiveCard), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.oauth.bot), [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/06.auth.oauth.bot)                        |
| _OAuth Adaptive Card Bot_    | User authentication in a conversational bot using ACv2 cards (Adaptive Cards v2) with the `OAuth` approach. | [JS](05.authentication/b.oauth-bot)                                                                                                                                                                                    |
| _OAuth Message Extension_    | User authentication in a message extension with the `OAuth` approach.                                       | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/05.authentication/c.oauth-messageExtension), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.oauth.messageExtension). [PY](https://github.com/microsoft/teams-ai/tree/main/python/samples/06.auth.oauth.messageExtensions)       |
| _TeamsSSO Bot_               | User authentication in a conversational bot using the `TeamsSSO` approach.                                  | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/06.auth.teamsSSO.bot), [C#](https://github.com/microsoft/teams-ai/tree/main/js/samples/05.authentication/d.teamsSSO-bot)                               |
| _TeamsSSO Message Extension_ | User authentication in a message extension with the `TeamsSSO` approach.                                    | [JS](https://github.com/microsoft/teams-ai/tree/main/js/samples/05.authentication/e.teamsSSO-messageExtension), [C#](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/06.auth.teamsSSO.messageExtension) |
