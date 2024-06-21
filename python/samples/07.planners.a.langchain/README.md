# Teams LangChain Bot

A conversational bot for Microsoft Teams, designed as an AI assistant. The bot connects to a third-party service to turn a light on or off.

This sample illustrates more complex conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to user defined actions.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Teams LangChain Bot](#teams-langchain-bot)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with the bot by messaging it.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. Duplicate the `sample.env` in the `teams-ai/python/samples/07.planners.a.langchain` folder. Rename the file to `.env`. 

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
7. Ensure that you have set up the sample from the previous step.
8. Trigger **Python: Create Environment** from command palette and create a virtual environment
9. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
10. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.