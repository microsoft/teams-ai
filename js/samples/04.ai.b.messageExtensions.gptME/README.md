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

## Prerequisites

- Microsoft 365 tenant with sideload custom apps enabled
- [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) for Visual Studio Code V5
- [OpenAI](https://platform.openai.com/account/api-keys) API Key

> We recommend that you use a Microsoft 365 Developer Tenant for developing apps for Microsoft Teams. [Join the Microsoft 365 Developer Program](https://learn.microsoft.com/office/developer-program/microsoft-365-developer-program) which includes a Microsoft 365 E5 developer subscription that you can use to create your own sandbox and develop solutions independent of your production environment.

## Run locally

- Clone this repository.
- Open the `04.ai.b.messageExtensions.gptME` sample folder in Visual Studio Code.
- Open `env/env.local.user` file.
- Set the value of the `SECRET_OPENAI_API_KEY` variable with your own key.
- Start a debug session by pressing <kbd>F5</kbd>, or using the `Run and Debug` feature in Visual Studio Code.
- Follow the prompts on screen to side load the app into Microsoft Teams.

## Interacting with the message extension

You can interact with this message extension by finding the "GPT ME" extension beneath your compose area in chats and channels. This may be accessed in the '...' ellipses menu.

The message extension provides the following functionality:

- Create Post: Generates a post using the text-davinci-003 model, with a user-provided prompt.
- Update Post: Updates a post using the text-davinci-003 model, with a user-provided prompt.
- Preview Post: Previews a post as an adaptive card.

## Deploy to Azure

> This requires you to have an active Azure subcription

- Open `env/env.dev.user` file.
- Set the value of the `SECRET_OPENAI_API_KEY` variable with your own key.
- Open the Teams Toolkit from the sidebar.
- Locate the `Lifecycle` section.
- Use the `Provision` feature to provision Azure resources.
- Use the `Deploy` feature to deploy the bot source code.
- Use the `Publish` feature to submit the app to the organisational store.
- Follow the steps to [publish](https://learn.microsoft.com/microsoftteams/submit-approve-custom-apps#approve-the-submitted-app) the submitted app in the [Microsoft Teams Admin Center](https://admin.teams.microsoft.com).
- Navigate to the [Microsoft Teams app store](https://teams.microsoft.com/_#/apps), locate the app in the `Built for your org` section and install the app.

## Limitations

The message extension has some limitations, including:

- The message extension is not able to perform tasks outside of generating and updating posts.
- The message extension is not able to provide inappropriate or offensive content.
