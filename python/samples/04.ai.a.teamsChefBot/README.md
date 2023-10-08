# Microsoft Teams Conversational Bot with AI: Teams Chef

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->
-   [Microsoft Teams Conversational Bot with AI: Teams Chef](#microsoft-teams-conversational-bot-with-ai-teams-chef)
    -   [Summary](#summary)
    -   [Prerequisites](#prerequisites)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Multiple ways to test](#multiple-ways-to-test)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        -   [Using Teams Toolkit CLI](#using-teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Testing in BotFramework Emulator](#testing-in-botframework-emulator)
        -   [Directions](#directions)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

## Summary

This is a conversational bot for Microsoft Teams that thinks it's a Chef to help you cook Teams apps. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

![screenshot](./assets/screenshot.PNG)

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows Teams AI SDK capabilities like:

<details open>
    <summary><h3>Conversational bot scaffolding</h3></summary>
    Throughout the 'app.py' file you'll see the scaffolding created to run a simple conversational bot, like storage and conversation state.
</details>

Open the panel below to learn fine-tuned details on how this sample works.

<details>
    <summary><h3>Natural language modelling</h3></summary>
    Notice that outside of one '\history' command, the 'app.py' file relies on GPT for all its natural language modelling - no code is specifically written to handle language processing. Rather, a 'planner' is defined to handle this for you:

```python
planner = AzureOpenAIPlanner(
    AzureOpenAIPlannerOptions(
        Config.AZURE_OPENAI_KEY,
        Config.AZURE_OPENAI_MODEL_DEPLOYMENT_NAME,
        Config.AZURE_OPENAI_ENDPOINT,
    )
)
storage = MemoryStorage()
app = Application[TurnState](
    ApplicationOptions(
        auth=BotFrameworkAdapterSettings(
            app_id=Config.BOT_ID,
            app_password=Config.BOT_PASSWORD,
        ),
        ai=AIOptions(
            planner=planner,
            prompt="chat",
            history=AIHistoryOptions(assistant_history_type="text"),
        ),
        storage=storage,
    )
)
```

</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
    Inside the project, a prompt file is defined at `src/prompts/chat`:

Open the 'prompt.txt' file to find descriptive prompt engineering that, in plain language and with minor training, instructs GPT how the bot should conduct itself and facilitate conversation:

#### prompts/chat/skprompt.txt

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
    Because this sample leaves the conversation to GPT, the bot simply facilitates user conversation as-is. But because it includes the 'prompt.txt' file to guide it, GPT will store and leverage session history appropriately. From the 'prompt.txt' file:

```
{{$history}}
```

For example, let's say the user's name is "Dave". The bot might carry on the following conversation:

```
AI: Hi there! My name is Teams Chef. It's nice to meet you. What's your name?
DAVE: My name is Dave.
AI:Hi Dave! It's great to meet you. Let me help you get started with Microsoft Teams app development. Have you ever cooked before?
DAVE: No, not yet, why?
AI:Cooking is a great way to learn how to develop apps for Microsoft Teams. Just like cooking, developing apps requires you to have the right ingredients and tools, and to follow a set of instructions. It also requires creativity and problem-solving skills. So, let's get started! What would you like to learn first?
DAVE: Which kind of apps can I build for Microsoft Teams?
AI: Great question! You can build a variety of apps for Microsoft Teams, including bots, messaging extensions, tabs, and connectors. Bots are like the main course of your app - they provide the core functionality. Messaging extensions are like side dishes - they add extra features to your app. Tabs are like garnishes - they provide additional information or visuals. And connectors are like spices - they allow you to integrate with other services.
```

Notice that the bot remembered Dave's first message when responding to the second.

</details>
<details open>
    <summary><h3>Localization across languages</h3></summary>
    Because this sample leverages GPT for all its natural language modelling, the user can talk to an AI bot in any language of their choosing. The bot will understand and respond appropriately with no additional code required.
</details>

## Prerequisites

-   Global Administrator access to a [Microsoft 365 tenant](https://developer.microsoft.com/microsoft-365/dev-program?ocid=MSlearn&WT.mc_id=m365-16105-cxa) with [uploading Teams custom apps enabled](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant#enable-custom-teams-apps-and-turn-on-custom-app-uploading?WT.mc_id=m365-84637-cxa).
-   VS Code [Teams Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/install-teams-toolkit?tabs=vscode&pivots=visual-studio-code) extension installed
-   [Python](https://www.python.org/)
-   [AzureOpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) key and endpoint for leveraging GPT

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below.

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](#testing-in-BotFramework-emulator) section.

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Fill your Azure OpenAI endpoint and deployment name of `text-davinci-003` to `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_MODEL_DEPLOYMENT_NAME` in `env/.env.local` file.
1. Fill your Azure OpenAI key to `AZURE_OPENAI_KEY` in `env/.env.local.user` file.
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

    ```bash
    BOT_ENDPOINT=https://{ngrok-url}.ngrok.io
    BOT_DOMAIN={ngrok-url}.ngrok.io
    ```

1. Fill your Azure OpenAI endpoint and deployment name of `text-davinci-003` to `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_MODEL_DEPLOYMENT_NAME` in `env/.env.local` file.

1. Fill your Azure OpenAI key to `AZURE_OPENAI_KEY` in `env/.env.local.user` file.

1. In the repository directory, run the Teams Toolkit CLI commands to automate the setup needed for the app

    ```bash
    cd teams-ai/python/samples/04.ai.a.teamsChefBot/
    teamsfx provision --env local

    ```

1. Next, use the CLI to validate and create an app package

    ```bash
    teamsfx deploy --env local
    ```

1. Finally, use the CLI to preview the app in Teams

    ```bash
    teamsfx preview --env local --run-command "poetry run start 2>&1" --running-pattern "startup complete"
    ```

### Manually upload the app to a Teams desktop client

> If you used Teams Toolkit in the above steps, you can [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `/appPackage/appPackage.local.zip` file created by the tools and skip to step 6.

1. In a terminal, navigate to `teams-ai/python/samples/04.ai.a.teamsChefBot/`

    ```bash
    cd teams-ai/python/samples/04.ai.a.teamsChefBot/
    ```

1. Run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration, as well as the Azure Open AI key, endpoint and `text-davinci-003` model's deployment name. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)

1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `${{BOT_ID}}`. Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
    - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

    ```bash
    python src/app.py
    ```

1. [Upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) in Teams.

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

### Directions

1. Download and install [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator)
2. Launch Bot Framework Emulator
3. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration, as well as the Azure Open AI key, endpoint and `text-davinci-003` model's deployment name.
4. Run the app you are in the directory for.

```bash
python src/app.py
```

5. Add your app's messaging endpoint to the "Open a Bot" dialog. The endpoint your localhost endpoint with the path `/api/messages` appended. It should look something like this: `http://localhost:3978/api/messages`.

![Bot Framework setup menu with a localhost url endpoint added under Bot URL](./assets/bot-emulator-setup.PNG)

-   In order to test remote apps, you will need to use a tunneling service like ngrok along with an Microsoft App Id and password pasted into the dialog shown above.
-   Channel-specific features (For example, Teams Message Extensions) are not supported in Emulator and therefore not fully-testable.
-   If you are building, testing and publishing your app manually to Azure, you will need to put your credentials in the `.env` file.

## Interacting with the bot

Interacting with the bot is simple - talk to it! You can invoke it by using @ mention and talk to it in plain language.

The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation. This is possible due to the `skprompts.txt` file's contents.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions or use the Teams Toolkit to help you: [Deploy a Microsoft Teams app to Azure by using Teams Toolkit for Visual Studio Code](https://learn.microsoft.com/en-us/training/modules/teams-toolkit-vsc-deploy-apps/)

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
-   [Build a bot by using Teams Toolkit for Visual Studio Code](https://learn.microsoft.com/en-us/training/modules/teams-toolkit-vsc-create-bot/)