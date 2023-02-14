# BotBuilder-M365

This SDK is designed to help you build bots that can interact with Teams and Microsoft 365 apps. It is built on top of the [Bot Framework SDK](https://github.com/microsoft/botbuilder-js) to make it easier to build Teams and M365-interacting bots.

The SDK also facilitates the creation of bots that uses an [OpenAI](https://openai.com/api/) API key to provide an AI-driven conversational experience, or the same using Azure Foundry.

This SDK is currently in preview and is subject to change. We welcome your feedback and contributions!

## Capabilities

### Teams-Centric Component Scaffolding

Simple scaffolding for any conversational app component, inlcuding:

* Chat bots
* Message extensions
* Link unfurling
* Adaptive Cards

Relevant samples:

* [Type Ahead Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/adaptiveCards/typeAheadBot)
* [Echo Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/messaging/echoBot)
* [Search Command](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/messageExtensions/searchCommand)
* [GPT ME](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/gptME)

### Natural Language Modelling

The SDK is built to leverage OpenAI Large Language Models so you don't have to create your own. This saves you the complexity of processing natural language, and allows your users to talk to your app with their own words.

Relevant samples:

* [Hal9000](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)

### Prompt Engineering

With a simple text file written in human language, you can describe the functionality of your app to cue OpenAI to focus on the right user intentions and provide relevant responses.

Relevant samples:

* [Hal9000](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)
* [Lights On/Off AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/lightBot)
* [List Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/listBot)

### Topic Filtering

A simple text file can also be used to steer OpenAI in the right direction and keep the conversation on track.

Relevant samples:

* [Lights On/Off AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/lightBot)
* [List Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/listBot)

### Predictive Engine to Map Intents to Actions

Leveraging provided prompts and topic filters, it's simple to create a predictive engine that detects user intents and map them to relevant app actions, where you can focus your business logic. These actions are even possible to chain together to make building complex workflows easy.

Relevant samples:

* [Lights On/Off AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/lightBot)
* [List Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/listBot)

### Conversational Session History

The state of your user's session is not lost, allowing conversations to flow freely and arrive quickly at right outcome. 

Relevant samples:

* [Hal9000](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)

### Localization

Because OpenAI's models are trained on the open internet, they're tuned to any language, saving you the cost of localization.

Relevant samples:

* [Hal9000](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)

### LLM modularity

While the SDK handles OpenAI's GPT models out of the box, you can choose to swap to the LLM of your choice without touching any of your conversational app code.

Relevant samples:

* [Hal9000](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/hal9000)
* [Lights On/Off AI Assistant](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/lightBot)
* [List Bot](https://github.com/microsoft/botbuilder-m365/tree/main/js/samples/ai/listBot)

## Getting Started

Head over to the js folder to see the SDK code and try out our samples.

During FHL, we're looking for feedback and robust samples that can showcase best practices and common scenarios for using this SDK with OpenAI. The [OfficeDev](https://github.com/orgs/OfficeDev/repositories?language=&q=microsoft-teams-apps&sort=&type=all) repo has many Teams samples that we should re-engineer to use this SDK.

FHL samples will be considered for adding to our samples category in this repo.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
