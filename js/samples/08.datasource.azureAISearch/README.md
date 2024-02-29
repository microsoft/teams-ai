# Chat with Azure AI Search Data
The following is a conversational bot that is hooked on to GPT models but with context provided by Azure AI Search data source.
<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Chat with Azure AI Search Data](#chat-with-azure-ai-search-data)
  - [Summary](#summary)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Summary
This sample shows how to integrate your Azure AI Search index as a data source into prompt templates.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    ```

3. In a terminal, navigate to the sample root.

    ```bash
    cd teams-ai/js/samples/08.datasource.azureAISearch/
    ```
4. Duplicate the `sample.env` in the `teams-ai/js/samples/08.datasource.azureAISearch/` folder. Rename the file to `.env`. 

5. Fill the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_ENDPOINT` variables appropriately.

6. Update `config.json` and `index.ts` with your gpt model deployment name and embedding deployment name.

7. Do `yarn indexer:create` to create the restaurant index. Once you're done using the sample it's good practice to delete the index. Can you do so with the `yarn indexer:delete` command.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](../README.md#testing-in-botframework-emulator) section.
For different ways to test a sample see: [Multiple ways to test](../README.md#multiple-ways-to-test)

### Using Teams Toolkit for Visual Studio Code 

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Ensure that you have set up the sample from the previous step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.