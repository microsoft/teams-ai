# Manually set up resources

<small>Getting started directory</small>

1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [Other](../OTHER/TEAMS-TOOLKIT.md)
   - [Bot Framework Emulator](./BOTFRAMEWORK-EMULATOR.md)
   - [**Manual resource setup**](./MANUAL-RESOURCE-SETUP.md)
   - [Teams Toolkit extra information](./TEAMS-TOOLKIT.md)
   - [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)

# Manual setup

> If you already have [uploaded a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `/appPackage/appPackage.local.zip` file available from the samples, you can skip the first 2 steps.

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

1. [Enable the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0) in Azure

1. In a terminal, navigate to `teams-ai/js/samples/<sample-foldername-here>`

   ```bash
   #if you have not built the project yet, run:
   cd teams-ai/js
   yarn && yarn build # this only needs to be done once after clone or pull
   cd teams-ai/js/samples/<sample-foldername-here>
   ```

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)

1. Run ngrok tunneling service - point to port 3978

   ```bash
   ngrok http --host-header=rewrite 3978
   ```

   - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.

> Note: **_The following is specific to Teams. If you are using a different channel, you do not need to upload a manifest_**

1. Verify your app manifest has all RSC permissions needed to perform its tasks. (If you are using the Teams Toolkit, this is done for you.)

   - Optionally use [App Studio](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/app-studio-overview) to verify your manifest has the correct permissions.

1. **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}`

   - (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`).
   - If you haven't created an Azure app service yet, you can use your bot id for the above.
   - Your bot id should be pasted in where you see `${{BOT_ID}}` and `MicrosoftAppId`.
   - `${{BOT_PASSWORD}}` and `MicrosoftAppPassword` is where you should add the client secret.
   - Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
   - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

   ```bash
   yarn start
   ```

1. In Teams, [upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) and install the app to test.
