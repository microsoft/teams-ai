# Math Tutor Assistant

This example shows how to create a basic conversational experience using OpenAI's Assistants API's. It leverages OpenAI's Code Interpreter tool to create an assistant that's an expert on math.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Math Tutor Assistant](#math-tutor-assistant)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with this bot by sending it a message, and the bot will solve your requested math problem..

## Setting up the sample

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

> [!IMPORTANT]
> To prevent issues when installing dependencies after cloning the repo, copy or move the sample directory to it's own location first.
> If you opened this sample from the Sample Gallery in Teams Toolkit, you can skip to step 3.

1. If you do not have `yarn` installed, and want to run local bits, install it globally

    ```bash
    npm install -g yarn@1.21.1
    ```

1. In the root **JavaScript folder**, install and build all dependencies

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

1. In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    yarn start
    # If running the sample on published version of teams-ai
    npm start
    ```

1. If developing without Teams Toolkit, add your Azure OpenAI keys to the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` and `ASSISTANT_ID` variable(s) in `.env` file, which you can copy from `sample.env`. If your using OpenAI then add `OPENAI_KEY` key to the `.env` file. If using TTK, continue following the directions below.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide.

Otherwise, if want to learn about the other ways to test a sample, use Teams Toolkit or Teams Toolkit CLI, and more, please see our documentation on [different ways to run samples](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER#different-ways-to-run-the-samples).

To use Teams Toolkit, continue following the directions below.

### Using Teams Toolkit for Visual Studio Code

1. Add your Azure OpenAI key and endpoint to the `SECRET_AZURE_OPENAI_KEY` and `SECRET_AZURE_OPENAI_ENDPOINT` variables respectively in the `./env/.env.local.user` file.

If you are using OpenAI then follow these steps:

-   Comment out the the `SECRET_AZURE_OPENAI_KEY` and `SECRET_AZURE_OPENAI_ENDPOINT` variables in the `./env/.env.local.user` file.
-   Add your OpenAI key to the `SECRET_OPENAI_KEY` variable
-   Open the `teamsapp.local.yml` file and modify the last step to use OpenAI variables instead. Be sure to comment out the Azure credentials:

```yml
- uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.env
      envs:
        BOT_ID: ${{BOT_ID}}
        BOT_PASSWORD: ${{SECRET_BOT_PASSWORD}}
        OPENAI_KEY: ${{SECRET_OPENAI_KEY}}
        # AZURE_OPENAI_KEY: ${{SECRET_AZURE_OPENAI_KEY}}
        # AZURE_OPENAI_ENDPOINT: ${{SECRET_AZURE_OPENAI_ENDPOINT}}
```

-   Open `./infra/azure.bicep` and comment out lines 69-76 and uncomment lines 77-80.
-   Open `./infra/azure.parameters.json` and replace lines 20-25 with:

```json
"openAIKey": {
    "value": "${{SECRET_OPENAI_KEY}}"
},
```

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
2. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
3. Copy this sample into a new folder outside of teams-ai
4. Select File > Open Folder in VS Code and choose this sample's directory
5. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
6. Ensure that you have set up the sample from the previous step.
7. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
8. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
