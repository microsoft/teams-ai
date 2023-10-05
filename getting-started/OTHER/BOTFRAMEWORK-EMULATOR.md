# BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

## Testing in BotFramework Emulator

1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [Other](../OTHER/TEAMS-TOOLKIT.md)
   - [Teams Toolkit extra information](./TEAMS-TOOLKIT.md)
   - [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)
   - [**Bot Framework Emulator**](./BOTFRAMEWORK-EMULATOR.md)
   - [Manual resource setup](./MANUAL-RESOURCE-SETUP.md)

After installing Emulator, you can run it and set it to listen to your local or remote endpoint. For a remote endpoint, Microsoft App Id and password are required. If you are using `ngrok`, your endpoint will be `https://ngrok-url-here/api/messages`. The default port for the bot is `3978`.

### Directions

1. Launch Bot Framework Emulator
1. Run the sample app you are in the directory for, e.g. `01.messaging.a.echoBot`

```bash
cd teams-ai/js/samples/<sample-app-name>
yarn start
```

1. Add your app's messaging endpoint to the "Open a Bot" dialog. The endpoint your localhost endpoint with the path `/api/messages` appended. It should look something like this: `http://localhost:3978/api/messages`. For a locally running bot, the app id and password are not required.

![Bot Framework setup menu with a localhost url endpoint added under Bot URL](https://github.com/microsoft/teams-ai/assets/14900841/6c4f29bc-3e5c-4df1-b618-2b5a590e420e)

- In order to test remote apps, you will need to use a tunneling service like ngrok along with a Microsoft App Id and password pasted into the dialog shown above.
- Channel-specific features (For example, Teams Message Extensions) are not supported in Emulator and therefore not fully-testable this way.
- If you are building, testing and publishing your app manually to Azure, you will need to put your credentials in the `.env` file of the remote deployment.
