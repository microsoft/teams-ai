TTo build the packages and samples do the following from the root directory:

```bash
yarn install
yarn build
```

> Running from root directory is required to ensure all packages are built, since currently there is no package deployment of the SDK.

To then run a sample:

`cd` into the sample directory to see more instructions, or just follow the instructions below:

1. Create a new bot in the [Teams Developer Portal](https://dev.teams.microsoft.com/). Follow [this guide](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/teams-developer-portal) if you're new to the portal. Make sure you create a bot for your app which can be done from "tools->Bot Management". Make note of the bot's app ID and Secret. You'll need those in the next step. The endpoint address isn't super critical as we'll reconfigure it in step 4 once we've started [ngrok](https://ngrok.com).

1. From a command window, navigate to the desired samples folder and create a new file called `.env` with following settings. If you're trying to run an AI sample you'll also need to create an account on [OpenAI](https://openai.com/api/) and generate an SDK key:

```text
MicrosoftAppType=MultiTenant
MicrosoftAppId=<your bot's ID>
MicrosoftAppPassword=<your bot's secret>
MicrosoftAppTenantId=
OPENAI_API_KEY=<your OpenAI key>
```

> OpenAI key is only necessary if you are runnnig an AI sample.

3. Now start the sample using the following command:

```bash
yarn start
```

4. In a separate command window you'll also need to start [ngrok](https://ngrok.com/) using the following command. Make note of the url that gets generated (use the https one) as you'll need to go back to [Teams Developer Portal](https://dev.teams.microsoft.com/) and configure your bots endpoint address to `https://<your id>.ngrok.io/api/messages`.

```bash
ngrok.exe http 3978 -host-header="localhost:3978"
```

To chat with your bot using teams:

1. Modify the `teamsAppManifest/manifest.json` file for the sample to include the ID of the bot you created. Then compress all the files found in the `teamsAppManifest` folder to a .zip file. The name doesn't really matter so `manifest.zip` is fine.

2. From within Microsoft Teams click on the "Apps" tab and then click "Manage your apps" on the bottom left. You can then choose "upload an app" from the top and upload the `manifest.zip` file you created. You should now be able to talk to your bot over ngrok. If you see errors in the ngrok window it's likely your bots app ID and password is misconfigured. If you don't see any requests at all in the ngrok window then your bots endpoint isn't properly configured.
