# Microsoft Teams Conversational Bot with AI: Teams Chef Bot

> Please note: this sample is still being tweaked and therefore not setup with Teams Toolkit yet. We'll get it updated ASAP!

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [Microsoft Teams Conversational Bot with AI: Teams Chef](#microsoft-teams-conversational-bot-with-ai-teams-chef)
    -   [Summary](#summary)
    -   [Prerequisites](#prerequisites)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Multiple ways to test](#multiple-ways-to-test)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        -   [Using Teams Toolkit CLI](#using-teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Testing in BotFramework Emulator](#testing-in-botframework-emulator)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

## Summary

This is a conversational bot for Microsoft Teams that thinks it's a Chef to help you cook apps using the Teams AI Library. The bot uses the `gpt-3.5-turbo` model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates how to use [Retrieval Augmented Generation (RAG)](https://en.wikipedia.org/wiki/Prompt_engineering#Retrieval-augmented_generation) to easily inject contextual relevant information into the prompt sent to the model. This results in better and more accurate replies from the bot.

The sample uses a local Vector Database, called [Vectra](https://github.com/Stevenic/vectra), and [Semantic Search](https://en.wikipedia.org/wiki/Semantic_search) to find the most relevant information to include in the prompt for the users input. The index can be found in `./index/teams-ai` and includes all of the projects Getting Started docs and the source code for the Teams AI Library. This means you can ask the Teams Chef Bot anything about the library and it can answer it. You can even ask it to write sample code for you!

The sample shows Teams AI SDK capabilities like:

<details open>
    <summary><h3>Conversational bot scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a simple conversational bot, like storage, authentication, and conversation state.
</details>

Open the panel below to learn fine-tuned details on how this sample works.

<details>
    <summary><h3>Natural language modelling</h3></summary>
    Notice that outside of one '\history' command, the 'index.ts' file relies on AI for all its natural language modelling - no code is specifically written to handle language processing. Rather, a 'predictionEngine' is defined to handle this for you:

```javascript
// Create AI components
const planner = new OpenAIPlanner({
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-3.5-turbo',
    logRequests: true
});

const promptManager = new DefaultPromptManager(path.join(__dirname, '../src/prompts'));

// Define storage and application
const storage = new MemoryStorage();
const app =
    new Application() <
    ApplicationTurnState >
    {
        storage,
        ai: {
            planner,
            promptManager,
            prompt: 'chat',
            history: {
                assistantHistoryType: 'text'
            }
        }
    };
```

</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
    Inside the 'predictionEngine', a prompt file is defined:

```javascript
prompt: path.join(__dirname, '../src/prompt.txt'),
```

Open the 'prompt.txt' file to find descriptive prompt engineering that, in plain language and with minor training, instructs the AI how the bot should conduct itself and facilitate conversation:

#### prompts/chat/skprompt.txt

```text
The following is a conversation with an AI assistant, its name is Teams Chef.
Teams Chef is an expert in Microsoft Teams apps development and the Human is junior developer learning Microsoft Teams development for the first time.
Teams Chef should always reply by explaining new concepts in simple terms using cooking as parallel concepts.
Teams Chef should always greet the human, ask them their name, and then guide the junior developer in his journey to build new apps for Microsoft Teams.

{{$history}}
Human: {{$input}}
AI:
```

</details>
<details open>
    <summary><h3>Conversational session history</h3></summary>
    Because this sample leaves the conversation to the AI  assistant, the bot simply facilitates user conversation as-is. But because it includes the 'prompt.txt' file to guide it, the AI  assistant will store and leverage session history appropriately. From the 'prompt.txt' file:

```
Conversation history:
{{conversation.history}}
```

For example, let's say the user's name is "Dave". The bot might carry on the following conversation:

```
AI: Hi there! My name is Teams Chef. It's nice to meet you. What's your name?
DAVE: My name is Dave.
AI:Hi Dave! It's great to meet you. Let me help you get started with Microsoft Teams app development. Have you ever cooked before?
DAVE: No, not yet, why?
AI:Cooking is a great way to learn how to develop apps for Microsoft Teams. Just like cooking, developing apps requires you to have the right ingredients and tools, and to follow a set of instructions. It also requires creativity and problem-solving skills. So, let's get started! What would you like to learn first?
DAVE: Which kind of apps can I build for Microsoft Teams?
AI: Great question! You can build a variety of apps for Microsoft Teams, including bots, messaging extensions, tabs, and connectors. Bots are like the main course of your app - they provide the core functionality. Messaging extensions are like side dishes - they add extra features to your app. Tabs are like garnishes - they provide additional information or visuals. And connectors are like spices - they allow you to integrate with other services.
```

Notice that the bot remembered Dave's first message when responding to the second.

</details>
<details open>
    <summary><h3>Localization across languages</h3></summary>
    Because this sample leverages AI for all its natural language modelling, the user can talk to an AI bot in any language of their choosing. The bot will understand and respond appropriately with no additional code required.
</details>

## Prerequisites

-   Global Administrator access to a [Microsoft 365 tenant](https://developer.microsoft.com/microsoft-365/dev-program?ocid=MSlearn&WT.mc_id=m365-16105-cxa) with [uploading Teams custom apps enabled](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant#enable-custom-teams-apps-and-turn-on-custom-app-uploading?WT.mc_id=m365-84637-cxa).
-   VS Code [Teams Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/install-teams-toolkit?tabs=vscode&pivots=visual-studio-code) extension installed
-   [NodeJS](https://nodejs.org/en/)
-   [OpenAI](https://openai.com/api/) key for leveraging AI

> Note: this sample uses OpenAI where the other samples use Azure OpenAI. This is due to AI Embeddings not yet being fully implemented in Teams AI for Azure OpenAI services.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    ```

3. In a terminal, navigate to the sample root.

    ```bash
    cd teams-ai/js/samples/04.ai.teamsChefBot/
    yarn start
    ```

## Interacting with the bot

Interacting with the bot is simple - talk to it! You can invoke it by using @ mention and talk to it in plain language.

The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation. This is possible due to the `skprompts.txt` file's contents.

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below.

## Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

### Prerequisites

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
    - Note that running the debugger from the root of the repo will not work - you must open a new window at the sample's root.
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Add required environment variables to the `.env` file AND the `env/.env.local.user` files (e.g. `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, etc.). For more information see [Getting Started - Teams Toolkit](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md)
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge).
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Using Teams Toolkit CLI

You can also use the Teams Toolkit CLI to run this sample.

Navigate to [Teams Toolkit CLI](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md#teams-toolkit-cli) for running samples via the CLI tool.

### Manually upload the app to a Teams desktop client

If you would prefer to create the Azure Bot Resources manually instead of automating via Teams Toolkit, read more information at [Manual resource setup](../../../getting-started/OTHER/MANUAL-RESOURCE-SETUP.md).

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

Visit the getting started documentation on [running BF Emulator](../../../getting-started/OTHER/BOTFRAMEWORK-EMULATOR.md) to learn how to use the tool.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions or use the Teams Toolkit to help you: [Deploy a Microsoft Teams app to Azure by using Teams Toolkit for Visual Studio Code](https://learn.microsoft.com/en-us/training/modules/teams-toolkit-vsc-deploy-apps/)

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
-   [Build a bot by using Teams Toolkit for Visual Studio Code](https://learn.microsoft.com/en-us/training/modules/teams-toolkit-vsc-create-bot/)
