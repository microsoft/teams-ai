# Microsoft Teams Conversational Bot with AI: Teams Chef

-   [Microsoft Teams Conversational Bot with AI: Teams Chef](#microsoft-teams-conversational-bot-with-ai-teams-chef)
    -   [Summary](#summary)
    -   [Prerequisites](#prerequisites)
    -   [Setting up the sample](#setting-up-the-sample)
    -   [Multiple ways to test](#multiple-ways-to-test)
        -   [Using Teams Toolkit for Visual Studio](#using-teams-toolkit-for-visual-studio)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Testing in BotFramework Emulator](#testing-in-botframework-emulator)
        -   [Directions](#directions)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

## Summary

This is a conversational bot for Microsoft Teams that thinks it's a Chef to help you cook Teams apps. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows SDK capabilities like:

<details open>
    <summary><h3>bot scaffolding</h3></summary>
    Throughout the 'Program.cs' file you'll see the scaffolding created to run a simple conversational bot, like storage, authentication, and conversation state.
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
-   Visual Studio 2022 version 17.7 Preview 3 with Teams Toolkit installed.
-   [OpenAI](https://openai.com/api/) key for leveraging GPT.

## Setting up the sample

1. Clone the repository.

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. Open `teams-ai/dotnet/samples/TeamsChefBot` with Visual Studio.

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit. To use Teams Toolkit to continue setup and debugging, please continue below.

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](#testing-in-BotFramework-emulator) section.

### Using Teams Toolkit for Visual Studio

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio.

1. Ensure you have installed Visual Studio 2022 version 17.7 Preview 3 with Teams Toolkit installed.
1. Select **File > Open Project** in Visual Studio and choose this samples directory from the repo.
1. Select **Dev Tunnels > Create a Tunnel** from  Startup Projects list.
1. Select **Project > Teams Toolkit > Prepare Teams App Dependencies**.
1. Select **Microsoft Teams (Browser)** from Startup Projects list.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

### Manually upload the app to a Teams desktop client

> If you used Teams Toolkit in the above steps, you can [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `appPackage/build/appPackage.local.zip` file created by the tools and skip to step 6.

1. In a terminal, navigate to `teams-ai/dotnet/samples/TeamsChefBot`

    ```bash
    cd teams-ai/dotnet/samples/TeamsChefBot
    ```

1. Run ngrok tunneling service - point to port 5130

    ```bash
    ngrok http --host-header=rewrite 5130
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)

1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `${{BOT_ID}}`. Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
    - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

    ```bash
    dotnet run
    ```

1. [Upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) in Teams.

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

### Directions

1. Download and install [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator)
2. Launch Bot Framework Emulator
3. Run the app you are in the directory for.

```bash
dotnet run
```

4. Add your app's messaging endpoint to the "Open a Bot" dialog. The endpoint your localhost endpoint with the path `/api/messages` appended. It should look something like this: `http://localhost:5130/api/messages`.

## Interacting with the bot

Interacting with the bot is simple - talk to it! You can invoke it by using @ mention and talk to it in plain language.

The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation. This is possible due to the `skprompt.txt` file's contents.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions or use the Teams Toolkit to help you.

### Using Teams Toolkit for Visual Studio
1. Select **Project > Teams Toolkit > Provision to the Cloud**.
2. Select **Project > Teams Toolkit > Deploy to the Cloud**.

## Further reading

- [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)