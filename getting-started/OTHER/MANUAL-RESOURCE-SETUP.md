# Manually set up resources

## Table of Contents

1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [Other](../OTHER/TEAMS-TOOLKIT.md)
   - [Teams Toolkit extra information](./TEAMS-TOOLKIT.md)
   - [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)
   - [Bot Framework Emulator](./BOTFRAMEWORK-EMULATOR.md)
   - [**Manual resource setup**](./MANUAL-RESOURCE-SETUP.md)

# Manual setup

> If you used Teams Toolkit in the previous samples steps, you can [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `/appPackage/appPackage.local.zip` file created by the tools and skip to step 6.

1. In a terminal, navigate to `teams-ai/js/samples/01.messaging.a.echobot/`

   ```bash
   cd teams-ai/js/samples/01.messaging.a.echobot/
   ```

1. Run ngrok tunneling service - point to port 3978

   ```bash
   ngrok http --host-header=rewrite 3978
   ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

   - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
   - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)

1. **_This step is specific to Teams. If you are using a different channel, you do not need to upload a manifest_**

   - **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `${{BOT_ID}}` and MicrosoftAppId. `${{BOT_PASSWORD}}` and `MicrosoftAppPassword` should also be filled out. Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
   - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

   ```bash
   yarn start
   ```

1. [Upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) in Teams.
