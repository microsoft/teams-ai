# Meta Llama2 in Microsoft Teams

This sample implements a custom model to utilize Meta Llama's capabilities in Microsoft Teams. The bot is built to allow the Meta Llama to facilitate light management.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Meta Llama2 in Microsoft Teams](#meta-llama2-in-microsoft-teams)
    - [Summary](#summary)
    - [Obtaining a deployed Llama 2 model in Azure](#obtaining-a-deployed-llama-2-model-in-azure)
    - [Setting up the sample](#setting-up-the-sample)
    - [Testing the sample](#testing-the-sample)
        - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Summary

This sample uses a custom LLAMA model to generate chat completions based on user input. The bot is built using the Bot Framework and the Teams Toolkit for Visual Studio Code. The bot is deployed to Microsoft Teams and can be used in a conversation to generate text completions.

To run this sample, you will need to have a deployed Meta Llama model endpoint and an API key. This can be done on [Azure Open AI Studio](https://ai.azure.com/)

## Obtaining a deployed Llama 2 model in Azure

1. To obtain a deployed llama model, you will need to have an Azure account and access to the Azure Open AI Studio. You can create a new model by following the instructions on the [Azure Open AI Studio](https://ai.azure.com/) website.

    ![image](https://github.com/microsoft/teams-ai/assets/14900841/b427f1b7-163b-4517-acba-d09e75fb39ea)

1. To deploy a model, use the website UI to go to the "Build" section. Create a new deployment and AI project. At the time of writing this README, a LLAMA model must be in East US 2 or West US 3 region.
   ![image](https://github.com/microsoft/teams-ai/assets/14900841/e8c8f0b1-1f94-4c6c-81b5-334e4fb6716a)

1. Following the UI, create a 'llama-2-7b-chat-18' mode. This allows for chat completion, and this sample follows the API of this model.

    ![image](https://github.com/microsoft/teams-ai/assets/14900841/f42f749e-d8c8-4f79-a68e-50a8beae9860)

    > **Note**: _At the time of writing_, this model is only deployable as a Pay-As-You-Go resource. Depending on your tenant rules, it is also possible that the model may only be deployed for one week before it is deleted.

1. When setting up your bot, you will be able to use the endpoint urls and private key as listed above in your `config.json` and `.env` files to get the sample working.

For more information on using Llama 2 in Azure, see the [Llama 2 on Azure documentation](https://llama-2.ai/llama-2-on-azure/).

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

1.  In the root JavaScript folder, install and build all dependencies

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

1.  Duplicate the `sample.env` in the sample's folder. Rename the file to `.env`.

1.  Update the `.env` file with your bot's `BOT_ID` and `BOT_PASSWORD`. Under `LLAMA_API_KEY`, add the API key for the model you want to use. Finally, add the `LLAMA_ENDPOINT` value.

1.  Update `config.json` and `index.ts` with your model deployment name.

## Testing the sample

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide.

Otherwise, if want to learn about the other ways to test a sample, use Teams Toolkit or Teams Toolkit CLI, and more, please see our documentation on [different ways to run samples](https://github.com/microsoft/teams-ai/tree/main/getting-started/OTHER#different-ways-to-run-the-samples).

To use Teams Toolkit, continue following the directions below.

### Using Teams Toolkit for Visual Studio Code

1. Add your Llama key and endpoint to the `SECRET_LLAMA_API_KEY` and `SECRET_LLAMA_ENDPOINT` variables in the `./env/.env.local.user` file.

### Using Teams Toolkit for Visual Studio Code

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Copy this sample into a new folder outside of teams-ai
1. Select File > Open Folder in VS Code and choose this sample's directory
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.
