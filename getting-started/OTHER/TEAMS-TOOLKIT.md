1. [Migration](./00.MIGRATION.md)
2. [AI Setup](./01.AI-SETUP.md)
3. [Activity Routing](./02.ACTIVITY-ROUTING.md)
4. [QNA](./03.QNA.md)
5. [**Other**](../OTHER/TEAMS-TOOLKIT.md)

# How to develop using Teams Toolkit

Teams Toolkit is a handy way to get up and testing your app on Teams **quickly**. The process that has been set up in our samples has been optimized for minimal configuration and maximum speed.

Using TTK will help you get a local bot running in Teams in a few minutes. This TTK setup will help detecting and loading changes while in local development. However, there is some setup that will be required to get started.

Note that if you are testing a sample that does not use AI in it, **you do not need to set up an Azure OpenAI or OpenAI resource**. You can skip the steps that involve setting up an Azure OpenAI or OpenAI resource.

### Check if the sample is using AI services

1. If the sample is the term 'AI' in the name, it is using AI.
1. If the code references `AzureOpenAIPlanner` or `OpenAIPlanner`, it is using AI.
1. If you see the option to add `AZURE_OPENAI_KEY` or `OPENAI_KEY` in the `.env` file, it is using AI.
1. If none of the above apply, you can safely assume the sample does not use AI.

## Prerequisites

- JS: Teams Toolkit extension on VS Code
  - [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
- C#: Teams Toolkit extension on Visual Studio
  - [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
- Python: Teams Toolkit extension AND Python extension on Visual Studio Code
  - [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
  - [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)

Note that the `.env` file referenced in the samples is what is checked at runtime. The `.env.local.*` or `.env.dev.*` files are used by Teams Toolkit to set up the project locally. Changes need to be made to both files in order to populate the correct values at the correct time. On top of that, `.env.staging` is for setup in Azure

# "Clean slate" setup

If you have used these samples before, but want to start fresh, follow the steps below. Similarly, if you see an error when running the debugger related to 'crypto', follow these steps.

1. Check all `.env` AND `.env.*.*` files and delete any values that are automatically populated. This will ensure that Teams Toolkit will generate new resources for you.
1. If you don't want Teams Toolkit to generate the app id and password for you, be sure that any instance of `MicrosoftAppId` and `MicrosoftAppPassword` are populated with your values.
1. To avoid potential conflicts, values like `SECRET_BOT_PASSWORD` and `TEAMS_APP_UPDATE_TIME` should be removed / left blank.

Possible file names:

- `.env`
- `.env.local` (JS and Python)
- `.env.local.user` (JS and Python)
- `.env.dev` (C#)
- `.env.dev.user` (C#)
- `.env.staging` (Prod)

_Note: While we have done our best to stay consistent with file names between samples per language, there may be some differences. Please check the README for the sample you are using to ensure you are using the correct file names. If you notice any inconsistencies, please feel free to file a bug and/or file a PR!_

# .env

The `.env` file is used by the sample to populate the environment variables at runtime. This is where you will need to put your Azure OpenAI key.

1. Copy-paste your Azure OpenAI API key and Azure Endpoint into the `.env` file. If you are using OpenAI, you will need to paste your OpenAI key instead. If using OpenAI, you can safely delete `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` from the `.env` file.

```bash
MicrosoftAppId=
MicrosoftAppPassword=
AZURE_OPENAI_KEY=AZURE-OPENAI-KEY-HERE
AZURE_OPENAI_ENDPOINT=https://azure-endpoint-here.com
#OPENAI_KEY=
```

1. If you already have a Bot ID and password, add both of those to the `.env` file under `MicrosoftAppId` and `MicrosoftAppPassword`. If left blank, Teams Toolkit will help automatically generate these resources for you.

# Files under `env` folder

1. Whatever values you have pre-populated in the `.env` file should have the equivalent value added in the `.env.local.user` or `.env.dev.user` files.
1. Check `/infra` to make sure that the correct services (Azure OpenAI v.s. OpenAI) are being added.

Caveat: if ANY of the `.env.*.*` files have auto-populated values, Teams Toolkit may erroneously not auto-generate a bot id and password for you. You will need to manually generate these resources and add them to the `.env` file and where it appears in the other `.env.*.*` files.

# Using OpenAI instead of Azure OpenAI

Both services are supported in this library! You will need to make a few changes to the samples to get OpenAI to work.

1. In `.env`, delete or comment out `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT`, and uncomment `OPENAI_API_KEY=`. Paste your OpenAI Key after the equals sign.
1. Make the same change as the above item within `.env.local.user` (JS and Python) and/or `.env.dev.user` (C#).
1. In the sample code, search for all instances of `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` and replace with `OPENAI_KEY`. (Note that OpenAI does not need an endpoint key.)
1. In the sample, search for all instances of `AzureOpenAI___` and replace them with `OpenAI___`. This includes the if statements for the `.env` variables in `index.*` (JS and Python) and `Program.cs` (C#).
1. If you see `SECRET_` prepended to any values, do NOT remove `SECRET_`. This is a convention used by Teams Toolkit to mask the value in any logging output.
   - For example, `SECRET_AZURE_OPENAI_KEY` can be modified to `SECRET_OPENAI_KEY`, but do not change it to `OPENAI_KEY`.

# Note on provisioned resources

Teams Toolkit will automatically provision resources for you. If you want to use your own resources, you will need to manually create them and add them to the `.env` file. If you do not want Teams Toolkit to provision resources for you, you will need to manually create them and add them to the `.env` file.

Azure Bot Service in itself does not cost money, so by itself there is no harm in letting Teams Toolkit provision resources for you. However, if you are using Azure OpenAI or OpenAI, you will need to manually create those resources and add them to the `.env` file. The same applies to other resources like Azure Storage.

Teams Toolkit does **not** auto-generate:

- An Azure OpenAI or OpenAI key
- A database or similar storage options

You can check your provisioned resources in the Azure Portal or at the [Teams development portal](https://dev.teams.microsoft.com)

# Running your app using Teams Toolkit

Directions for using Teams Toolkit are below. These directions should be applicable to all samples.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Add required environment variables to the `.env` file AND the `env/.env.local.user`/`env/.env.dev.user` files (e.g. `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, etc.)
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge)
1. In the browser that launches, select the **Add** button to install the app to Teams.
