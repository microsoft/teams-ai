# Microsoft Teams Conversational Bot with AI: Teams Chef

## Summary

This is a conversational bot for Microsoft Teams that thinks it's a Chef to help you cook Teams apps. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows SDK capabilities like:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'Program.cs' file you'll see the scaffolding created to run a simple conversational bot, e.g. storage, authentication, and conversation state.
</details>

</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The 'Prompts/Chat/skprompt.txt' file has descriptive prompt engineering that, in plain language and with minor training, instructs GPT how the bot should conduct itself and facilitate conversation.

#### skprompt.txt

```text
The following is a conversation with an AI assistant, its name is Teams Chef.
Teams Chef is an expert in Microsoft Teams apps development and the Human is junior developer learning Microsoft Teams development for the first time.
Teams Chef should always reply by explaining new concepts in simple terms using cooking as parallel concepts.
Teams Chef should always greet the human, ask them their name, and then guide the junior developer in his journey to build new apps for Microsoft Teams.

{{$history}}
Human: {{$input}}
AI:
```

</details>
<details open>
    <summary><h3>Conversational session history</h3></summary>
    Because this sample leaves the conversation to GPT, the bot simply facilitates user conversation as-is. But because it includes the 'skprompt.txt' file to guide it, GPT will store and leverage session history appropriately.

For example, let's say the user's name is "Dave". The bot might carry on the following conversation:

```
AI: Hi there! My name is Teams Chef. It's nice to meet you. What's your name?
DAVE: My name is Dave.
AI:Hi Dave! It's great to meet you. Let me help you get started with Microsoft Teams app development. Have you ever cooked before?
DAVE: No, not yet, why?
AI:Cooking is a great way to learn ...
DAVE: Which kind of apps can I build for Microsoft Teams?
AI: Great question! You can build a variety ...
```

Notice that the bot remembered Dave's first message when responding to the second.

</details>
<details open>
    <summary><h3>Localization across languages</h3></summary>
    Because this sample leverages GPT for all its natural language modelling, the user can talk to an AI bot in any language of their choosing. The bot will understand and respond appropriately with no additional code required.
</details>

## Setting up the sample

All the samples in for the C# .NET SDK can be set up in the same way: You can find the step by step instructions here: [Setup Instructions](../README.md).

## Interacting with the bot

Interacting with the bot is simple - talk to it! You can invoke it by using @ mention and talk to it in plain language.

The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation. This is possible due to the `skprompt.txt` file's contents.

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

To configure the Azure resources to have an environment variable for the OpenAI Key:

1. In `./env/.env.dev.user` file, paste your [OpenAI API Key](https://openai.com/api/) to the environment variable `SECRET_OPENAI_KEY=`.

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

Use the "Teams Toolkit" > "Provision in the Cloud...", "Teams Toolkit" > "Deploy to the Cloud" from project right-click menu, or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Use Azure OpenAI

Above steps use OpenAI as AI service, optionally, you can also use Azure OpenAI as AI service.

**As prerequisites**

1. Prepare your own Azure OpenAI service and Azure AI Content Safety service.
1. Modify source code `Program.cs`, comment out the "*#Use OpenAI*" part, and uncomment the "*#Use Azure OpenAI and Azure Content Safety*" part.

**For debugging (F5)**

1. Set your Azure OpenAI related settings to *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>",
        "ContentSafetyApiKey": "<your-azure-content-safety-api-key>",
        "ContentSafetyEndpoint": "<your-azure-content-safety-endpoint>"
      }
    ```

**For deployment to Azure**

To configure the Azure resources to have Azure OpenAI environment variables:

1. In `./env/.env.dev.user` file, paste your Azure OpenAI related variables.

    ```bash
    SECRET_AZURE_OPENAI_API_KEY=
    SECRET_AZURE_OPENAI_ENDPOINT=
    SECRET_AZURE_CONTENT_SAFETY_API_KEY=
    SECRET_AZURE_CONTENT_SAFETY_ENDPOINT=
    ```

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)