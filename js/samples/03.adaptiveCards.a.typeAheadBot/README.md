# Type-Ahead Search

This sample shows how to incorporate Adaptive Cards into a Microsoft Teams application using [Teams developer portal](https://dev.teams.microsoft.com) and the Teams AI SDK. Type-Ahead gives an enhanced search experience with Adaptive Cards to search and select data.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [Type-Ahead Search](#type-ahead-search)
    -   [Showcase](#showcase)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Using Teams Toolkit for Visual Studio Code](#teams-toolkit-for-visual-studio-code)
        -   [Prerequisites](#prerequisites)
        -   [Run the sample](#run-the-sample)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Other ways to run the sample](#other-ways-to-run-the-sample)
        -   [Using Teams Toolkit CLI](#teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manual-resource-management-and-uploading-to-teams)
        -   [Testing in BotFramework Emulator](#botframework-emulator)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

## Showcase

- You can interact by sending 'dynamic' or 'static' to the app. The app will respond with an Adaptive Card.
- Typing into the search box will filter the list of options. Selecting an option and submitting will send a message to the bot with the selected option(s).
- The Adaptive Cards used are `json` files located under `/src/cards`. You can use the Teams developer portal to design and host your Adaptive Cards.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

1. If you do not have `yarn` installed, install it globally

    ```bash
    npm install -g yarn@1.21.1
    ```

1. In the root **JavaScript folder**, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install #only needs to be run once, after clone or remote pull
    yarn build
    ```

1. In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    yarn start
    ```

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below. To read about other options, skip to [Other ways to run the sample](#other-ways-to-run-the-sample).

## Teams Toolkit for Visual Studio Code

Teams Toolkit automates the setup of Azure Bot Resources and provides a local development environment for your bot. It also provides a debugging experience in VS Code that allows you to test your bot in a Teams web client.

### Prerequisites

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)

### Run the sample
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
    - Running the debugger from the root of the repo will not work - you must open a new window at the sample's root.
1. Using the TTK extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps to Teams.
1. Further, detailed instructions can be found at [Getting Started - Teams Toolkit](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md)
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge).
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Interacting with the bot

You can interact with this bot by sending it a message. Send it a message of `dynamic` or `static` and it will respond with different Adaptive Cards.

An Adaptive Card will be sent to you with a search box. Typing into the search box will filter the list of options. Selecting an option and submitting will send a message to the bot with the selected option(s).

## Other ways to run the sample
### Teams Toolkit CLI

[TeamsFx command line interface](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-cli?pivots=version-two) is a text-based command line interface that accelerates Teams application development. It aims to provide keyboard centric experience while building Teams applications.

Navigate to [Teams Toolkit CLI](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md#teams-toolkit-cli) for setup instructions.

### Manual resource management and uploading to Teams

[Manual resource setup](../../../getting-started/OTHER/MANUAL-RESOURCE-SETUP.md) provides instructions on how to manually create the Azure Bot Resources and upload the app to Teams.

These directions are useful if you do not wish to use Teams Toolkit or you already have resources created and deployed.

If you are doing manual setup, you can ignore the `env` folder entirely.

### BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from channels when developing your bot if you do not wish to use Teams Toolkit.

[Running BF Emulator](../../../getting-started/OTHER/BOTFRAMEWORK-EMULATOR.md) directions provide instructions on how to run the bot in Emulator.

> Note: Emulator is channel-agnostic, meaning that features specific to Teams will not be testable in Emulator.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.
* Use the **Provision** and **Deploy** menus of the Teams Toolkit extension
* Run CLI commands `teamsfx provision` and `teamsfx deploy`.
* [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading
- [Typeahead Search in Adaptive Cards](https://learn.microsoft.com/microsoftteams/platform/task-modules-and-cards/cards/dynamic-search)
-   [Teams Toolkit overview](https://learn.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
