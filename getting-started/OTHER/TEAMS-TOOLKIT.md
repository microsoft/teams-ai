# Teams Toolkit (TTK) extra information

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [**Teams Toolkit extra information**](./TEAMS-TOOLKIT.md)
- [Teams Toolkit CLI](./TEAMS-TOOLKIT-CLI.md)
- [Bot Framework Emulator](./BOTFRAMEWORK-EMULATOR.md)
- [Manual resource setup](./MANUAL-RESOURCE-SETUP.md)

Teams Toolkit is a handy way to get up and testing your app on Teams **quickly**. The process that has been set up in our samples has been optimized for minimal configuration and maximum speed.

Using TTK will help you get a local bot running in Teams in a few minutes. This TTK setup will help by detecting and loading changes while in local development. However, there is some setup that will be required to get started.

> Note that if you are testing a sample that does not use AI in it, **you do not need to set up an Azure OpenAI or OpenAI resource**. You can skip the steps that involve Azure OpenAI or OpenAI.

### What are the different `env` files for?

1. The sample's root `.env` file is what is checked at (local) runtime. The app references `.env` to get the values it needs
2. The `env/.env.local.*` or `env/.env.dev.*` files are used by Teams Toolkit to set up various resources needed to deploy the sample E2E.

## Start with a "clean slate"

Follow these steps if you have run the samples before but want to start fresh, or if you run into a runtime error (including but not limited to an error message that says 'crypto password is incorrect')

1. Check all `.env` AND `env/.env.*.*` files in the sample and delete any values that are automatically populated. This will ensure that Teams Toolkit will generate new resources for you.
1. If you don't want Teams Toolkit to generate the app id and password for you, be sure that any `.env` file instance of `MicrosoftAppId` and `MicrosoftAppPassword` are populated with your values.
1. To avoid potential conflicts, values like `SECRET_BOT_PASSWORD` and `TEAMS_APP_UPDATE_TIME` should be removed/left blank.

### Note on provisioned resources

Teams Toolkit will automatically provision Microsoft App Id and password resources for you. If you want to use your own pre-existing resources, you will need to manually add them to the `.env` file.

If you do not want Teams Toolkit to provision resources for you, you will need to manually create them and add them to the `.env` file. Azure Bot Service in itself does not cost money, so there is no harm in letting Teams Toolkit provision resources for you.

Services like Azure OpenAI or OpenAI will need manual creation then add them to the `.env` file. The same applies to other resources like Azure Storage.

Teams Toolkit does **not** auto-generate:

- An Azure OpenAI or OpenAI key
- A database or similar storage options

You can check your provisioned resources in the [Azure Portal](https://portal.azure.com) or at the [Teams development portal](https://dev.teams.microsoft.com).

---

## Return to other major section topics:

- [CONCEPTS](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [**OTHER**](../OTHER/README.md)
