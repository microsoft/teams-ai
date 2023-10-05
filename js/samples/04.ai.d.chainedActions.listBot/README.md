# AI in Microsoft Teams: List Bot

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

-   [AI in Microsoft Teams: List Bot](#ai-in-microsoft-teams-list-bot)
    -   [Setting up the sample](#setting-up-the-sample)
        -   [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        -   [Using Teams Toolkit CLI](#using-teams-toolkit-cli)
        -   [Manually upload the app to a Teams desktop client](#manually-upload-the-app-to-a-teams-desktop-client)
    -   [Interacting with the bot](#interacting-with-the-bot)
    -   [Deploy the bot to Azure](#deploy-the-bot-to-azure)
    -   [Further reading](#further-reading)

<!-- /code_chunk_output -->

ListBot: Your Ultimate List Management Companion. Powered by advanced AI capabilities, this innovative bot is designed to streamline task list. With the ability to create, update, and search lists and tasks, the ListBot offers a seamless and efficient solution to help you stay on top of your to-do's and maximize productivity. Experience the ease of list management like never before, as the ListBot harnesses the power of AI to simplify your workflow and bring order to your daily tasks and showcases the action chaining capabilities.

It shows Teams AI SDK capabilities like:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a Bot, like storage, authentication, task modules, and action submits.
</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The 'generate.txt' and 'update.txt' files have descriptive prompt engineering that, in plain language, instructs the Assistant how the message extension should conduct itself at submit time. For example, in 'generate.txt':

#### generate.txt

```
This is a Microsoft Teams extension that assists the user with creating posts.
Using the prompt below, create a post that appropriate for a business environment.
Prompt: {{data.prompt}}
Post:
```

</details>
<details open>
    <summary><h3>Action chanining</h3></summary>

```javascript
// Register action handlers
app.ai.action('createList', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    ensureListExists(state, data.list);
    return true;
});

app.ai.action('deleteList', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    deleteList(state, data.list);
    return true;
});

app.ai.action('addItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    items.push(data.item);
    setItems(state, data.list, items);
    return true;
});

app.ai.action('removeItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        items.splice(index, 1);
        setItems(state, data.list, items);
        return true;
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));

        // End the current chain
        return false;
    }
});

app.ai.action('findItem', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        await context.sendActivity(responses.itemFound(data.list, data.item));
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));
    }

    // End the current chain
    return false;
});

app.ai.action('summarizeLists', async (context: TurnContext, state: ApplicationTurnState, data: EntityData) => {
    const lists = state.conversation.value.lists;
    if (lists) {
        // Chain into a new summarization prompt
        state.temp.value.lists = lists;
        await app.ai.chain(context, state, 'summarize');
    } else {
        await context.sendActivity(responses.noListsFound());
    }

    // End the current chain
    return false;
});
```

</details>

This sample shows how to incorporate basic conversational flow into a Teams application. It also illustrates a few of the Teams specific calls you can make from your bot.

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    cd samples/04.ai.d.chainedactions.listbot
    ```

## Interacting with the bot

You can interact with the bot by asking for a summary of the list, adding new items to the list, or removing them. You can also ask the bot to find an item in the list.

## Multiple ways to test

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to continue setup and debugging, please continue below.

## Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

### Prerequisites

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
    - Note that running the debugger from the root of the repo will not work - you must open a new window at the sample's root.
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Add required environment variables to the `.env` file AND the `env/.env.local.user` files (e.g. `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, etc.). For more information see [Getting Started - Teams Toolkit](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md)
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client (in Microsoft Edge).
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Using Teams Toolkit CLI

You can also use the Teams Toolkit CLI to run this sample.

Navigate to [Teams Toolkit CLI](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER/TEAMS-TOOLKIT.md#teams-toolkit-cli) for running samples via the CLI tool.

## Manually upload the app to a Teams desktop client

If you would prefer to create the Azure Bot Resources manually instead of automating via Teams Toolkit, read more information at [Manual resource setup](../../../getting-started/OTHER/MANUAL-RESOURCE-SETUP.md).

## Testing in BotFramework Emulator

[Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator) Allows testing bots independently from Channels when developing your bot. If you do not wish to use Teams Toolkit, please follow the steps below to test your bot in Emulator.

Visit the getting started documentation on [running BF Emulator](../../../getting-started/OTHER/BOTFRAMEWORK-EMULATOR.md) to learn how to use the tool.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

To configure the Azure resources to have an environment variable for the AzureOpenAI Key:

1. Add a `./env/.env.staging.user` file with a new variable, `SECRET_AZURE_OPENAI_KEY=` and paste your Azure OpenAI key.

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

Use the **Provision**, **Deploy**, and **Publish** buttons of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
