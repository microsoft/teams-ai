# Microsoft Teams Conversational Bot: DevOps Bot

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

This is a conversational bot for Microsoft Teams that demonstrates how you could build a DevOps bot. The bot uses the gpt-3.5-turbo model to chat with Teams users and perform DevOps action such as create, update, triage and summarize work items.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow AI to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

## Prerequisites

-   Microsoft Teams is installed and you have an account
-   [NodeJS](https://nodejs.org/en/)
-   [ngrok](https://ngrok.com/) or equivalent tunnelling solution

## To try this sample

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because
> the Teams service needs to call into the bot.

1. Clone the repository

    ```bash
    git clone https://github.com/microsoft/teams-ai.git
    ```

1. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    cd samples/04.ai.e.chainedActions.devOpsBot
    yarn start
    ```

    - If you already ran `yarn install` and `yarn build` in the `js` folder, you are ready to get started with ngrok. Otherwise, you need to run `yarn install` and `yarn build` in the `js` folder.

    Navigate to the sample directory

    `cd samples/04.ai.e.chainedActions.devOpsBot`

## Interacting with the bot

You can interact with this bot by sending it a message. The bot will respond to the following strings.

1. **create work item to track new functionality in Adaptive card and assign it to John**

-   **Result:** The bot will create a tracking item in Azure DevOps and assign it to John
-   **Valid Scopes:** personal, group chat, team chat

2. **update title of work item 1 to create a new bot in azure**

-   **Result:** The bot will update the title of work item 1 to create a new bot in azure.
-   **Valid Scopes:** personal, group chat, team chat

3. **triage work item 1 as "in progress"**

-   **Result:** The bot will update the state of work item 1 to "in progress".
-   **Valid Scopes:** personal, group chat, team chat

4. **summarize work items"**

-   **Result:** The bot will summarize the work items and respond back with an adaptive card.
-   **Valid Scopes:** personal, group chat, team chat

You can select an option from the command list by typing `@TeamsConversationBot` into the compose message area and `What can I do?` text above the compose area.

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

## Manually upload the app to a Teams desktop client

If you would prefer to create the Azure Bot Resources manually instead of automating via Teams Toolkit, read more information at [Manual resource setup](../../../getting-started/OTHER/MANUAL-RESOURCE-SETUP.md).

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

Visit the getting started documentation on [running BF Emulator](../../../getting-started/OTHER/BOTFRAMEWORK-EMULATOR.md) to learn how to use the tool.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure. Use the **Provision** and **Deploy** menus of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
