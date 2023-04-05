# AI in Microsoft Teams Message Extensions: GPT-ME

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
                return await updatePost(context: TurnContext, state: ApplicationTurnState,  '../src/generate.txt', data: SubmitData);
            case 'update':
                // Call GPT and return an updated response view
                return await updatePost(context: TurnContext, state: ApplicationTurnState,  '../src/update.txt', data: SubmitData);
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

## Prerequisites

-   Microsoft Teams is installed and you have an account
-   [NodeJS](https://nodejs.org/en/) (version 16.x)
-   [ngrok](https://ngrok.com/) or equivalent tunnelling solution
-   [OpenAI](https://openai.com/api/) key for leveraging GPT

## To try this sample

> Note these instructions are for running the sample on your local machine, the tunnelling solution is required because the Teams service needs to call into the bot.

1. Clone the repository

    ```bash
    git clone https://github.com/Microsoft/botbuilder-m365.git
    ```

1. In the root JavaScript folder, install and build all dependencies

    ```bash
    cd botbuilder-m365/js
    yarn install
    yarn build
    ```

    - If you already ran `yarn install` and `yarn build` in the `js` folder, you are ready to get started with ngrok. Otherwise, you need to run `yarn install` and `yarn build` in the `js` folder.

1. In a terminal, `cd` to this directory

1. Run ngrok tunneling service - point to port 3978

    ```bash
    ngrok http --host-header=rewrite 3978
    ```

1. Create [Bot Framework registration resource](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) in Azure

    - Use the current `https` URL you were given by running ngrok. Append with the path `/api/messages` used by this sample.
    - Ensure that you've [enabled the Teams Channel](https://docs.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0)
    - **_If you don't have an Azure account_** you can use this [Bot Framework registration](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams#register-your-web-service-with-the-bot-framework)

1. Update the `.env` configuration for the bot to use the Microsoft App Id and App Password from the Bot Framework registration. (Note the App Password is referred to as the "client secret" in the azure portal and you can always create a new client secret anytime.) The configuration should include your OpenAI API Key in the `OPEN_API_KEY` property.

1. **_This step is specific to Teams._**

    - **Edit** the `manifest.json` contained in the `teamsAppManifest` folder to replace your Microsoft App Id (that was created when you registered your bot earlier) _everywhere_ you see the place holder string `<<YOUR-MICROSOFT-APP-ID>>` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`). If you haven't created an Azure app service yet, you can use your bot id for the above. You're bot id should be pasted in where you see `___YOUR BOTS ID___`
    - **Zip** up the contents of the `teamsAppManifest` folder to create a `manifest.zip`
    - **[Sideload the app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) (manifest zip) file** the `manifest.zip` to Teams (in the Apps view click "Upload a custom app")

1. Run your bot at the command line:

    ```bash
    yarn start
    ```

## Interacting with the message extension

You can interact with this message extension by finding the "GPT ME" extension beneath your compose area in chats and channels. This may be accessed in the '...' ellipses menu.

The message extension provides the following functionality:

-   Create Post: Generates a post using the text-davinci-003 model, with a user-provided prompt.
-   Update Post: Updates a post using the text-davinci-003 model, with a user-provided prompt.
-   Preview Post: Previews a post as an adaptive card.

## Limitations

The message extension has some limitations, including:

-   The bot is not able to perform tasks outside of generating and updating posts.
-   The bot is not able to provide inappropriate or offensive content.

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions.

## Further reading

-   [How Microsoft Teams bots work](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=javascript)
