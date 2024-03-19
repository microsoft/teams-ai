# Chat with Azure AI Search Data
The following is a conversational bot that is hooked on to GPT models but with context provided by Azure AI Search data source.

## Summary
This sample shows how to integrate your Azure AI Search index as a data source into prompt templates. For this sample we're using dummy restaurant data indexed using Azure AI Search. The sample provides scripts to create and delete the dummy index.

### Example Interaction

![example interaction](assets/example.png)

### Observing the added context in the terminal

![The chat prompt and response](assets/prompt-response.png)

The object between the `<context></context>` tags is an entry from the restaurants index.

## Set up instructions
All the samples in the C# .NET SDK can be set up in the same way. You can find the step by step instructions here: [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your Azure OpenAI related settings to *appsettings.Development.json*. If you're debugging the project with the Test Tool then you can set these values in the `appsettings.TestTool.json` file.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>",
        "AISearchApiKey": "<your-azure-ai-search-api-key>",
        "AISearchApiEndpoint": "<your-azure-ai-search-endpoint>"
      }
    ```

2. Update `config.json`, `Program.cs`, and `AzureAISearchDataSource.cs` files with your gpt model deployment name and embedding deployment name where appropriate.

3. Before you can debug the sample you will have to have a working Azure AI Search instance with the `restaurants` index. To do that first navigate to the `AzureAISearchIndexer` project folder in the terminal. Then fill out the required values in the `appsetings.json` file. Then do `dotnet run -- create` to create the index with the required data.

4. Once you have the index created, you can debug the project. If you want to delete the index afterwards simply run the `dotnet run -- delete` command in the same folder.


## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
