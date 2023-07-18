# Samples

In this folder you will find various examples showcasing the different capabilities of the .NET Teams AI Library. Here are the general instructions for setting up a sample: 

## Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Azure OpenAI](https://aka.ms/oai/access) resource or an account with [OpenAI](https://platform.openai.com).

### Consuming the latest version of the library (preview only) 

> **NOTE:**  As the library has not been published to NuGet's public registry, please complete the following steps to be able to use the samples. Otherwise, the samples will not work.

The development versions of the library might not be available on NuGet's public registry. Follow the instructions below to generate the `.nukpg` NuGet package file of the library to locally consume within the sample:

1. Clone the repository:

`git clone https://github.com/Microsoft/teams-ai.git`

2. Checkout the `DOTNET` branch.

3. Navigate to the `teams-ai/dotnet/packages/Microsoft.TeamsAI` folder.

4. Run `dotnet pack` in terminal.

5. You should then see the following output: 

`Successfully created package "C:...\teams-ai\dotnet\packages\Microsoft.TeamsAI\Microsoft.TeamsAI\bin\Debug\Microsoft.TeamsAI.1.0.0.nupkg"`

6. Move the `Microsoft.TeamsAI.1.0.0.nupkg` to the `LocalPkg/` folder within the sample folder.

7. Now you can install the `Microsoft.TeamsAI` package from the Visual Studio's `Manage NuGet Packages` flow or by running `dotnet add package Microsoft.TeamsAI`.

Now can you proceed to setting up the sample.

## Setting up a sample

1. Clone the repository:

`git clone https://github.com/Microsoft/teams-ai.git`

2. Navigate to the `teams-ai/dotnet/samples` folder, pick a sample (ex. `01.a.echoBot`) and open the `.sln` file. 

By this point you should have your sample open in your IDE of choice.

There are a few ways to get the application up and running. The latest way is using Teams toolkit with Visual Studio. However you can also set it up manually. You can find instructions for both below:

### Using Teams Toolkit for Visual Studio

#### Additional Prerequisites

- [Visual Studio 2022 17.7.0 Preview 3.0](https://visualstudio.microsoft.com/vs/preview/)
- Teams Toolkit extension (installed through the Visual Studio installer)
  - Select Microsoft Teams development tools under ASP.NET and web development.
  - ![Teams Toolkit Installation](/dotnet/samples/assets/ttk-install.png)

#### Steps
1. Open the solution in Visual Studio. (For example `EchoBot.sln`).
1. In the debug dropdown menu, select `Dev Tunnels > Create A Tunnel` (set authentication type to Public) or select an existing public dev tunnel
2. Right-click your project and select `Teams Toolkit > Prepare Teams App Dependencies`
3. If prompted, sign in with a Microsoft 365 account for the Teams organization you want 
to install the app to. 


>If you do not have permission to upload custom apps (sideloading), Teams Toolkit will 
recommend creating and using a [Microsoft 365 Developer Program](https://developer.microsoft.com/en-us/microsoft-365/dev-program) account - 
a free program to get your own dev environment sandbox that includes Teams.

4. Press F5, or select the `Debug > Start` Debugging menu in Visual Studio
5. In the launched browser, select the Add button to load the app in Teams
6. This should redirect you to a chat window with the bot. 

### Manually upload the app to a Teams desktop client
> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because the Teams service needs to call into the bot.

#### Additional requirements
- [ngrok](https://ngrok.com/) or equivalent tunnelling solution

#### Steps
1) Run ngrok - point to port 5130

    ```bash
    ngrok http 5130 --host-header="localhost:5130"
    ```

1) Setup for Bot

   In Azure portal, create a [Azure Bot resource](https://docs.microsoft.com/azure/bot-service/bot-service-quickstart-registration).
    - For bot handle, make up a name.
    - Select "Use existing app registration" (Create the app registration in Azure Active Directory beforehand.)
    - __*If you don't have an Azure account*__ create an [Azure free account here](https://azure.microsoft.com/free/)
    
   In the new Azure Bot resource in the Portal, 
    - Ensure that you've [enabled the Teams Channel](https://learn.microsoft.com/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)
    - In Settings/Configuration/Messaging endpoint, enter the current `https` URL you were given by running ngrok. Append with the path `/api/messages`

1) Open the sample's solution in your IDE.

1) Update the `appsettings.json` configuration for the bot to use the BotId, BotPassword generated in Step 2 (App Registration creation). (Note the Bot Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.)

1) Run your bot, either from Visual Studio with `F5` or using `dotnet run` in the appropriate folder.

1) __*This step is specific to Teams.*__
    - **Edit** the `manifest.json` contained in the  `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) *everywhere* you see the place holder string `${{TEAMS_APP_ID}}` or `${{BOT_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`).
    - **Edit** the `manifest.json` for `validDomains` with base Url domain. E.g. if you are using ngrok it would be `https://1234.ngrok-free.app` then your domain-name will be `1234.ngrok-free.app`.
    - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip` (Make sure that zip file does not contains any subfolder otherwise you will get error while uploading your .zip package)
    - **Upload** the `manifest.zip` to Teams (In Teams Apps/Manage your apps click "Upload an app". Browse to and Open the .zip file. At the next dialog, click the Add button.)
    - Add the app to personal/team/groupChat scope (Supported scopes)

## List of Samples
Follow the above instructions to run the C# .NET samples. Here's a list of the samples:

### Basic Conversational Experience

#### [Echo Bot](/dotnet/samples/01.echoBot/)

A conversational bot that listens for specific commands and offers a simple conversational flow: echoing the user's message back to them.

This sample illustrates basic conversational bot behavior in Microsoft Teams and shows the Teams AI SDK's ability to scaffold conversational bot components.

<!--  ### AI Powered Experience -->
