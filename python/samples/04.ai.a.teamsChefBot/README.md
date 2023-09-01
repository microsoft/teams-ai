# Microsoft Teams Conversational Bot with AI: Teams Chef

### Try the sample using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Fill your Azure OpenAI endpoint and deployment name of `text-davinci-003` to `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_MODEL_DEPLOYMENT_NAME` in `env/.env.local` file.
1. Fill your Azure OpenAI key to `AZURE_OPENAI_KEY` in `env/.env.local.user` file.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.