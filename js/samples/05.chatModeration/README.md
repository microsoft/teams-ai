# Chat Bot with Moderation Control

This sample shows how to incorporate Azure Open AI Content Safety control into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [Chat Moderation Bot](#chat-bot-with-moderation-control)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Multiple ways to test](#multiple-ways-to-test)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        -   [Using Teams Toolkit CLI](#using-teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Testing in BotFramework Emulator](#testing-in-botframework-emulator)
        -   [Directions](#directions)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

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
    cd teams-ai/js/samples/05.chatModeration/
    yarn start
    ```

## Interacting with the bot

You can interact with this bot by sending it a message. It will respond with a message that is either safe or unsafe, depending on the content of the message.

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

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure. Use the **Provision** and **Deploy** menus of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
