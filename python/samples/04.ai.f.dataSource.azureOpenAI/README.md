# Azure OpenAI On Your Data (OYD)

The following is a custom copilot that uses the Azure OpenAI Chat Completions API ‘Azure OpenAI On Your Data’ feature to facilitate RAG (retrieval augmented generation).
You can chat with your data in Azure AI Search, Azure Blob Storage, URL/web address, Azure Cosmos DB for MongoDB vCore, uploaded files, and Elasticsearch.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Azure OpenAI On Your Data](#azure-openai-on-your-data-oyd)
  - [Summary](#summary)
    - [Example Interaction](#example-interaction)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Summary

This sample shows how to integrate your search index as a data source into prompt templates through the Azure Chat Completions API.

> Note: this sample uses managed identity, ensure your Azure OpenAI and AI Search services are configured properly https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely

### Add your data to the prompt template

The Azure OpenAI OYD configuration can be added to the prompt templates `config.json`:

```json
{
  "schema": 1.1,
  "description": "Chat with Teams RAG",
  "type": "completion",
  "completion": {
      "model": "gpt-4o",
      "completion_type": "chat",
      "include_history": true,
      "include_input": true,
      "max_input_tokens": 4096,
      "max_tokens": 1000,
      "temperature": 0.9,
      "top_p": 0.0,
      "presence_penalty": 0.6,
      "frequency_penalty": 0.0,
      "stop_sequences": [],
      "data_sources": [
          {
              "type": 'azure_search',
              "parameters": {
                  "endpoint": "",
                  "index_name": "",
                  "semantic_configuration": 'default',
                  "query_type": 'simple',
                  "fields_mapping": { },
                  "in_scope": True,
                  "strictness": 3,
                  "top_n_documents": 5,
                  "authentication": {
                      "type": 'system_assigned_managed_identity'
                  }
              }
          }
      ]
  },
  "augmentation": {
      "augmentation_type": "none"
  }
}
```

You can also dynamically add this configuration like this:

```py
# gets prompt template and adds data source config
async def get_default_prompt(context: TurnContext, state: AppTurnState, planner: ActionPlanner) -> PromptTemplate:
    prompt = await prompts.get_prompt("chat")

    prompt.config.completion.model = 'gpt-4o'

    if config.AZURE_SEARCH_ENDPOINT:
        prompt.config.completion.data_sources = [
            {
                "type": 'azure_search',
                "parameters": {
                    "endpoint": config.AZURE_SEARCH_ENDPOINT,
                    "index_name": config.AZURE_SEARCH_INDEX,
                    "semantic_configuration": 'default',
                    "query_type": 'simple',
                    "fields_mapping": { },
                    "in_scope": True,
                    "strictness": 3,
                    "top_n_documents": 5,
                    "role_information": Path(__file__).resolve().parent.joinpath('../src/prompts/chat/skprompt.txt').read_text(encoding='utf-8'),
                    "authentication": {
                        "type": 'system_assigned_managed_identity'
                    }
                }
            }
        ]

    return prompt
```

Then in the `ActionPlannerOptions`, set `default_prompt=get_default_prompt`:

```py
ActionPlannerOptions(model=model, prompts=prompts, default_prompt=get_default_prompt)
```

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

3. Fill the `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_ENDPOINT`, and `AZURE_SEARCH_INDEX` variables appropriately.

4. Follow the [use your data quickstart instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/use-your-data-quickstart?tabs=command-line%2Cpython-new&pivots=programming-language-studio#add-your-data-using-azure-openai-studio) to add your data using Azure OpenAI Studio. Select `Upload files` as the data source. You can upload the `nba.pdf` file. Take note of the index name.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](../README.md#testing-in-botframework-emulator) section.
For different ways to test a sample see: [Multiple ways to test](../README.md#multiple-ways-to-test)

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Fill the `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_ENDPOINT`, and `AZURE_SEARCH_INDEX` in the `./env/.env.local.user` file.
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
