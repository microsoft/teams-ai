# Azure OpenAI On Your Data

The following is a custom copilot that uses the Azure OpenAI Chat Completions API ‘Azure OpenAI On Your Data’ feature to facilitate RAG (retrieval augmented generation).
You can chat with your data in Azure AI Search, Azure Blob Storage, URL/web address, Azure Cosmos DB for MongoDB vCore, uploaded files, and Elasticsearch.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [Azure OpenAI On Your Data](#azure-openai-on-your-data)
    -   [Summary](#summary)
        -   [Example Interaction](#example-interaction)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Testing the sample](#testing-the-sample)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Summary

This sample shows how to integrate your search index as a data source into prompt templates through the Azure Chat Completions API.

> Note: this sample uses managed identity, ensure your Azure OpenAI and AI Search services are configured properly https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely

### Example Interaction

![example interaction](assets/example.png)

## Setting up the sample

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

1. Duplicate the `sample.env` in the `teams-ai/js/samples/<this-sample's>/<directory>` folder. Rename the file to `.env`.

> [!NOTE]
> Please note that at this time, this sample is only supported with Azure OpenAI.

1. Fill the `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_ENDPOINT`, and `AZURE_SEARCH_INDEX` variables appropriately.

1. Verify you are logged into azure cli. This is required because this sample uses managed identity. You can download and install Azure CLI from [Azure CLI docs](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli). For more information on setting up environment variables, see the [Azure SDK documentation](https://github.com/Azure/azure-sdk-for-go/wiki/Set-up-Your-Environment-for-Authentication).

1. Follow the [use your data quickstart instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/use-your-data-quickstart?tabs=command-line%2Cpython-new&pivots=programming-language-studio#add-your-data-using-azure-openai-studio) to add your data using Azure OpenAI Studio. Select `Upload files` as the data source. You can upload the `nba.pdf` file. Take note of the index name.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

1. Fill the `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_ENDPOINT`, and `AZURE_SEARCH_INDEX` in the `./env/.env.local.user` file.
1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Copy this sample into a new folder outside of teams-ai
1. Select File > Open Folder in VS Code and choose this sample's directory
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Ensure that you have set up the sample from the previous step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
