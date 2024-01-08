# Samples

In this folder you will find various examples showcasing the different capabilities of the .NET Teams AI Library. Here are the general instructions for setting up a sample:

## Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Azure OpenAI](https://aka.ms/oai/access) resource or an account with [OpenAI](https://platform.openai.com).

## Setting up a sample

1. If you have not yet, clone the repository:

`git clone https://github.com/Microsoft/teams-ai.git`

2. Pick your sample from the `dotnet/samples/` folder.

There are a few ways to get the application up and running. The latest way is using Teams ToolKit with Visual Studio. However you can also set it up manually. You can find instructions for both below:

<details open>
    <summary><h3>Using Teams Toolkit for Visual Studio (Recommended)</h3></summary>

#### Additional Prerequisites

- Visual Studio 2022 17.7.0 (or a greater version)
- [Teams Toolkit extension](https://learn.microsoft.com/microsoftteams/platform/toolkit/toolkit-v4/install-teams-toolkit-vs?pivots=visual-studio-v17-7)

#### Steps

1. Open the solution in Visual Studio. (For example `EchoBot.sln`).
   - Ensure that you set the appropriate config values (ex Azure OpenAI API key). You can find specific instructions in the sample readme under the `Set up instructions` section. If you can't find this section, then it means there is no required config values to set.
2. In the debug dropdown menu, select `Dev Tunnels > Create A Tunnel` (Tunnel type: `Persistent` & Access: `Public`) or select an existing public dev tunnel.

   ![image](https://github.com/microsoft/teams-ai/assets/115390646/d7246d38-8276-4b2a-bc22-b72f36aa41b9)

3. Right-click your project and select `Teams Toolkit > Prepare Teams App Dependencies`
4. If prompted, sign in with a Microsoft 365 account for the Teams organization you want
   to install the app to.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will
> recommend creating and using a [Microsoft 365 Developer Program](https://developer.microsoft.com/microsoft-365/dev-program) account -
> a free program to get your own dev environment sandbox that includes Teams.

5. Press F5, or select the `Debug > Start` Debugging menu in Visual Studio. If step 3 was completed correctly then this should launch a browser.
6. In the launched browser, select the `Add` button to load the app in Teams.
7. This should redirect you to a chat window with the bot.
</details>

<details>
    <summary><h3> Manually upload the app to a Teams desktop client </h3></summary>

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because the Teams service needs to call into the bot.

#### Additional Requirements

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

You can find the list of samples in the [getting started docs](../../getting-started/SAMPLES.md).

## Miscellanous Resources

In this section you can find miscellanous instructions.

### Deploy to Azure

You can also deploy the samples to Azure, both manually or using Teams Toolkit.

Use the "Teams Toolkit" > "Provision in the Cloud...", "Teams Toolkit" > "Deploy to the Cloud" from project right-click menu, or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

<!--  ### AI Powered Experience -->
