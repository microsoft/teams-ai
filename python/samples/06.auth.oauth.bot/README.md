# OAuth Bot

This sample shows how to incorporate a basic conversational SSO flow into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK.

This sample requires creating an OAuth Connection in Azure Bot Service, which provides a token store to store the token after sign-in.

Note that this bot will only work in tenants where the following graph scopes are permitted:

-   `User.Read`

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [OAuth Bot](#oauth-bot)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Testing the sample](#testing-the-sample)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with this bot by sending it a message, which will echo back to you.


## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. Duplicate the `sample.env`. Rename the file to .env and fill in the variables with your keys.

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below. To read about other options, skip to [Other ways to run the sample](#other-ways-to-run-the-sample).

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](../README.md#testing-in-botframework-emulator) section.
For different ways to test a sample see: [Multiple ways to test](../README.md#multiple-ways-to-test)

### Using Teams Toolkit for Visual Studio Code 

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Install the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
1. Install [Poetry](https://python-poetry.org/docs/#installation)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Ensure that you have set up the sample from the previous step.
1. Trigger **Python: Create Environment** from command palette and create a virtual environment
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.