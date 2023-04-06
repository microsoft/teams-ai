# Microsoft Teams Conversational Bot with GPT: Santa Claus

This is a conversational bot for Microsoft Teams, designed to mimic the AI character Santa Claus. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows M365 botbuilder SDK capabilities like:

<details open>
    <summary><h3>Conversational bot scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a simple conversational bot, like storage, authentication, and conversation state.
</details>
<details open>
    <summary><h3>Natural language modelling</h3></summary>
    Notice that outside of one '\history' command, the 'index.ts' file relies on GPT for all its natural language modelling - no code is specifically written to handle language processing. Rather, a 'predictionEngine' is defined to handle this for you:

```javascript
// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: path.join(__dirname, '../src/sk-prompt.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Human:', ' AI:']
    },
    logRequests: true
});
```

</details open>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
    Inside the 'predictionEngine', a prompt file is defined:

```javascript
prompt: path.join(__dirname, '../src/prompt/sk-prompt.txt'),
```

Open the 'prompt.txt' file to find descriptive prompt engineering that, in plain language and with minor training, instructs GPT how the bot should conduct itself and facilitate conversation:

#### prompt.txt

```

The following is a conversation with an AI assistant.
The AI is Santa Clause and the Human is a child meeting Santa for the first time.
The AI should always reply the way Santa would.
The AI should always greet the human the way Santa would, ask them their name, and then what they would like for Christmas.

{{$history}}
Human: {{$input}}
AI:


```

</details>
<details open>
    <summary><h3>Conversational session history</h3></summary>
    Because this sample leaves the conversation to GPT, the bot simply facilitates user conversation as-is. But because it includes the 'sk-prompt.txt' file to guide it, GPT will store and leverage session history appropriately. From the chat 'sk-prompt.txt' file:

```
Conversation history:
{{conversation.history}}
```

For example, let's say the user's name is "Dave". The bot might carry on the following conversation:

```
SANTA: I'm Santa! What's your name?
DAVE: My name is Dave.
SANTA:Hi Dave, merry Christmas! I will do my utmost to make sure you receive a special gift this year!
SANTA:What would you like for Christmas?
DAVE: I want my favourite car.
SANTA: Great idea! I'm sure I can make that happen. Can I ask you which car it is so I can get the right one?
```

Notice that the bot remembered Dave's first message when responding to the second.

</details>
<details open>
    <summary><h3>Localization across languages</h3></summary>
    Because this sample leverages GPT for all its natural language modelling, the user can talk to an AI bot in any language of their choosing. The bot will understand and respond appropriately with no additional code required.
</details>

This bot has been created using [Bot Framework](https://dev.botframework.com).

## Prerequisites

-   Microsoft Teams is installed and you have an account
-   [NodeJS](https://nodejs.org/en/) (version 16.x)
-   [ngrok](https://ngrok.com/) or equivalent tunnelling solution
-   [OpenAI](https://openai.com/api/) key for leveraging GPT

## To try this sample

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because
> the Teams service needs to call into the bot.

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/botbuilder-m365.git
    ```

1. In a terminal, navigate to `samples/javascript_nodejs/04.ai.naturalLanguage.santaBot`

1. Install modules

    ```bash
    yarn install
    ```

1. Run ngrok - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)
    - **_If you don't have an Azure account_** you can use this [Bot Framework registration](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams#register-your-web-service-with-the-bot-framework)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.)

1) Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.) The configuration should include your OpenAI API Key in the `OpenAIKey` property.

    - **Edit** the `manifest.json` contained in the `teamsAppManifest` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `<<YOUR-MICROSOFT-APP-OR-BOT-ID>>` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`)
    - **Zip** up the contents of the `teamsAppManifest` folder to create a `manifest.zip`
    - **[Sideload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) (manifest zip) file** the `manifest.zip` to Teams (in the Apps view click "Upload a custom app")

1. Run your bot at the command line:

    ```bash
    npm start
    ```

## Interacting with the bot

Interacting with the bot is simple - talk to it! You can invoke it by using @ mention and talk to it in plain language.

The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation. This is possible due to the `prompts/chatGPT/sk-prompt.txt` file's contents:

    The following is a conversation with an AI assistant.
    The AI is Santa Clause and the Human is a child meeting Santa for the first time.
    The AI should always reply the way Santa would.
    The AI should always greet the human the way Santa would, ask them their name, and then what they would like for Christmas.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions.

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
