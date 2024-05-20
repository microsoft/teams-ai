# <img src="https://media.githubusercontent.com/media/microsoft/teams-ai/main/assets/icon.png" width="100px"> Teams AI Library

[![Coverage Status](https://coveralls.io/repos/github/microsoft/teams-ai/badge.svg?branch=main)](https://coveralls.io/github/microsoft/teams-ai?branch=main)

| Name       | Status                                                                                                                                                                                                                                                                  | Package                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Javascript | [![Javascript Build Status](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_apis/build/status%2Fteams-ai%2Fmicrosoft.teams-ai.javascript?branchName=main)](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_build/latest?definitionId=5&branchName=main) | [NPM](https://www.npmjs.com/package/@microsoft/teams-ai)   |
| C#         | [![C# Build Status](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_apis/build/status%2Fteams-ai%2Fmicrosoft.teams-ai.dotnet?branchName=main)](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_build/latest?definitionId=4&branchName=main)             | [NuGet](https://www.nuget.org/packages/Microsoft.Teams.AI) |
| Python     | [![Build Status](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_apis/build/status%2Fteams-ai%2Fmicrosoft.teams-ai.python?branchName=main)](https://dev.azure.com/DomoreexpGithub/Github_Pipelines/_build/latest?definitionId=10&branchName=main)               | [PyPI](https://pypi.org/project/teams-ai/)                 |

Welcome to the Teams AI Library! This SDK is specifically designed to assist you in creating bots capable of interacting with Teams and Microsoft 365 applications. It is constructed using the [Bot Framework SDK](https://github.com/microsoft/botbuilder-js) as its foundation, simplifying the process of developing bots that interact with Teams' artificial intelligence capabilities.

![Teams AI flow diagram](https://github.com/microsoft/teams-ai/assets/14900841/154353ff-bafe-4423-abcd-6dc5a8680fe9)
This is a diagram of the Teams-AI flow. Teams AI Library SDK hooks into the Teams SDK and Azure OpenAI SDK to provide a seamless experience for developers.

The SDK is currently available for JavaScript/TypeScript applications in the [`js`](./js) folder and via the [teams-ai package on NPM](https://www.npmjs.com/package/@microsoft/teams-ai). .NET support is available in the [`dotnet`](./dotnet) folder and via the [teams-ai package on NuGet](https://www.nuget.org/packages/Microsoft.Teams.AI). Python support is available in the [`python`](./python) folder and via the [teams-ai package on Pypi](https://pypi.org/project/teams-ai/)

## Getting Started

> ### 🖇️ Jump right in❗️ 📎
>
> If you want to jump immediately into AI, try out the [04.ai.a.teamsChefbot](./js/samples/04.ai-apps/a.teamsChefBot) sample. This sample is a simple bot that uses the OpenAI GPT model to build a Teams app. Just load it up in Visual Studio Code, rename the sample.env file to .env, add in your OpenAI key or Azure OpenAI key and endpoint in the .env file, and hit F5! 🎉

### Start with our getting started guides

This SDK is now generally available. We welcome your feedback and contributions!

**To get started, head over to the [Getting Started Guide](getting-started/README.md).**

## Capabilities

### Teams-centric component scaffolding

> For examples of the below, browse through the [`js`](./js/samples/) sample folders, the [`dotnet`](./dotnet/samples) sample folders or the [`python`](./python/samples) sample folders.
> Simple scaffolding for any conversational app component, including:

- Chat bots
- Message Extensions
- Link unfurling
- Adaptive Cards

### Natural Language Modelling

The SDK is built to leverage OpenAI Large Language Models so you don't have to create your own. This saves you the complexity of processing natural language, and allows your users to talk to your app with their own words.

### Prompt Engineering

With a simple text file written in human language, you can describe the functionality of your app to cue OpenAI to focus on the right user intentions and provide relevant responses.

### Moderation

A configurable API call to filter inappropriate content for input content, output content, or both.

Moderators are available whether you decide to you OpenAI or Azure OpenAI for your models.

If using OpenAI see:

- [OpenAIModerator.ts](./js/packages/teams-ai/src/moderators/OpenAIModerator.ts)
- [OpenAIModerator.cs](./dotnet/packages/Microsoft.TeamsAI/Microsoft.TeamsAI/AI/Moderator/OpenAIModerator.cs)
- [openai_moderator.py](./python/packages/ai/teams/ai/moderators/openai_moderator.py).

For Azure's moderator, see:

- [AzureContentSafetyModerator.ts](./js/packages/teams-ai/src/moderators/AzureContentSafetyModerator.ts)
- [AzureContentSafetyModerator.cs](./dotnet/packages/Microsoft.TeamsAI/Microsoft.TeamsAI/AI/Moderator/AzureContentSafetyModerator.cs)
- [azure_content_safety_moderator.py](./python/packages/ai/teams/ai/moderators/azure_content_safety_moderator.py)

### Predictive Engine to Map Intents to Actions

Leveraging provided prompts and topic filters, it's simple to create a predictive engine that detects user intents and map them to relevant app actions, where you can focus your business logic. These actions are even possible to chain together to make building complex workflows easy.

### Conversational Session History

The state of your user's session is not lost, allowing conversations to flow freely and arrive quickly at right outcome.

### Localization

Because OpenAI's models are trained on the open internet, they're tuned to any language, saving you the cost of localization.

### LLM modularity

While the SDK handles OpenAI's GPT models out of the box, you can choose to swap to the LLM of your choice without touching any of your conversational app code.

## License

This SDK is licensed under the MIT License. This SDK includes tools to use APIs provided by third parties. These APIs are provided under their own separate terms.

- OpenAI API. Use of the OpenAI API requires an API key, which can be obtained from OpenAI. By using this SDK, you agree to abide by the OpenAI API Terms of Use and Privacy Policy. You can find them at [OpenAI Terms of Use](https://openai.com/policies/terms-of-use)
- Azure OpenAI Service. Use of the Azure OpenAI API requires an API key. By using this SDK, you agree to abide by the Azure OpenAI API terms. You can find them at [Azure OPENAI TOS](https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/MCA#ServiceSpecificTerms), and associated documentation at [Azure Cognitive Services](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/).

---

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit [https://cla.opensource.microsoft.com](https://cla.opensource.microsoft.com).

For more details, see [./CONTRIBUTING.md](./CONTRIBUTING.md).

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## Accessing daily builds

Please see [Daily Builds](https://github.com/microsoft/teams-ai/blob/main/docs/DAILYBUILDS.MD) for instructions on how to access daily builds.
