# Samples

In this folder you will find various examples showcasing the different capabilities of the .NET Teams AI Library. Here are the general instructions for setting up a sample:

## Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Azure OpenAI](https://aka.ms/oai/access) resource or an account with [OpenAI](https://platform.openai.com).

## Setting up a sample

1. If you have not yet, clone the repository:

`git clone https://github.com/Microsoft/teams-ai.git`

2. Navigate to the `teams-ai/dotnet/samples` folder, pick a sample (ex. `01.a.echoBot`) and open the `.sln` file.

By this point you should have your sample open in your IDE of choice.

There are a few ways to get the application up and running. The latest way is using Teams ToolKit with Visual Studio. However you can also set it up manually. You can find instructions for both below:

<details open>
    <summary><h3> Using Teams Toolkit for Visual Studio (Recommended)</h3></summary>

#### Additional Prerequisites

- [Visual Studio 2022 17.7.0 Preview 3.0](https://visualstudio.microsoft.com/vs/preview/)
- Teams Toolkit extension (installed through the Visual Studio installer)
  - Select Microsoft Teams development tools under ASP.NET and web development.
  - ![Teams Toolkit Installation](/dotnet/samples/assets/ttk-install.png)

#### Steps

1. Open the solution in Visual Studio. (For example `EchoBot.sln`).
   - Ensure that you set the appropriate config values (ex Azure OpenAI API key). You can find specific instructions in the sample readme under the `Set up instructions` section.
1. In the debug dropdown menu, select `Dev Tunnels > Create A Tunnel` (set authentication type to Public) or select an existing public dev tunnel.

   ![image](https://github.com/microsoft/teams-ai/assets/115390646/d7246d38-8276-4b2a-bc22-b72f36aa41b9)

1. Right-click your project and select `Teams Toolkit > Prepare Teams App Dependencies`
1. If prompted, sign in with a Microsoft 365 account for the Teams organization you want
   to install the app to.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will
> recommend creating and using a [Microsoft 365 Developer Program](https://developer.microsoft.com/en-us/microsoft-365/dev-program) account -
> a free program to get your own dev environment sandbox that includes Teams.

4. Press F5, or select the `Debug > Start` Debugging menu in Visual Studio
5. In the launched browser, select the `Add` button to load the app in Teams
6. This should redirect you to a chat window with the bot.
</details>

<details>
    <summary><h3> Manually upload the app to a Teams desktop client </h3></summary>

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because the Teams service needs to call into the bot.

#### Additional requirements

- [ngrok](https://ngrok.com/) or equivalent tunnelling solution

#### Steps

1. Run ngrok - point to port 5130

   ```bash
   ngrok http 5130 --host-header="localhost:5130"
   ```

1. Provision Azure resources for the Bot

   In Azure portal, create a [Azure Bot resource](https://docs.microsoft.com/azure/bot-service/bot-service-quickstart-registration).

   - For bot handle, make up a name.
   - Select "Use existing app registration" (Create the app registration in Azure Active Directory beforehand.)
   - **_If you don't have an Azure account_** create an [Azure free account here](https://azure.microsoft.com/free/)

   In the new Azure Bot resource in the Portal,

   - Ensure that you've [enabled the Teams Channel](https://learn.microsoft.com/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)
   - In Settings/Configuration/Messaging endpoint, enter the current `https` URL you were given by running ngrok. Append with the path `/api/messages`

1. Open the sample's solution in your IDE.

1. Update the `appsettings.json` configuration for the bot to use the BotId, BotPassword generated in Step 2 (App Registration creation). (Note the Bot Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.)

1. Run your bot, either from Visual Studio with `F5` or using `dotnet run` in the appropriate folder.

<details>
    <summary>6. <b><em>This step is specific to Teams.</em></b></summary>

- **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` or `${{BOT_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`).
- **Edit** the `manifest.json` for `validDomains` with base Url domain. E.g. if you are using ngrok it would be `https://1234.ngrok-free.app` then your domain-name will be `1234.ngrok-free.app`.
- **Zip** up the contents of the `appPackage` folder to create a `manifest.zip` (Make sure that zip file does not contains any subfolder otherwise you will get error while uploading your .zip package)
- **Upload** the `manifest.zip` to Teams (In Teams Apps/Manage your apps click "Upload an app". Browse to and Open the .zip file. At the next dialog, click the Add button.)
  Add the app to personal/team/groupChat scope (Supported scopes)
  </details>

</details>

## List of Samples

Follow the above instructions to run the C# .NET samples. Here's a list of the samples:

### Basic Conversational Experience

#### [Echo Bot](/dotnet/samples/01.echoBot/)

A conversational bot that listens for specific commands and offers a simple conversational flow: echoing the user's message back to them.

This sample illustrates basic conversational bot behavior in Microsoft Teams and shows the Teams AI SDK's ability to scaffold conversational bot components.

#### [Search Command](/dotnet/samples/02.messageExtensions.a.searchCommand/)

A Message Extension (ME) built to search NuGet for a specific package and return the result as an Adaptive Card.

This sample illustrates the Teams AI SDK's ability to scaffold search-based Message Extensions and return Adaptive Card components.

#### [Type Ahead Bot](/dotnet/samples/03.adaptiveCards.a.typeAheadBot/)

A conversational bot that uses dynamic search to generate Adaptive Cards in Microsoft Teams.

This sample illustrates the Teams AI SDK's ability to scaffold conversational bot and Adaptive Card components.

### AI-Powered Experiences

#### [Chef Bot](/dotnet/samples/04.ai.a.teamsChefBot/)

A conversational bot for Microsoft Teams, designed as a helper bot for building Teams app. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

#### [GPT ME](/dotnet/samples/04.ai.b.messageExtensions.gptME/)

A Message Extension (ME) for Microsoft Teams that leverages the text-davinci-003 model to help users generate and update posts. The extension is designed to assist users in creating posts that are appropriate for a business environment.

This sample illustrates basic ME behavior in Microsoft Teams. The ME is built to allow GPT to facilitate the conversation by generating posts based on what the user requires. e.g., "Make my post sound more professional."

#### [Light Bot](/dotnet/samples/04.ai.c.actionMapping.lightBot/)

A conversational bot for Microsoft Teams, designed as an AI assistant. The bot connects to a third-party service to turn a light on or off.

This sample illustrates more complex conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to user defined actions.

#### [List Generator AI Assistant](/dotnet/samples/04.ai.d.chainedActions.listBot/)

Similar to the Light On/Off sample, this is a conversational bot for Microsoft Teams, designed as an AI assistant. This bot showcases how to map intents to actions, but instead of returning text, it generates dynamically created Adaptive Cards as a response.

This sample illustrates complex conversational bot behavior in Microsoft Teams and showcases the richness of possibilities for responses.

#### [DevOps AI Assistant](/dotnet/samples/04.ai.e.chainedActions.devOpsBot/)

Similar to the List Generator AI Assistant sample, this is a conversational bot for Microsoft Teams, designed as an AI assistant. This bot showcases how to map intents to actions, but instead of returning text, it generates dynamically created Adaptive Cards as a response.

This sample illustrates complex conversational bot behavior in Microsoft Teams and showcases the richness of possibilities for responses.

#### [Twenty Questions](/dotnet/samples/04.e.twentyQuestions/)

A conversational bot for Microsoft Teams, designed as an AI assistant of the Ultimate Guessing Game!

This sample showcases the incredible capabilities of language models and the concept of user intent. Challenge your skills as the human player and try to guess a secret within 20 questions, while the AI-powered bot answers your queries about the secret.

## Miscellanous Resources

In this section you can find miscellanous instructions.

### Deploy to Azure

You can also deploy the samples to Azure, both manually or using Teams Toolkit.

Use the "Teams Toolkit" > "Provision in the Cloud...", "Teams Toolkit" > "Deploy to the Cloud" from project right-click menu, or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

<!--  ### AI Powered Experience -->
