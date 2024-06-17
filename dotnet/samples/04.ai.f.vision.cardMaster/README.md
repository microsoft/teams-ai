# Card Gazer Bot

This is a conversational bot for Microsoft Teams with AI Vision support that is able to generate Adaptive Cards from uploaded images using gpt-4-vision-preview.
This sample illustrates more complex conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to user defined actions.


## Set up instructions

All the samples for the C# .NET SDK can be set up in the same way: You can find step by step instructions here:
 [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your Azure OpenAI related settings to *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>"
      }
    ```

## Interacting with the Bot

You can interact with this bot by sending it a message with an image or a doodle. Be sure to add a message like "Turn this image into an Adaptive Card". As an example, you can use the image included in the `./assets`` folder. Large resolution images will not work due to the limitations of the AI model.

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md).

Note that, this sample requires AI service so you need one more pre-step before deploy to Azure. To configure the Azure resources to have an environment variable for the Azure OpenAI Key and other settings:

1. In `./env/.env.dev.user` file, paste your Azure OpenAI related variables.

    ```bash
    SECRET_AZURE_OPENAI_API_KEY=
    SECRET_AZURE_OPENAI_ENDPOINT=
    ```

The SECRET_ prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

## Use OpenAI

Above steps use Azure OpenAI as AI service, optionally, you can also use OpenAI as AI service.

**As prerequisites**

1. Prepare your own OpenAI service.
1. Modify source code `Program.cs`, comment out the "*#Use Azure OpenAI*" part, and uncomment the "*#Use OpenAI*" part.

**For Local Debug (F5) with Teams Toolkit for Visual Studio**

1. Set your [OpenAI API Key](https://openai.com/api/) to *appsettings.Development.json*.

    ```json
      "OpenAI": {
        "ApiKey": "<your-openai-api-key>"
      },
    ```

**For Deploy to Azure with Teams Toolkit for Visual Studio**

To configure the Azure resources to have OpenAI environment variables:

1. In `./env/.env.dev.user` file, paste your [OpenAI API Key](https://openai.com/api/) to the environment variable `SECRET_OPENAI_KEY=`.

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)