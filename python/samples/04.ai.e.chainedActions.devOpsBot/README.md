# Microsoft Teams Conversational Bot: DevOps Bot

This is a conversational bot for Microsoft Teams that demonstrates how you could build a DevOps bot. The bot uses the gpt-3.5-turbo model to chat with Teams users and perform DevOps action such as create, update, triage and summarize work items. This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Microsoft Teams Conversational Bot: DevOps Bot](#microsoft-teams-conversational-bot-devops-bot)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with this bot by sending it a message. The bot will respond to the following strings.

1. **create work item to track new functionality in Adaptive card and assign it to John**

- **Result:** The bot will create a tracking item in Azure DevOps and assign it to John
- **Valid Scopes:** personal, group chat, team chat

2. **update title of work item 1 to create a new bot in azure**

- **Result:** The bot will update the title of work item 1 to create a new bot in azure.
- **Valid Scopes:** personal, group chat, team chat

3. **triage work item 1 as "in progress"**

- **Result:** The bot will update the state of work item 1 to "in progress".
- **Valid Scopes:** personal, group chat, team chat

4. **summarize work items"**

- **Result:** The bot will summarize the work items and respond back with an adaptive card.
- **Valid Scopes:** personal, group chat, team chat

You can select an option from the command list by typing `@TeamsConversationBot` into the compose message area and `What can I do?` text above the compose area.

## Setting up the sample

1. Clone the repository

   ```bash
   git clone https://github.com/Microsoft/teams-ai.git
   ```

2. Duplicate the `sample.env` in the `teams-ai/python/samples/04.ai.e.chainedActions.devOpsBot` folder. Rename the file to `.env`.

3. If you are using OpenAI then only keep the `OPENAI_KEY` and add in your key. Otherwise if you are using AzureOpenAI then only keep the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` variables and fill them in appropriately.

4. Update `config.json` and `bot.py` with your model deployment name.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](../README.md#testing-in-botframework-emulator) section.
For different ways to test a sample see: [Multiple ways to test](../README.md#multiple-ways-to-test)

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
2. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
3. Install the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
4. Install [Poetry](https://python-poetry.org/docs/#installation)
5. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
6. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
7. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
8. In the debugger, play the Debug (Edge) script
9. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
10. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
