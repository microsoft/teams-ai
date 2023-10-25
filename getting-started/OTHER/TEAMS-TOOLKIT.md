# Teams Toolkit extra information

<small>Getting started directory</small>

1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [Other](../OTHER/TEAMS-TOOLKIT.md)
   - [**Teams Toolkit extra information**](./TEAMS-TOOLKIT.md)
   - [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)
   - [Bot Framework Emulator](./BOTFRAMEWORK-EMULATOR.md)
   - [Manual resource setup](./MANUAL-RESOURCE-SETUP.md)

Teams Toolkit is a handy way to get up and testing your app on Teams **quickly**. The process that has been set up in our samples has been optimized for minimal configuration and maximum speed.

Using TTK will help you get a local bot running in Teams in a few minutes. This TTK setup will help by detecting and loading changes while in local development. However, there is some setup that will be required to get started.

Note that if you are testing a sample that does not use AI in it, **you do not need to set up an Azure OpenAI or OpenAI resource**. You can skip the steps that involve Azure OpenAI or OpenAI.

### Check if the sample is using AI services

1. If the sample is the term 'AI' in the name, it is using AI.
1. If the code references `AzureOpenAIPlanner` or `OpenAIPlanner`, it is using AI.
1. If you see the option to add `AZURE_OPENAI_KEY` or `OPENAI_KEY` in the `.env` file, it is using AI.
1. If none of the above apply, you can assume the sample does not use AI.

## Prerequisites

### JS prereqs

- Installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
- [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)

### C# prereqs

- Installed [preview version of Visual Studio ](https://visualstudio.microsoft.com/downloads/)
- [Install Teams Toolkit for Visual Studio](https://learn.microsoft.com/microsoftteams/platform/toolkit/toolkit-v4/install-teams-toolkit-vs?pivots=visual-studio-v17-7)

### Python prereqs

- Python: Teams Toolkit extension AND Python extension on Visual Studio Code
- Installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
  - [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
  - [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)

### What are the different `env` files for?

1. The sample's root `.env` file is what is checked at (local) runtime. The app references `.env` to get the values it needs
1. The `env/.env.local.*` or `env/.env.dev.*` files are used by Teams Toolkit to set up the project with ngrok locally. Changes need to be made to these for TTK auto-setup to work. (More details on this below)
1. `env/.env.staging` is for setup in Azure

## Start with a "clean slate"

Follow these steps if you have run the samples before but want to start fresh, or if you run into a runtime error (including but not limited to an error message that says 'crypto password is incorrect')

1. Check all `.env` AND `env/.env.*.*` files in the sample and delete any values that are automatically populated. This will ensure that Teams Toolkit will generate new resources for you.
1. If you don't want Teams Toolkit to generate the app id and password for you, be sure that any `.env` file instance of `MicrosoftAppId` and `MicrosoftAppPassword` are populated with your values.
1. To avoid potential conflicts, values like `SECRET_BOT_PASSWORD` and `TEAMS_APP_UPDATE_TIME` should be removed / left blank.

### Note on provisioned resources

Teams Toolkit will automatically provision Microsoft App Id and password resources for you. If you want to use your own pre-existing resources, you will need to manually add them to the `.env` file.

If you do not want Teams Toolkit to provision resources for you, you will need to manually create them and add them to the `.env` file. Azure Bot Service in itself does not cost money, so there is no harm in letting Teams Toolkit provision resources for you.

Services like Azure OpenAI or OpenAI will need manual creation then add them to the `.env` file. The same applies to other resources like Azure Storage.

Teams Toolkit does **not** auto-generate:

- An Azure OpenAI or OpenAI key
- A database or similar storage options

You can check your provisioned resources in the [Azure Portal](https://portal.azure.com) or at the [Teams development portal](https://dev.teams.microsoft.com).

## Environment variables setup

_Note_: While we have done our best to stay consistent with file names between samples per language, there may be some differences. Please check the README for the sample you are using to ensure you are using the correct file/variable names. If you notice any inconsistencies, please feel free to file a bug and/or file a PR!

### Environment variable filenames and purpose

- `.env` - in the sample's root directory
  - This is used by the sample to populate the environment variables at runtime. Other resources the needs will also be added here
- TTK setup:
  - `.env.local` (JS and Python)
  - `.env.local.user` (JS and Python)
  - `.env.dev` (C#)
  - `.env.dev.user` (C#)
- TTK deployment:
  - `.env.staging` (Prod)

1. Copy-paste your Azure OpenAI API key and Azure Endpoint into the `.env` file.
   - If you are using OpenAI, you will need to paste your OpenAI key instead. You can safely delete or comment out `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` from the `.env` file.
   - Note that if you are using OpenAI, you will also need to make changes to the app code.
   - See the [section below](#using-openai-instead-of-azure-openai) on using OpenAI instead of Azure OpenAI.
1. If you already have an app id and password, fill the first two lines with your values. Otherwise, leave them blank and Teams Toolkit will generate them for you.

```bash
MicrosoftAppId=#leave blank for Teams Toolkit to generate
MicrosoftAppPassword=#leave blank for Teams Toolkit to generate
AZURE_OPENAI_KEY=AZURE-OPENAI-KEY-HERE
AZURE_OPENAI_ENDPOINT=https://azure-endpoint-here.com
#OPENAI_KEY=
```

#### Files under `env` folder

1. Whatever values you have pre-populated in the `.env` file should have the equivalent value added in the `.env.local.user` or `.env.dev.user` files.

Caveat: if ANY of the `.env.*.*` files have auto-populated values, Teams Toolkit may erroneously not auto-generate a bot id and password for you. You will need to manually generate these resources and add them to the `.env` file and where it appears in the other `.env.*.*` files.

## Using OpenAI instead of Azure OpenAI

Both services are supported in this library! You will need to make a few changes to the samples to get OpenAI to work with Teams Toolkit's auto-setup.

1. In `.env`, delete or comment out `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT`
1. Uncomment `OPENAI_API_KEY=`. Paste your OpenAI Key after the equals sign.
1. Make the same change as the above item within `.env.local.user` (JS and Python) or `.env.dev.user` (C#).
1. In the sample code, search for all instances of `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` and replace with `OPENAI_KEY`. (Note that OpenAI does not need an endpoint key.)
1. In the sample, search for all instances of `AzureOpenAI___` and replace them with `OpenAI___`. This includes the `if` statements checking the `.env` variables in `index.ts/py` (JS and Python) and `Program.cs` (C#).
1. If you see `SECRET_` prepended to any values, do NOT remove `SECRET_`. This is a convention used by Teams Toolkit to mask the value in any logging output.
   - For example, `SECRET_AZURE_OPENAI_KEY` can be modified to `SECRET_OPENAI_KEY`, but do not change it to `OPENAI_KEY`.

### AI services for deployment

- For DEPLOYMENT verify `/infra` that the correct services (Azure OpenAI v.s. OpenAI) are being added.
- This also applies to any other service you may be using, such as Azure Storage so they will also be added to the remote machine hosting your app.

## Run your app using Teams Toolkit

These directions to run Teams Toolkit are applicable to all samples.

1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the TTK extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Add required environment variables to the `.env` file AND the `env/.env.local.user`/`env/.env.dev.user` files (e.g. `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, etc.)
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge)
1. In the browser that launches, select the **Add** button to install the app to Teams.
