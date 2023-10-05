1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [**Other**](../OTHER/TEAMS-TOOLKIT.md)

# Teams Toolkit CLI

Below are directions on running samples via the Teams Toolkit CLI.

1. Install the CLI

   ```bash
   npm install -g @microsoft/teamsfx-cli
   ```

1. Open a second shell instance and run ngrok tunneling service - point to port 3978

   ```bash
   ngrok http --host-header=rewrite 3978
   ```

1. Copy the ngrok URL and put the URL and domain in the `/env/env.local` file

   ```bash
   BOT_ENDPOINT=https://{ngrok-url}.ngrok.io
   BOT_DOMAIN={ngrok-url}.ngrok.io
   ```

1. In the repository directory, run the Teams Toolkit CLI commands to automate the setup needed for the app

   ```bash
   cd teams-ai/js/samples/01.messaging.a.echobot/
   teamsfx provision --env local

   ```

1. Next, use the CLI to validate and create an app package

   ```bash
   teamsfx deploy --env local
   ```

1. Finally, use the CLI to preview the app in Teams

   ```bash
   teamsfx preview --env local
   ```
