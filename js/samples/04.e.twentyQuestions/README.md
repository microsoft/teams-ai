# AI in Microsoft Teams: Twenty Qestions

This sample is a message extension (ME) for Microsoft Teams that leverages the text-davinci-003 model to help users generate and update posts. The extension is designed to assist users in creating posts that are appropriate for a business environment.

This sample illustrates basic ME behavior in Microsoft Teams. The ME is built to allow GPT to facilitate the conversation by generating posts based on what the user requires. i.e., “Make my post sound more professional.”

It shows M365 botbuilder SDK capabilities like:

<details open>
    <summary><h3>Message extension scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a simple message extension, like storage, authentication, task modules, and action submits.
</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The 'generate.txt' and 'update.txt' files have descriptive prompt engineering that, in plain language, instructs GPT how the message extension should conduct itself at submit time. For example, in 'generate.txt':

#### generate.txt

```
This is a Microsoft Teams extension that assists the user with creating posts.
Using the prompt below, create a post that appropriate for a business environment.
Prompt: {{data.prompt}}
Post:
```

</details>
<details open>
    <summary><h3>Action mapping</h3></summary>
Since a message extension is a UI-based component, user actions are explicitly defined (as opposed to a conversational bot). This sample shows how ME actions can leverage LLM logic:

```javascript
interface SubmitData {
    verb: 'generate' | 'update' | 'post';
    prompt?: string;
    post?: string;
}

app.messageExtensions.submitAction<SubmitData>('CreatePost', async (context: TurnContext, state: ApplicationTurnState, data: SubmitData) => {
    try {
        switch (data.verb) {
            case 'generate':
                // Call GPT and return response view
                return await updatePost(context: TurnContext, state: ApplicationTurnState,  '../src/generate.txt', data);
            case 'update':
                // Call GPT and return an updated response view
                return await updatePost(context: TurnContext, state: ApplicationTurnState,  '../src/update.txt', data);
            case 'post':
            default:
                // Preview the post as an adaptive card
                const card = createPostCard(data.post!);
                return {
                    type: 'result',
                    attachmentLayout: 'list',
                    attachments: [card]
                } as MessagingExtensionResult;
        }
    } catch (err: any) {
        return `Something went wrong: ${err.toString()}`;
    }
});
```

</details>

This bot has been created using [Bot Framework](https://dev.botframework.com).

## To try this sample in Teams

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/teams-ai.git
    ```

2. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd teams-ai/js
    yarn install
    yarn build
    ```

### Using Teams Toolkit for Visual Studio Code

The simplest way to run this sample in Teams is to use Teams Toolkit for Visual Studio Code.

1. Ensure you have downloaded and installed [Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview)
1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
1. Select **File > Open Folder** in VS Code and choose this samples directory from the repo
1. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT
1. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
1. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

### Using Teams Toolkit CLI

You can also use the Teams Toolkit CLI to run this sample. 

1. Install the CLI

    ```bash
    npm install -g @microsoft/teamsfx-cli
    ```

1. Open a second shell instance and run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Copy the ngrok URL and put the URL and domain in the `/env/env.local` file

    ```
    BOT_ENDPOINT=https://{ngrok-url}.ngrok.io
    BOT_DOMAIN={ngrok-url}.ngrok.io
    ```
1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT

1. In the repository directory, run the Teams Toolkit CLI commands to automate the setup needed for the app

    ```bash
    cd teams-ai/js/samples/04.e.twentyquestions/
    teamsfx provision --env local

1. Next, use the CLI to validate and create an app package

    ```bash
    teamsfx deploy --env local
    ```

1. Finally, use the CLI to preview the app in Teams

    ```bash
    teamsfx preview --env local
    ```

### Manually upload the app to a Teams desktop client

> If you used Teams Toolkit in the above steps, you can [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) to a desktop client using the `/appPackage/appPackage.local.zip` file created by the tools and skip to step 6.

1. In a terminal, navigate to `teams-ai/js/samples/04.e.twentyquestions/`

    ```bash
    cd teams-ai/js/samples/04.e.twentyquestions
    ```

1. Run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the Azure Portal and you can always create a new client secret anytime.)
1. Update the `.env` file and provide your [OpenAI Key](https://openai.com/api/) key for leveraging GPT
1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `appPackage` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `${{TEAMS_APP_ID}}` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `${{BOT_ID}}`. Replace everywhere you see `${{BOT_DOMAIN}}` with the domain part of the URL created by your tunneling solution.
    - **Zip** up the contents of the `appPackage` folder to create a `manifest.zip`

1. Run your app from the command line:

    ```bash
    yarn start
    ```

1. [Upload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) file (manifest.zip created in the previous step) in Teams.

## Limitations

The message extension has some limitations, including:

-   The bot is not able to perform tasks outside of generating and updating posts.
-   The bot is not able to provide inappropriate or offensive content.

## Deploy the bot to Azure

You can use Teams Toolkit for VS Code or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure. 

To configure the Azure resources to have an environment variable for the OpenAI Key:

1. Add a `./env/.env.staging.user` file with a new variable, `SECRET_OPENAI_KEY=` and paste your [OpenAI Key](https://openai.com/api/). 

The `SECRET_` prefix is a convention used by Teams Toolkit to mask the value in any logging output and is optional.

Use the **Provision** and **Deploy** menus of the Teams Toolkit extension or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading
-   [Teams Toolkit overview](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)

