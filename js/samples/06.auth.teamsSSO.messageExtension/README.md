# Teams Message Extension SSO Bot

This sample shows how to incorporate a basic Message Extension app with SSO into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Users can search npmjs for packages.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Teams Message Extension SSO Bot](#teams-message-extension-sso-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Test using Teams Toolkit for Visual Studio Code](#test-using-teams-toolkit-for-visual-studio-code)
  - [Deploy the bot to Azure](#deploy-the-bot-to-azure)
  - [Further reading](#further-reading)

<!-- /code_chunk_output -->

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

1. If you do not have `yarn` installed, install it globally

    ```bash
    npm install -g yarn@1.21.1
    ```

1. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install #only needs to be run once, after clone or remote pull
    yarn build
    ```

1. In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    ```

## Interacting with the bot

Type `profile` in the Message Extension's search box to show the current user's profile information.

## Test using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure. Use the **Provision** and **Deploy** menus of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
