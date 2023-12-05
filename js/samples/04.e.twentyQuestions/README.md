# AI in Microsoft Teams: Twenty Qestions

Welcome to the 20 Questions Bot: The Ultimate Guessing Game! This developer sample application showcases the incredible capabilities of language models and the concept of user intent. Challenge your skills as the human player and try to guess a secret within 20 questions, while the AI-powered bot answers your queries about the secret. Experience firsthand how language models interpret user input and provide informative responses, creating an engaging and interactive gaming experience. Get ready to dive into the world of language models and explore the fascinating realm of user interaction and intent.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [AI in Microsoft Teams: Twenty Qestions](#ai-in-microsoft-teams-twenty-qestions)
    -   [Setting up the sample](#setting-up-the-sample)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        -   [Using Teams Toolkit CLI](#using-teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Limitations](#limitations)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

It shows following SDK capabilities:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a simple Bot, like storage, authentication, task modules, and action submits.
</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The 'prompts/hint/skprompt.txt' file has descriptive prompt engineering that, in plain language, instructs GPT how the bot should conduct itself at submit time. For example, in 'skprompt.txt':

#### skprompt.txt

```
You are the AI in a game of 20 questions.
The goal of the game is for the Human to guess a secret within 20 questions.
The AI should answer questions about the secret.
The AI should assume that every message from the Human is a question about the secret.

GuessCount: {{$conversation.guessCount}}
RemainingGuesses: {{$conversation.remainingGuesses}}
Secret: {{$conversation.secretWord}}

Answer the humans question but do not mention the secret word.
```

</details>
<details open>
    <summary><h3>QnA bot with LLM</h3></summary>

```javascript
app.activity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
    let { secretWord, guessCount, remainingGuesses } = state.conversation.value;
    if (secretWord && secretWord.length < 1) {
        throw new Error('No secret word is assigned.');
    }
    if (secretWord) {
        guessCount++;
        remainingGuesses--;

        // Check for correct guess
        if (context.activity.text.toLowerCase().indexOf(secretWord.toLowerCase()) >= 0) {
            await context.sendActivity(responses.youWin(secretWord));
            secretWord = '';
            guessCount = remainingGuesses = 0;
        } else if (remainingGuesses == 0) {
            await context.sendActivity(responses.youLose(secretWord));
            secretWord = '';
            guessCount = remainingGuesses = 0;
        } else {
            // Ask GPT for a hint
            const response = await getHint(context, state);
            if (response.toLowerCase().indexOf(secretWord.toLowerCase()) >= 0) {
                await context.sendActivity(`[${guessCount}] ${responses.blockSecretWord()}`);
            } else if (remainingGuesses == 1) {
                await context.sendActivity(`[${guessCount}] ${responses.lastGuess(response)}`);
            } else {
                await context.sendActivity(`[${guessCount}] ${response}`);
            }
        }
    } else {
        // Start new game
        secretWord = responses.pickSecretWord();
        guessCount = 0;
        remainingGuesses = 20;
        await context.sendActivity(responses.startGame());
    }

    // Save game state
    state.conversation.value.secretWord = secretWord;
    state.conversation.value.guessCount = guessCount;
    state.conversation.value.remainingGuesses = remainingGuesses;
});
```

</details>

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    cd samples/04.e.twentyQuestions
    ```

3. Duplicate the `sample.env` in the `teams-ai/js/samples/04.e.twentyQuestions` folder. Rename the file to `.env`.

4. If you are using OpenAI then only keep the `OPENAI_KEY` and add in your key. Otherwise if you are using AzureOpenAI then only keep the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` variables and fill them in appropriately.

5. Update `config.json` and `index.ts` with your model deployment name.

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](#testing-in-BotFramework-emulator) section.

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

### Using Teams Toolkit CLI

You can also use the Teams Toolkit CLI to run this sample.

1. Install the CLI

    ```bash
    npm install -g @microsoft/teamsfx-cli
    ```

1. Open a second shell instance and run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Copy the ngrok URL and put the URL and domain in the `/env/env.local` file

    ```
    BOT_ENDPOINT=https://{ngrok-url}.ngrok.io
    BOT_DOMAIN={ngrok-url}.ngrok.io
    ```

1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT

1. In the repository directory, run the Teams Toolkit CLI commands to automate the setup needed for the app

    ```bash
    cd teams-ai/js/samples/04.e.twentyquestions/
    teamsfx provision --env local

    ```

1. Next, use the CLI to validate and create an app package

    ```bash
    teamsfx deploy --env local
    ```

1. Finally, use the CLI to preview the app in Teams

    ```bash
    teamsfx preview --env local
    ```

### Manually upload the app to a Teams desktop client

> If you used Teams Toolkit in the above steps, you can [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `/appPackage/appPackage.local.zip` file created by the tools and skip to step 6.

1. In a terminal, navigate to `teams-ai/js/samples/04.e.twentyquestions/`

    ```bash
    cd teams-ai/js/samples/04.e.twentyquestions
    ```

1. Run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)
1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT
1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `${{BOT_ID}}`. Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
    - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

    ```bash
    yarn start
    ```

1. [Upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) in Teams.

## Limitations

The message extension has some limitations, including:

-   The bot is not able to perform tasks outside of generating and updating posts.
-   The bot is not able to provide inappropriate or offensive content.

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

### Directions

1. Download and install [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator)
2. Launch Bot Framework Emulator
3. Run the app you are in the directory for.

```bash
yarn start
```

4. Add your app's messaging endpoint to the "Open a Bot" dialog. The endpoint your localhost endpoint with the path `/api/messages` appended. It should look something like this: `http://localhost:3978/api/messages`.

![Bot Framework setup menu with a localhost url endpoint added under Bot URL](https://github.com/microsoft/teams-ai/assets/14900841/6c4f29bc-3e5c-4df1-b618-2b5a590e420e)

-   In order to test remote apps, you will need to use a tunneling service like ngrok along with an Microsoft App Id and password pasted into the dialog shown above.
-   Channel-specific features (For example, Teams Message Extensions) are not supported in Emulator and therefore not fully-testable.
-   If you are building, testing and publishing your app manually to Azure, you will need to put your credentials in the `.env` file.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

To configure the Azure resources to have an environment variable for the OpenAI Key:

1. Add a `./env/.env.staging.user` file with a new variable, `SECRET_OPENAI_KEY=` and paste your [OpenAI Key](https://openai.com/api/).

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

Use the **Provision**, **Deploy**, and **Publish** buttons of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
