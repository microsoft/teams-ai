# Microsoft Teams Conversational Bot: DevOps Bot

This is a conversational bot for Microsoft Teams that demonstrates how you could build a DevOps bot. The bot uses the gpt-3.5-turbo model to chat with Teams users and perform DevOps action such as create, update, triage and summarize work items.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows Teams AI SDK capabilities like:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'Program.cs' and 'TeamsDevOpsBot.cs' files you'll see the scaffolding created to run a bot with AI features.
</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The `Prompts/Chat/`, `Prompts/ChatGPT/` and `Prompts/Summarize` directories have descriptive prompt engineering that, in plain language, instructs GPT how the bot should conduct itself at submit time. For example, in `Prompts/Chat/skprompt.txt`:

#### skprompt.txt

```text
The following is a conversation with an AI assistant. 
The assistant can manage list of work items.
The assistant must return the following JSON structure:

{"type":"plan","commands":[{"type":"DO","action":"<name>","entities":{"<name>":<value>}},{"type":"SAY","response":"<response>"}]}

The following actions are supported:
- CreateWI title="<work item title>" assignedTo="<person>"
- AssignWI id="<id>" assignedTo="<person>"
- UpdateWI id="<id>" title="<work item title>"
- TriageWI id="<id>" status="<triage status>"
- Summarize

All entities are required parameters to actions

Current list names:

\```
{{getWorkItems}}
\```

Examples: 
...

Instructions:

Always respond in the form of a JSON based plan. Stick with DO/SAY.

{{$history}}
Human: {{$input}}
AI:
```

- The major section ("*The following is ... Stick with DO/SAY.*") defines the basic direction, to tell how AI should behave on human's input.
- The final section ("*Human: ... AI: ...*") defines the human's input and let AI to generate the post response.
- Function "{{getWorkItems}}*" is added via `AI.Prompt.AddFunction` in `TeamsDevOpsBot.cs`.
- You can also add variable via `AI.Prompt.Variables`, then reference it as "*{{$variable}}*" in prompt.
- "*{{$input}}*" and "*{{$history}}*" are automatically resolved from `TurnState.Temp`.

</details>

## Set up instructions

All the samples in for the C# .NET SDK can be set up in the same way. You can find the step by step instructions here:
 [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your [OpenAI API Key](https://openai.com/api/) to *appsettings.Development.json*.

    ```json
      "OpenAI": {
        "ApiKey": "<your-openai-api-key>"
      },
    ```

## Interacting with the Bot

At this point you should have set up the bot and installed it in Teams. You can interact with the bot by sending it a message.

Here's a sample interaction with the bot:

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

Note that, this sample requires AI service so you need one more pre-step before deploy to Azure. To configure the Azure resources to have an environment variable for the OpenAI Key:

1. In `./env/.env.dev.user` file, paste your [OpenAI API Key](https://openai.com/api/) to the environment variable `SECRET_OPENAI_KEY=`.

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

## Use Azure OpenAI

Above steps use OpenAI as AI service, optionally, you can also use Azure OpenAI as AI service.

**As prerequisites**

1. Prepare your own Azure OpenAI service and Azure AI Content Safety service.
1. Modify source code `Program.cs`, comment out the "*#Use OpenAI*" part, and uncomment the "*#Use Azure OpenAI and Azure Content Safety*" part.

**For Local Debug (F5) with Teams Toolkit for Visual Studio**

1. Set your Azure OpenAI related settings to *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>",
        "ContentSafetyApiKey": "<your-azure-content-safety-api-key>",
        "ContentSafetyEndpoint": "<your-azure-content-safety-endpoint>"
      }
    ```

**For Deploy to Azure with Teams Toolkit for Visual Studio**

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
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)