# AI in Microsoft Teams: List Bot

ListBot: Your Ultimate List Management Companion. Powered by advanced AI capabilities, this innovative bot is designed to streamline task list. With the ability to create, update, and search lists and tasks, the ListBot offers a seamless and efficient solution to help you stay on top of your to-do's and maximize productivity. Experience the ease of list management like never before, as the ListBot harnesses the power of AI to simplify your workflow and bring order to your daily tasks and showcases the action chaining capabilities.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [AI in Microsoft Teams: List Bot](#ai-in-microsoft-teams-list-bot)
    - [Interacting with the bot](#interacting-with-the-bot)
    - [Setting up the sample](#setting-up-the-sample)
    - [Testing the sample](#testing-the-sample)
        - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)
        - [Using Teams App Test Tool](#using-teams-app-test-tool)

<!-- /code_chunk_output -->

It shows Teams AI SDK capabilities like:

<details close>
    <summary><h4>Bot scaffolding</h4></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a Bot, like storage, authentication, task modules, and action submits.
</details>
<details close>
    <summary><h4>Prompt engineering</h4></summary>
The 'prompts/monologue/skprompt.txt' file has descriptive prompt engineering that, in plain language, instructs GPT how the bot should conduct itself at submit time. For example, in 'skprompt.txt':

**skprompt.txt**

```
The following is a conversation with an AI assistant.
The assistant can manage lists of items.

rules:
- only create lists the user has explicitly asked to create.
- only add items to a list that the user has asked to have added.
- if multiple lists are being manipulated, call a separate action for each list.
- if items are being added and removed from a list, call a separate action for each operation.

Current lists:
{{$conversation.lists}}
```

</details>
<details close>
    <summary><h4>Action chanining</h4></summary>

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
```

</details>

This sample shows how to incorporate basic conversational flow into a Teams application. It also illustrates a few of the Teams specific calls you can make from your bot.

## Interacting with the bot

You can interact with the bot by asking for a summary of the list, adding new items to the list, or removing them. You can also ask the bot to find an item in the list.

## Setting up the sample

1.  Clone the repository

        ```bash
        git clone https://github.com/Microsoft/teams-ai.git
        ```

    > [!IMPORTANT]
    > To prevent issues when installing dependencies after cloning the repo, copy or move the sample directory to it's own location first.
    > If you opened this sample from the Sample Gallery in Teams Toolkit, you can skip to step 3.

1.  If you do not have `yarn` installed, and want to run local bits, install it globally

    ```bash
    npm install -g yarn@1.21.1
    ```

1.  In the root **JavaScript folder**, install and build all dependencies

    ```bash
    cd teams-ai/js
    # This will use the latest changes from teams-ai in the sample.
    yarn install #only needs to be run once, after clone or remote pull
    yarn build
    # To run using latest published version of teams-ai, do the following instead:
    cd teams-ai/js/samples/<this-sample-folder>
    npm install --workspaces=false
    npm run build
    ```

1.  In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    yarn start
    # If running the sample on published version of teams-ai
    npm start
    ```

1.  Update any prompt `config.json` and `/src/index.ts` with your model deployment name.

1.  If developing without Teams Toolkit, add your OpenAI or Azure OpenAI key to the `OPENAI_KEY` or `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` variable(s) in `.env` file, which you can copy from `sample.env`. If using TTK, continue following the directions below.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide.

Otherwise, if want to learn about the other ways to test a sample, use Teams Toolkit or Teams Toolkit CLI, and more, please see our documentation on [different ways to run samples](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER#different-ways-to-run-the-samples).

To use Teams Toolkit, continue following the directions below.

### Using Teams Toolkit for Visual Studio Code

1. Add your OpenAI key to the `SECRET_OPENAI_KEY` variable in the `./env/.env.local.user` file.

If you are using Azure OpenAI then follow these steps:

- Comment the `SECRET_OPENAI_KEY` variable in the `./env/.env.local.user` file.
- Add your Azure OpenAI key and endpoint values to the `SECRET_AZURE_OPENAI_KEY` and `SECRET_AZURE_OPENAI_ENDPOINT` variables
- Open the `teamsapp.local.yml` file and modify the last step to use Azure OpenAI variables instead:

```yml
- uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.env
      envs:
        BOT_ID: ${{BOT_ID}}
        BOT_PASSWORD: ${{SECRET_BOT_PASSWORD}}
        #OPENAI_KEY: ${{SECRET_OPENAI_KEY}}
        AZURE_OPENAI_KEY: ${{SECRET_AZURE_OPENAI_KEY}}
        AZURE_OPENAI_ENDPOINT: ${{SECRET_AZURE_OPENAI_ENDPOINT}}
```

- Open `./infra/azure.bicep` and comment out lines 72-75 and uncomment lines 76-83.
- Open `./infra/azure.parameters.json` and replace lines 20-22 with:

```json
      "azureOpenAIKey": {
        "value": "${{SECRET_AZURE_OPENAI_KEY}}"
      },
      "azureOpenAIEndpoint": {
        "value": "${{SECRET_AZURE_OPENAI_ENDPOINT}}"
      }
```

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Copy this sample into a new folder outside of teams-ai
1. Select File > Open Folder in VS Code and choose this sample's directory
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

### Using Teams App test tool

If you are using Azure OpenAI then follow these steps:

- Comment the `SECRET_OPENAI_KEY` variable in the `./env/.env.testtool` file.
- Add your Azure OpenAI key and endpoint values to the `SECRET_AZURE_OPENAI_KEY` and `SECRET_AZURE_OPENAI_ENDPOINT` variables
- Open the `teamsapp.testtool.yml` file and modify the last step to use Azure OpenAI variables instead:

```yml
- uses: file/createOrUpdateEnvironmentFile
  with:
      target: ./.localConfigs.testTool
      envs:
          TEAMSFX_NOTIFICATION_STORE_FILENAME: ${{TEAMSFX_NOTIFICATION_STORE_FILENAME}}
          # OPENAI_KEY: ${{SECRET_OPENAI_KEY}}
          AZURE_OPENAI_KEY: ${{SECRET_AZURE_OPENAI_KEY}}
          AZURE_OPENAI_ENDPOINT: ${{SECRET_AZURE_OPENAI_ENDPOINT}}
```

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Copy this sample into a new folder outside of teams-ai
1. Select File > Open Folder in VS Code and choose this sample's directory
1. From the left pane, select **Run and Debug**(Ctrl+Shift+D) and select **Debug in Test Tool** in dropdown list.
1. Select Debug > Start Debugging or F5 to run the app.
1. The browser will pop up to open Teams App Test Tool.
