# Azure OpenAI On Your Data

The following is a conversational bot that uses the Azure OpenAI Chat Completions API `Azure OpenAI on Your Data` feature to facilitate RAG (retrieval augmentation) using Azure AI Search as the Azure data source.

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

This sample shows how to integrate your Azure AI Search index as a data source into prompt templates through the Azure Chat Completions API.

### Example Interaction

![example interaction](assets/example.png)

## Setting up the sample

> [!NOTE]
> Please note that at this time, this sample is only supported with Azure OpenAI.

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. Duplicate the `sample.env` in the `teams-ai/python/samples/04.ai.f.dataSource.azureOpenAI` folder. Rename the file to `.env`. 

3. Please note that at this time, this sample is only supported with Azure OpenAI. Fill the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` variables appropriately.

4. Follow the [use your data quickstart instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/use-your-data-quickstart?tabs=command-line%2Cpython-new&pivots=programming-language-studio#add-your-data-using-azure-openai-studio) to add your data using Azure OpenAI Studio. Select `Upload files` as the data source. You can upload the `nba.pdf` file. Take note of the index name.

5. Update `config.json` and `bot.py` with your model deployment name.

6. Update `config.json` by adding the missing fields in the `data_sources` property:

```json
"data_sources": [
    {
        "type": "azure_search",
        "parameters": {
            "endpoint": "AZURE-AI-SEARCH-ENDPOINT",
            "index_name": "nba",
            "authentication": {
                "type": "api_key",
                "key": "AZURE-AI-SEARCH-KEY"
            }
        }
    }
]
```

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