# Teams Echo Bot

This sample shows how to incorporate a basic conversational flow into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Teams Echo Bot](#teams-echo-bot)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with the bot by messaging it and it will echo that back to you.

## Setting up the sample

1. Clone the repository

   ```bash
   git clone https://github.com/Microsoft/teams-ai.git
   ```

1. Follow below instructions to run the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below. To read about other options, skip to [Other ways to run the sample](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER).

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
1. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
1. In the debugger, play the Debug (Edge) script
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
