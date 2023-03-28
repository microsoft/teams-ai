# BotBuilder-M365

This SDK is designed to help you build bots that can interact with Teams and Microsoft 365 apps. It is built on top of the [Bot Framework SDK](https://github.com/microsoft/botbuilder-js) to make it easier to build Teams and M365-interacting bots.

The SDK also facilitates the creation of bots that uses an [OpenAI](https://openai.com/api/) API key to provide an AI-driven conversational experience, or the same using Azure Foundry.

This SDK is under private preview and is subject to change. We welcome your feedback and contributions!

**To get started, head over to the [00.Migration](getting-started/00.MIGRATION.md) guide.**

## Capabilities

### Teams-Centric Component Scaffolding

> For examples of the below, browse through the [dotnet samples](./dotnet/samples) or [JS](./js/samples/) folders.
> Simple scaffolding for any conversational app component, inlcuding:

- Chat bots
- Message extensions
- Link unfurling
- Adaptive Cards

### Natural Language Modelling

The SDK is built to leverage OpenAI Large Language Models so you don't have to create your own. This saves you the complexity of processing natural language, and allows your users to talk to your app with their own words.

### Prompt Engineering

With a simple text file written in human language, you can describe the functionality of your app to cue OpenAI to focus on the right user intentions and provide relevant responses.

### Topic Filtering

A simple text file can also be used to steer OpenAI in the right direction and keep the conversation on track.

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
