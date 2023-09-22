# Teams Type-Ahead Bot

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [Teams Type-Ahead Bot](#teams-type-ahead-bot)
    -   [Summary](#summary)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Multiple ways to test](#multiple-ways-to-test)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

## Summary

This sample shows how to incorporate Adaptive Cards into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Type-Ahead bot gives an enhanced search experience with Adaptive Cards to search and select data.

![screenshot](./assets/screenshot.PNG)

## How to use

Once the sample is running, you can interact by sending 'dynamic' or 'static' to the app. The app will respond with an Adaptive Card. Typing into the search box will filter the list of options. Selecting an option and submitting will send a message to the bot with the selected option(s).

## Interacting with the bot

You can interact with this bot by sending it a message. Send it a message of `dynamic` or `static` and it will respond with different Adaptive Cards.

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below.

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Install the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Run `poetry install` under the root of this sample, switch to the created virtual environment when you see a notification from Python extension.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.


## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)