# DevOps Agent

This is a sample agent demonstrating DevOps capablities through Semantic Kernel, GitHub and Azure Open AI. 
The sample is built as a [GitHub App](https://docs.github.com/en/apps) but can be swapped for another repository tool.

For GitHub, note that the repository you choose must be in an organization in which you have admin privileges.

This sample requires creating an OAuth Connection in Azure Bot Service.

## Interacting with the Agent

You can start to interact with this agent by sending it a message. This will prompt the login flow, where you will be forwarded to the GitHub Oauth portal on the browser.

The agent has three primary capablities (for 1 repo):

- List and filter pull requests (based on labels, assignees, and authors)
- Send a proactive message in a group chat and channel, when there is a new assignee on a pull request
- Send a proactive message in a group chat and channel, when there is a status update on a pull request

## Setting up the GitHub App

For your agent to connect to GitHub, it needs to be registered as a GitHub app for your organization.

Follow the instructions [here](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).

Mark down the `Client ID` and `Client Secret`, these will need to be copied into the `/env/.env.local` file later.

Your setup should be similiar to this sceenshot. Make sure your `Callback URL` matches the below.

(e.g., `https://token.botframework.com/.auth/web/redirect`)

![Oauth Callback](assets/oauth-redirect.jpg)

## Setting up the Agent Locally

Follow the steps here, up to Local Debug (F5): [Setup Instructions](https://github.com/microsoft/teams-ai/blob/main/dotnet/samples/README.md).

1. Set your keys for Azure and GitHub in *appsettings.Development.json*.

    ```json
      "Azure": {
        "OpenAIApiKey": "",
        "OpenAIEndpoint": "",
        "OpenAIDeploymentName": "gpt-4o",
        "OpenAIModelId": "gpt-4o"
      },
      "GITHUB_OWNER": "",
      "GITHUB_REPOSITORY": "",
      "GITHUB_CLIENT_ID": "",
      "GITHUB_CLIENT_SECRET": ""
    ```

2. Complete similiar updates in *.env.local*
3. Now that the solution is clean, built, dependencies are prepared, and dev tunnel is specified- press F5 for local debugging.

## Setting up Webhooks
**NOTE: Please follow this step after you are in F5 Debug mode.**

In order for GitHub to send a notification to your agent, you must specify a webhook on your repository and connect it to your local devtunnel.

Here, we will be subscribing to PR events. More information is available [here](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps).

1. Navigate to your GitHub App in your organization settings.
2. Scroll to the bottom of the 'General' tab, you should find yourself in the 'Webhook' section.
3. The `Webhook  URL` is equal to your `BOT_ENDPOINT` in the `env/.env.local` file, followed by `/api/webhook`.
(e.g., `https://f3z8srb6-3978.usw2.devtunnels.ms/api/webhook`)

![Webhook](assets/webhook.jpg)

Make sure to hit save. Now your agent will receive events!

## Swapping the Repository Tool

Although this agent is currently configured to use GitHub, you can easily swap for another repository tool.

Note the restrictions:
- Only one tool can be configured at a time, due to the Azure bicep file deployments.
- Different tools require different API keys, hence these will need to be added manually
- Authentication is restricted to only Oauth Azure Bot Service Providers.

There are 4 primary components. You may define your own structs similiar to those in `GitHubModels`

### 1) Authentication 
1. Update `teamsapp.yml` and `teamsapp.local.yml`, with your keys in the `file/createOrUpdateJsonFile` step.
2. In `.env.local`, update `OAUTH_CONNECTION_NAME` to your respective tool, and add in your keys.
3. Similiarly, update your keys in the `appsettings.Development.json` file.
4. Update the files inside the `/infra` folder - this controls the local deployments and the Oauth Service Provider registration.
Replace the GitHub values with your new tool.

### 2) Activity Handlers
All handlers are registered in `Program.cs`. These can be easily updated and customized. 

The two to update for `ListPRs` are:
 `app.AdaptiveCards.OnActionSubmit(...)` and `app.OnActivity(ActivityTypes.Message...)`

 The latter generic message handler is used to route messages to Semantic Kernel.

### 3) Webhooks
All webhook URLs must start with `api/webhook`.
Create a service class for your tool.
Your service class must extend `IRepositoryService` (e.g., `GitHubService`). 
The `BotController` will route incoming webhook POST events to this class via `HandleWebhook`.

Instiate your service inside `Program.cs` in the `IRepositoryService` transient registration.

```csharp
GitHubPlugin plugin = new(client, config);
return new GitHubService(storage, adapter, plugin);
```

### 4) Plugins
All plugins must follow the Semantic Kernel requirements and extend `IRepositoryPlugin` (e.g., `GitHubPlugin`). 
Note that `ListPRs` is a required plugin to implement. You may also implement `FilterPRs` depending on what filters
your tool provides.

Instantiate your plugin inside `Program.cs` in the `IRepositoryService` transient registration (see above).
Then, update the plugin provided during the Semantic Kernel registration.

```csharp
 GitHubPlugin plugin = (GitHubPlugin)repoService.RepositoryPlugin;
 kernelBuilder.Plugins.AddFromObject(plugin, "GitHubPlugin");
```

Both ListPRs and FilterPRs are manually invoked via the activity handlers, to allow the rendering of adaptive cards. 

Please use the methods inside `KernelOrchestrator` to manage conversation history. Be sure to also update the prompt
in `KernelOrchestrator.InitiateChat`.