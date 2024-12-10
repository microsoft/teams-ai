# Chat with Azure AI Search Data

The following is a conversational bot that is hooked on to GPT models but with context provided by Azure AI Search data source.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Chat with Azure AI Search Data](#chat-with-azure-ai-search-data)
    - [Summary](#summary)
        - [Example Interaction](#example-interaction)
        - [Observing the added context in the terminal](#observing-the-added-context-in-the-terminal)
    - [Setting up the sample](#setting-up-the-sample)
    - [Testing the sample](#testing-the-sample)
        - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Summary

This sample shows how to integrate your Azure AI Search index as a data source into prompt templates. For this sample we're using dummy restaurant data indexed using Azure AI Search. The sample provides scripts to create and delete the dummy index.

### Example Interaction

![example interaction](assets/example.png)

### Observing the added context in the terminal

![The chat prompt and response](assets/prompt-response.png)

The object between the `<context></context>` tags is an entry from the restaurants index.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

> [!IMPORTANT]
> To prevent issues when installing dependencies after cloning the repo, copy or move the sample directory to it's own location first.
> If you opened this sample from the Sample Gallery in Teams Toolkit, you can skip to step 3.

1. If you do not have `yarn` installed, and want to run local bits, install it globally

    ```bash
    npm install -g yarn@1.21.1
    ```

1. In the root **JavaScript folder**, install and build all dependencies

    ```bash
    cd teams-ai/js
    # This will use the latest changes from teams-ai in the sample.
    yarn install #only needs to be run once, after clone or remote pull
    yarn build
    # To run using latest published version of teams-ai, do the following instead:
    cd teams-ai/js/samples/<this-sample-folder>
    npm install --workspaces=false
    npm run build
    ```

1. In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    yarn start
    # If running the sample on published version of teams-ai
    npm start
    ```

1. Update any prompt `config.json` and `/src/index.ts` with your model deployment name.

> [!NOTE]
> Please note that at this time, this sample is only supported with Azure OpenAI.

1. Fill the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_ENDPOINT` in the `.env` file, copied from `sample.env`.

1. Run `yarn indexer:create` or `npm run indexer:create` to create the restaurant index. Once you're done using the sample it's good practice to delete the index. You can do so with the `yarn indexer:delete` command.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide.

Otherwise, if want to learn about the other ways to test a sample, use Teams Toolkit or Teams Toolkit CLI, and more, please see our documentation on [different ways to run samples](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER#different-ways-to-run-the-samples).

To use Teams Toolkit, continue following the directions below.

### Using Teams Toolkit for Visual Studio Code

1. Fill the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_ENDPOINT` in the `./env/.env.local.user` file.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Copy this sample into a new folder outside of teams-ai
1. Select File > Open Folder in VS Code and choose this sample's directory
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
