# BotFramework Emulator

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [**Bot Framework Emulator**](./BOTFRAMEWORK-EMULATOR.md)
- [Manual resource setup](./MANUAL-RESOURCE-SETUP.md)
- [Teams Toolkit extra information](./TEAMS-TOOLKIT.md)
- [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

Visit the repo (link above) or check out the [releases page](https://github.com/microsoft/BotFramework-Emulator/releases) to download the latest version of the Emulator.

## Testing in BotFramework Emulator

After installing Emulator, you can run it and set it to listen to your local or remote endpoint.

> NOTE! Channel-specific features (For example, Teams Message Extensions) are not supported in Emulator and therefore not fully-testable via Emulator.

### Sample launch steps

1. Launch Bot Framework Emulator
1. If you haven't already, run `yarn && yarn build` in the `js` directory of this repo
1. Run the sample app you are in the directory for (see below)

```bash
cd teams-ai/js
yarn && yarn build # only need to do this once after cloning or pulling
cd teams-ai/js/samples/<sample-app-name>
yarn start
```

### Using the Emulator

1. Add your app's messaging endpoint to the "Open a Bot" dialog.
2. The local bot endpoint is your localhost endpoint with the path `/api/messages` appended. The default port for the bot is `3978`. The default is: `http://localhost:3978/api/messages`.

> Note: For a locally running bot, the app id and password are not required.

![Bot Framework setup menu with a localhost url endpoint added under Bot URL](../assets/BotFrameworkEmulator.jpg)

### Azure Bot Service with Emulator

1. In order to test remote apps, you will need to use a tunneling service like [ngrok](https://ngrok.com/)
2. For a remote endpoint, Microsoft App Id and password are required.
3. Your `ngrok` endpoint will be something like `https://ngrok-url-here/api/messages`.
4. In a new terminal window, run `ngrok http 3978` to start the tunneling service.

For detailed instructions on using the Bot Framework Emulator, see the [Microsoft Learn documentation](https://learn.microsoft.com/azure/bot-service/bot-service-debug-emulator?view=azure-bot-service-4.0)

---

## Return to other major section topics:

- [CONCEPTS](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [**OTHER**](../OTHER/README.md)
