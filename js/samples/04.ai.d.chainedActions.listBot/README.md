# AI in Microsoft Teams: List Bot

ListBot: Your Ultimate List Management Companion. Powered by advanced AI capabilities, this innovative bot is designed to streamline task list. With the ability to create, update, and search lists and tasks, the ListBot offers a seamless and efficient solution to help you stay on top of your to-do's and maximize productivity. Experience the ease of list management like never before, as the ListBot harnesses the power of AI to simplify your workflow and bring order to your daily tasks and showcases the action chaining capabilities.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [AI in Microsoft Teams: List Bot](#ai-in-microsoft-teams-list-bot)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

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

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    cd samples/04.ai.d.chainedActions.listBot
    ```

3. Duplicate the `sample.env` in the `teams-ai/js/samples/04.ai.d.chainedActions.listBot` folder. Rename the file to `.env`.

4. If you are using OpenAI then only keep the `OPENAI_KEY` and add in your key. Otherwise if you are using AzureOpenAI then only keep the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` variables and fill them in appropriately.

5. Update `config.json` and `index.ts` with your model deployment name.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. To use Teams Toolkit to automate setup and debugging, please [continue below](#using-teams-toolkit-for-visual-studio-code).

Otherwise, if you only want to run the bot locally and build manually, please jump to the [BotFramework Emulator](#testing-in-BotFramework-emulator) section.

For different ways to test a sample see: [Multiple ways to test](../README.md#multiple-ways-to-test)

### Using Teams Toolkit for Visual Studio Code 

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this sample's directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Ensure that you have set up the sample from the previous step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.