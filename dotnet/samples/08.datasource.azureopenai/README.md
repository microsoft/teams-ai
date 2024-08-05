# Azure OpenAI On Your Data
The following is a conversational bot that uses the Azure OpenAI Chat Completions API `Azure OpenAI on Your Data` feature to facilitate RAG (retrieval augmentation) using Azure AI Search as the Azure data source.

## Summary
This sample shows how to integrate your Azure AI Search index as a data source into prompt templates through the Azure Chat Completions API.

### Example Interaction

![example interaction](assets/example.png)


## Set up instructions
All the samples in the C# .NET SDK can be set up in the same way. You can find the step by step instructions here: [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your Azure OpenAI related settings to *appsettings.Development.json*. If you're debugging the project with the Test Tool then you can set these values in the *appsettings.TestTool.json* file.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>",
      }
    ```

2. Follow the [Use your data quickstart](https://learn.microsoft.com/en-us/azure/ai-services/openai/use-your-data-quickstart?tabs=command-line%2Cpython-new&pivots=programming-language-studio#add-your-data-using-azure-openai-studio) guide to add your data using Azure OpenAI Studio. Select `Upload files` as the data source. You can upload the `nba.pdf` file. Take note of the index name.

3. Update the `Prompts/Chat/config.json` file with the appropriate data source:

```json
"data_sources": [
    {
        "type": "azure_search",
        "parameters": {
            "endpoint": "", // The Azure AI Search service endpoint
            "index_name": "", // The index that was created in the previous step.
            "authentication": {
                "type": "api_key",
                "key": "" // The api key for authentication.
            }
        }
    }
]
```

You can also use `system_assigned_managed_identity` or `user_assigned_managed_identity` authentication methods.

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
