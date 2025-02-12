# OSS Devops Agent

This is a sample agent demonstrating OSS DevOps capablities through GitHub and Azure Open AI. The sample is scoped to one specific GitHub repository of your choice.

This sample requires creating an OAuth Connection in Azure Bot Service, which provides a token store to store the token after sign-in.

## Interacting with the Agent

You can start to interact with this agent by sending it a message.

Once you are ready to authenticate, send a message containing the keyword `login`. You will then be forwarded to the GitHub Oauth portal on the browser.

The agent has three primary capablities (for 1 repo):

- List pull requests

![List Pull Requests](assets/list-pull-requests.png)

- Retrieve a specific pull request

![Retrieve a Pull Request](assets/get-pull-request.png)

- Send a proactive message when there is a new assignee on a pull request

![New assignee](assets/new-assignee.png)


## Setting up the GitHub Oauth App

For your agent to connect to GitHub and allow for user access, it needs to be registered as an Oauth app.

Follow the instructions provided by GitHub [here](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

Mark down what the `Client ID` and `Client Secret` are, as these will need to be copied into the `.env` file later.

Your setup should be similiar to this sceenshot. Make sure your `authorization callback URL` matches the below.

(e.g., `https://token.botframework.com/.auth/web/redirect`)

![Oauth App Settings](assets/oauth-app-settings.png)

## Setting up the Agent locally
1. In a terminal, navigate to the sample root.

    ```bash
    cd samples/<this-sample-folder>/
    yarn install
    yarn build
    ```

2. Duplicate the `sample.env` in this folder. Rename the file to `.env`.

3. Fill in the `.env` variables with your keys. You can leave the `BOT_ID` and `BOT_PASSWORD` empty.

## Using Teams Toolkit for Visual Studio Code

The easiest and fastest way to get up and running is with Teams Toolkit as your development guide. 

1. Install the [Teams Toolkit extension](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
2. Using the extension, sign in with your Microsoft 365 account where you have permissions to upload custom apps
3. Verify that the Teams Toolkit extension is connected to your Teams account from the above step.
4. Select **Debug > Start Debugging** or **F5** to run the app in a Teams web client.
5. In the browser that launches, select the **Add** button to install the app to Teams.

> If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a Microsoft 365 Developer Program account - a free program to get your own dev environment sandbox that includes Teams.

## Setting up the Webhook Connection
**NOTE: Please follow this step after you are in F5 Debug mode.**

In order for GitHub to send a notification to your agent, you must specify a webhook on your repository and connect it to your local devtunnel.

Here, we will be subscribing to pull request events.

Follow the Github Repository Webhook guidance [here](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks#creating-a-repository-webhook).

The `payload URL` is equal to your `BOT_ENDPOINT` in the `env/.env.local` file, followed by `/api/webhook`.

The final settings configured should follow a similiar format:

![Repository Webhook Setup](/assets/webhook-settings.png)

![Webhook Pull Request Events](/assets/oauth-webhook-events.png)

Make sure to hit save, and that the webhook is checked off as `Active`. Now your agent is ready to go!