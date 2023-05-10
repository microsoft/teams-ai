# Teams Conversation Bot

Bot Framework v4 Conversation Bot sample for Teams.

This bot has been created using [Bot Framework](https://dev.botframework.com). This sample shows
how to incorporate basic conversational flow into a Teams application. It also illustrates a few of the Teams specific calls you can make from your bot.

## Prerequisites

- Microsoft 365 tenant with sideload custom apps enabled
- [NodeJS](https://nodejs.org/en/) (version 16.x)
- [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) for Visual Studio Code

> We recommend that you use a Microsoft 365 Developer Tenant for developing apps for Microsoft Teams. [Join the Microsoft 365 Developer Program](https://learn.microsoft.com/office/developer-program/microsoft-365-developer-program) which includes a Microsoft 365 E5 developer subscription that you can use to create your own sandbox and develop solutions independent of your production environment.

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/botbuilder-m365.git
    ```

1. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd botbuilder-m365/js
    yarn install
    yarn build
    ```

1. In a terminal, navigate to `samples/js/samples/messaging/searchCommand`

    ```bash
    cd samples/js/samples/messaging/searchCommand
    ```

1. Open the folder in VS Code with the Teams Toolkit extension already installed

    ```bash
    code .
    ```
1. Select the Teams Toolkit icon on the left. In the account section, sign-in with your Microsoft 365 account. You don't need to to sign in to Azure.

1. Select F5 or **Run > Start Debugging** in VS Code to launch the app in a Teams web client.

## Interacting with the bot

Chat with the bot and say the term `static search` or `dynamic search` to try the bot.

## Deploy the bot to Azure

- Open the Teams Toolkit from the sidebar.
- In the `Account` section, sign in with your Azure account.
- Locate the `Lifecycle` section.
- Use the `Provision` feature to provision Azure resources.
- Use the `Deploy` feature to deploy the bot source code.
- Use the `Publish` feature to submit the app to the organisational store.
- Follow the steps to [publish](https://learn.microsoft.com/microsoftteams/submit-approve-custom-apps#approve-the-submitted-app) the submitted app in the [Microsoft Teams Admin Center](https://admin.teams.microsoft.com).
- Navigate to the [Microsoft Teams app store](https://teams.microsoft.com/_#/apps), locate the app in the `Built for your org` section and install the app.

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
