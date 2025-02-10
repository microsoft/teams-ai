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
    yarn install # only needs to be run once, after clone or remote pull
    yarn build
    ```

1. Duplicate the `sample.env` in this folder. Rename the file to `.env`.

1. Fill in the `.env` variables with your keys.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](https://github.com/microsoft/teams-ai/blob/main/getting-started/OTHER/BOTFRAMEWORK-EMULATOR.md) section.
For different ways to test a sample see: [Multiple ways to test](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER)

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
