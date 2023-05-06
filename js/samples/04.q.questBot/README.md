# Quest Bot

This sample recreates a [text-based](https://en.wikipedia.org/wiki/Text-based_game) adventure game.

Start the game by sending a message to the bot, then interact with the game by sending messages.

To end the game and start over, send `/reset` in your message.

## Prerequisites

- Microsoft 365 tenant with sideload custom apps enabled
- [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) for Visual Studio Code V5
- [OpenAI](https://platform.openai.com/account/api-keys) API Key

> We recommend that you use a Microsoft 365 Developer Tenant for developing apps for Microsoft Teams. [Join the Microsoft 365 Developer Program](https://learn.microsoft.com/office/developer-program/microsoft-365-developer-program) which includes a Microsoft 365 E5 developer subscription that you can use to create your own sandbox and develop solutions independent of your production environment.

## Run locally

- Clone this repository.
- Open the `04.e.twentyQuestions` sample folder in Visual Studio Code.
- Open `env/env.local.user` file.
- Set the value of the `SECRET_OPENAI_API_KEY` variable with your own key.
- Start a debug session by pressing <kbd>F5</kbd>, or using the `Run and Debug` feature in Visual Studio Code.
- Follow the prompts on screen to side load the app into Microsoft Teams.

## Deploy to Azure

> This requires you to have an active Azure subcription

- Open `env/env.dev.user` file.
- Set the value of the `SECRET_OPENAI_API_KEY` variable with your own key.
- Open the Teams Toolkit from the sidebar.
- Locate the `Lifecycle` section.
- Use the `Provision` feature to provision Azure resources.
- Use the `Deploy` feature to deploy the bot source code.
- Use the `Publish` feature to submit the app to the organisational store.
- Follow the steps to [publish](https://learn.microsoft.com/microsoftteams/submit-approve-custom-apps#approve-the-submitted-app) the submitted app in the [Microsoft Teams Admin Center](https://admin.teams.microsoft.com).
- Navigate to the [Microsoft Teams app store](https://teams.microsoft.com/_#/apps), locate the app in the `Built for your org` section and install the app.