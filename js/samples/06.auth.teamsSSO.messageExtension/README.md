# Teams Search Command Message Extension with SSO

This sample shows how to incorporate a basic Message Extension app with SSO into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Users can search npmjs for packages.

This sample depends on Teams SSO and gives you more flexibility on how to configure AAD, like using a client certificate. There is no need to create an OAuth Connection in Azure Bot Service to run this sample.

## Showcase
- Message Extensions are convenient ways to add functionality to Teams.
- This sample adds a search command to the compose area of a chat.
- This sample leverages Teams SSO to acquire a token to call Microsoft Graph APIs.

> Note: this is not a chat bot and therefore the bot does not respond if you talk to it. Once it is installed in Teams, you can interact with it by selecting it's app icon in the chat compose area.

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

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

## Teams Toolkit for Visual Studio Code

Teams Toolkit automates the setup of Azure Bot Resources and provides a local development environment for your bot. It also provides a debugging experience in VS Code that allows you to test your bot in a Teams web client.

### Prerequisites

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)

### Run the sample
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
    - Running the debugger from the root of the repo will not work - you must open a new window at the sample's root.
1. Using the TTK extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps to Teams.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge).
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Interacting with the bot

In a chat window (not the bot's chat window) select the app's icon in the chat compose area. This opens a dialog that allows you to search NPM for a package. Selecting a package will output an Adaptive Card with it's description to the chat.

If you type `profile` in the Message Extension's search box, it will show your profile in search result.

## Other ways to run the sample
### Teams Toolkit CLI

[TeamsFx command line interface](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-cli?pivots=version-two) is a text-based command line interface that accelerates Teams application development. It aims to provide keyboard centric experience while building Teams applications.

Navigate to [Teams Toolkit CLI](../../../getting-started/OTHER/TEAMS-TOOLKIT.md#teams-toolkit-cli) for setup instructions.

### Manual resource management and uploading to Teams

[Manual resource setup](../../../getting-started/OTHER/MANUAL-RESOURCE-SETUP.md) provides instructions on how to manually create the Azure Bot Resources and upload the app to Teams.

These directions are useful if you do not wish to use Teams Toolkit or you already have resources created and deployed.

If you are doing manual setup, you can ignore the `env` folder entirely.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.
* Use the **Provision** and **Deploy** menus of the Teams Toolkit extension
* Run CLI commands `teamsfx provision` and `teamsfx deploy`.
* [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

- [Message Extensions overview](https://docs.microsoft.com/microsoftteams/platform/messaging-extensions/what-are-messaging-extensions)
-   [Teams Toolkit overview](https://learn.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
