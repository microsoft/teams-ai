# Microsoft Teams Conversational Bot with AI: Teams Chef

## Summary

ListBot: Your Ultimate List Management Companion. Powered by advanced AI capabilities, this innovative bot is designed to streamline task list. With the ability to create, update, and search lists and tasks, the ListBot offers a seamless and efficient solution to help you stay on top of your to-do's and maximize productivity. Experience the ease of list management like never before, as the ListBot harnesses the power of AI to simplify your workflow and bring order to your daily tasks and showcases the action chaining capabilities.

It shows SDK capabilities like:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'Program.cs' file you'll see the scaffolding created to run a bot, e.g. storage, authentication, and conversation state.
</details>

<details open>
    <summary><h3>Prompt engineering</h3></summary>
The `Prompts/Chat/`, `Prompts/ChatGPT/` and `Prompts/Summarize` directories have descriptive prompt engineering that, in plain language, instructs GPT how the bot should conduct itself at submit time. For example, in `Prompts/ChatGPT/skprompt.txt`:

#### skprompt.txt

```text
The following is a conversation with an AI assistant. 
The assistant can manage lists of items.
The assistant must return the following JSON structure:

{"type":"plan","commands":[{"type":"DO","action":"<name>","entities":{"<name>":<value>}},{"type":"SAY","response":"<response>"}]}

The following actions are supported:

- createList list="<list name>"
- deleteList list="<list name>"
- addItem list="<list name>" item="<text>"
- removeItem list="<list name>" item="<text>"
- findItem list="<list name>" item="<text>"
- summarizeLists

All entities are required parameters to actions

Current list names:

\```
{{getListNames}}
\```

Examples: 

human - remind me to buy milk
ai - DO addItem list="groceries" item="milk" SAY Ok I added milk to your groceries list

human - we already have milk
ai - DO removeItem list="groceries" item="milk" SAY Ok I removed milk from your groceries list

human: buy ingredients to make margaritas
ai - DO addItem list="groceries" item="tequila" DO addItem list="groceries" item="orange liqueur" DO addItem list="groceries" item="lime juice" SAY Ok I added tequila, orange liqueur, and lime juice to your groceries list 

human - do we have have milk
ai - DO findItem list="groceries" item="milk"

human - what's in my grocery list
ai - DO summarizeLists 

human - what's the contents of all my lists?
ai - DO summarizeLists

human - show me all lists but change the title to Beach Party
ai - DO summarizeLists

human - show me all lists as a card and sort the lists alphabetically
ai - DO summarizeLists

Instructions:

Always respond in the form of a JSON based plan. Stick with DO/SAY.

{{$history}}
Human: {{$input}}
AI:
```

- The major section ("*The following is ... Stick with DO/SAY.*") defines the basic direction, to tell how AI should behave on human's input.
- The final section ("*Human: ... AI: ...*") defines the human's input and let AI to generate the post response.
- Function "{{getListNames}}*" is added via AI.Prompt.AddFunction in ListBotApplication.cs.
- You can also add variable via AI.Prompt.Variables, then reference it as "{{$variable}}" in prompt.
- The variables "*{{input}}*", and "*{{history}}*" are automatically resolved from `TurnState.Temp`.
</details>

<details open>
    <summary><h3>Action chaining</h3></summary>
You can find the action handlers in "ListBotActions.cs".

This sample shows how to incorporate basic conversational flow into a Teams application. It also illustrates a few of the Teams specific calls you can make from your bot.
</details>

## Set up instructions

All the samples in for the C# .NET SDK can be set up in the same way. You can find the step by step instructions here: [Setup Instructions](../README.md).

Note that, this sample requires AI service so you need one more pre-step before Local Debug (F5).

1. Set your [OpenAI API Key](https://openai.com/api/) to *appsettings.Development.json*.

    ```json
      "OpenAI": {
        "ApiKey": "<your-openai-api-key>"
      },
    ```

## Interacting with the bot

At this point you should have set up the bot and installed it in Teams. You can interact with the bot by sending it a message.

TODO: screenshots

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

Note that, this sample requires AI service so you need one more pre-step before deploy to Azure. To configure the Azure resources to have an environment variable for the OpenAI Key:

1. In `./env/.env.dev.user` file, paste your [OpenAI API Key](https://openai.com/api/) to the environment variable `SECRET_OPENAI_KEY=`.

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

## Use Azure OpenAI

Above steps use OpenAI as AI service, optionally, you can also use Azure OpenAI as AI service.

**As prerequisites**

1. Prepare your own Azure OpenAI service.
1. Modify source code `Program.cs`, comment out the "*#Use OpenAI*" part, and uncomment the "*#Use Azure OpenAI*" part.

**For debugging (F5)**

1. Set your Azure OpenAI related settings to *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "<your-azure-openai-api-key>",
        "OpenAIEndpoint": "<your-azure-openai-endpoint>"
      }
    ```

**For deployment to Azure**

To configure the Azure resources to have Azure OpenAI environment variables:

1. In `./env/.env.dev.user` file, paste your Azure OpenAI related variables.

    ```bash
    SECRET_AZURE_OPENAI_API_KEY=
    SECRET_AZURE_OPENAI_ENDPOINT=
    ```

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
