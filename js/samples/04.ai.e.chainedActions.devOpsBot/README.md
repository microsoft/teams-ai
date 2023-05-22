# Microsoft Teams Conversational Bot with GPT: DevOps Bot

This is a conversational bot for Microsoft Teams that demonstrates how you could build a DevOps bot. The bot uses the gpt-3.5-turbo model to chat with Teams users and perform DevOps action such as create, upadte, triage and summarize work items.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

## Prerequisites

-   Microsoft Teams is installed and you have an account
-   [NodeJS](https://nodejs.org/en/)
-   [ngrok](https://ngrok.com/) or equivalent tunnelling solution

## To try this sample

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because
> the Teams service needs to call into the bot.
1. Clone the repository

    ```bash
    git clone https://github.com/microsoft/teams-ai.git
    ```

1. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    ```

    - If you already ran `yarn install` and `yarn build` in the `js` folder, you are ready to get started with ngrok. Otherwise, you need to run `yarn install` and `yarn build` in the `js` folder.

    Navigate to the sample directory

    `cd samples/04.ai.e.chainedActions.devOpsBot`

1. Run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)
    - **_If you don't have an Azure account_** you can use this [Bot Framework registration](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams#register-your-web-service-with-the-bot-framework)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.)

1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `teamsAppManifest` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `<<YOUR-MICROSOFT-APP-ID>>` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. Your bot id should be pasted in where you see `<<YOUR-MICROSOFT-APP-ID>>`
    - **Zip** up the contents of the `teamsAppManifest` folder to create a `manifest.zip`
    - **[Sideload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) (manifest zip) file** the `manifest.zip` to Teams (in the Apps view click "Upload a custom app")

1. Run your bot at the command line:

    ```bash
    yarn start
    ```

1. [Sideload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) (manifest zip) file in Teams.

## Interacting with the bot

You can interact with this bot by sending it a message. The bot will respond to the following strings.

1. **create work item to track new functionality in Adaptive card and assign it to John**

-   **Result:** The bot will create a tracking item in Azure DevOps and assign it to John
-   **Valid Scopes:** personal, group chat, team chat

2. **update title of work item 1 to create a new bot in azure**

-   **Result:** The bot will update the title of work item 1 to create a new bot in azure.
-   **Valid Scopes:** personal, group chat, team chat

3. **triage work item 1 as "in progress"**

-   **Result:** The bot will update the state of work item 1 to "in progress".
-   **Valid Scopes:** personal, group chat, team chat

4. **summarize work items"**

-   **Result:** The bot will summarize the work items and respond back with an adaptive card.
-   **Valid Scopes:** personal, group chat, team chat

You can select an option from the command list by typing `@TeamsConversationBot` into the compose message area and `What can I do?` text above the compose area.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions.

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
