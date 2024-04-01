# Teams Toolkit CLI

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Bot Framework Emulator](./BOTFRAMEWORK-EMULATOR.md)
- [Manual resource setup](./MANUAL-RESOURCE-SETUP.md)
- [**Teams Toolkit CLI**](./TEAMS-TOOLKIT-CLI.md)
- [Teams Toolkit extra information](./TEAMS-TOOLKIT.md)

Below are directions on running samples via the Teams Toolkit CLI.

1. Install the CLI and install the project if you haven't yet done so

   ```bash
   npm install -g @microsoft/teamsfx-cli
   #if you have not built the project yet, run:
   cd teams-ai/js
   yarn && yarn build # this only needs to be done once after clone or pull
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
   cd teams-ai/js/samples/00.path-to/x.sample/
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

---

## Return to other major section topics:

- [CONCEPTS](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [**OTHER**](../OTHER/README.md)
