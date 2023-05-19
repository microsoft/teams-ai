# <image src="https://github.com/microsoft/teams-ai/assets/14900841/31453242-4da6-424b-97a3-8a66207f8d20)" height="10%" width="10%" /> Teams AI SDK

Welcome to the Teams AI SDK! This SDK is designed to help you build bots that can interact with Teams and Microsoft 365 apps. It is built on top of the [Bot Framework SDK](https://github.com/microsoft/botbuilder-js) to make it easier to build Teams AI-interacting bots.

For now, code-availability is limited to the [`js`](./js/) folder. **dotnet parity is in production and will be available soon.**

The SDK also facilitates the creation of bots that uses an [OpenAI](https://openai.com/api/) API key to provide an AI-driven conversational experience, or the same using Azure Foundry.

This SDK is under public preview and is subject to change. We welcome your feedback and contributions!

## Getting Started

To get started, check out the getting started table of contents.

0. Migration](getting-started/00.MIGRATION.md) - if you have an existing bot, this guide will help you migrate to this SDK.
1. **\*** [AI Setup](getting-started/01.AI-SETUP.md) - if you're starting from scratch, this guide will help you <large>**get started with AI**</large>.
2. [API-Reference](getting-started/02.API-REFERENCE.md) - this guide will help you understand the API reference.
3. [Prompt injection](getting-started/03.PROMPT-INJECTION.md) - this guide will help you learn the basics of avoiding prompt injection in your bot.

# Join us for the Global Teams Hackathon event

To sign up, visit [https://aka.ms/hack-together-teams](https://aka.ms/hack-together-teams).

> HackTogether is your playground for coding and experimenting with Microsoft Teams. With mentorship from Microsoft experts and access to the latest tech, you will learn how to build Teams apps based on the top Microsoft Teams app scenarios. The possibilities are endless for what you can create... plus you can submit your hack for a chance to win exciting prizes! 🥳

## License

This SDK is licensed under the MIT License. This SDK includes tools to use APIs provided by third parties. These APIs are provided under their own separate terms.

- OpenAI API. Use of the OpenAI API requires an API key, which can be obtained from OpenAI. By using this SDK, you agree to abide by the OpenAI API Terms of Use and Privacy Policy. You can find them at [OpenAI Terms of Use](https://openai.com/policies/terms-of-use)
- Azure OpenAI Service. Use of the Azure OpenAI API requires an API key. By using this SDK, you agree to abide by the Azure OpenAI API terms. You can find them at [Azure OPENAI TOS](https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/MCA#ServiceSpecificTerms), and associated documentation at [Azure Cognitive Services](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/).

---

## Capabilities

### Teams-Centric Component Scaffolding

> For examples of the below, browse through the [JS](./js/samples/) folders.
> Simple scaffolding for any conversational app component, inlcuding:

- Chat bots
- Message Extensions
- Link unfurling
- Adaptive Cards

### Natural Language Modelling

The SDK is built to leverage OpenAI Large Language Models so you don't have to create your own. This saves you the complexity of processing natural language, and allows your users to talk to your app with their own words.

### Prompt Engineering

With a simple text file written in human language, you can describe the functionality of your app to cue OpenAI to focus on the right user intentions and provide relevant responses.

### Moderation

A configurable API call to filter inappropriate content for input content, output content, or both. (See [OpenAIModerator.ts](./js/src/openai/OpenAIModerator.ts))

### Predictive Engine to Map Intents to Actions

Leveraging provided prompts and topic filters, it's simple to create a predictive engine that detects user intents and map them to relevant app actions, where you can focus your business logic. These actions are even possible to chain together to make building complex workflows easy.

### Conversational Session History

The state of your user's session is not lost, allowing conversations to flow freely and arrive quickly at right outcome.

### Localization

Because OpenAI's models are trained on the open internet, they're tuned to any language, saving you the cost of localization.

### LLM modularity

While the SDK handles OpenAI's GPT models out of the box, you can choose to swap to the LLM of your choice without touching any of your conversational app code.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

For more details, see [./CONTRIBUTING.md](./CONTRIBUTING.md).

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
