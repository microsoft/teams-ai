# Chat Bot with Moderation Control

## Summary

This sample shows how to incorporate Content Safety control into a Microsoft Teams application.

## Set up instructions

All the samples in the C# .NET SDK can be set up in the same way. You can find the step by step instructions here: [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your Azure OpenAI related settings to *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>",
        "ContentSafetyApiKey": "<your-azure-content-safety-api-key>",
        "ContentSafetyEndpoint": "<your-azure-content-safety-endpoint>"
      }
    ```

## Interacting with the bot

You can interact with this bot by sending it a message. If you send it a message that contains inappropriate content, the bot will response with a moderation report that contains the inappropriate content:

![Moderation Report](./assets/moderation.png)


## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

Note that, this sample requires AI service so you need one more pre-step before deploy to Azure. To configure the Azure resources to have an environment variable for the Azure OpenAI Key and other settings:

1. In `./env/.env.dev.user` file, paste your Azure OpenAI related variables.

    ```bash
    SECRET_AZURE_OPENAI_API_KEY=
    SECRET_AZURE_OPENAI_ENDPOINT=
    SECRET_AZURE_CONTENT_SAFETY_API_KEY=
    SECRET_AZURE_CONTENT_SAFETY_ENDPOINT=
    ```

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

## Use OpenAI

Above steps use Azure OpenAI as AI service, optionally, you can also use OpenAI as AI service.

**As prerequisites**

1. Get an OpenAI api key.

**For debugging (F5)**

1. Set your [OpenAI API Key](https://platform.openai.com/settings/profile?tab=api-keys) to *appsettings.Development.json*.

    ```json
      "OpenAI": {
        "ApiKey": "<your-openai-api-key>"
      },
    ```

**For deployment to Azure**

To configure the Azure resources to have OpenAI environment variables:

1. In `./env/.env.dev.user` file, paste your [OpenAI API Key](https://platform.openai.com/settings/profile?tab=api-keys) to the environment variable `SECRET_OPENAI_KEY=`.

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
