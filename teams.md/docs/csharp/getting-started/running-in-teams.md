---
sidebar_position: 3
---

# Running In Teams

Now that your agent is running locally, let's deploy it to Microsoft Teams for testing. This guide will walk you through the process.

## Teams Toolkit

Teams Toolkit is a powerful tool that simplifies deploying and debugging Teams applications. It automates tasks like managing the Teams app manifest, configuring authentication, provisioning, and deployment. If you'd like to learn what it helps automate, check out [Teams core concepts](/teams/core-concepts).

### Install Teams Toolkit (TTK)

First, you'll need to install the Teams Toolkit IDE extension:

- Visit the [Teams Toolkit installation guide](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/install-teams-toolkit) to install on your preferred IDE.

## Adding Teams configuration files via `teams` CLI

To configure your agent for Teams, run the following command in the terminal inside your quote-agent folder:

:::tip
(if you have `teams` CLI installed globally, use `teams` instead of `npx`)
:::

```bash
npx @microsoft/teams.cli config add ttk.basic
```

:::tip
The `ttk.basic` configuration is a basic setup for Teams Toolkit. It includes the necessary files and configuration to get started with Teams development.<br/>
Explore more advanced configurations as needed with teams config --help.<br />
:::

This [CLI](/developer-tools/cli) command adds configuration files required by Teams Toolkit, including:

- Environment setup in the `env` folder and root `.env` file
- Teams app manifest in the `appPackage` folder (if not already present)
- Debug instructions in `.vscode/launch.json` and `.vscode/tasks.json`
- TTK automation files to your project (e.g. `teamsapp.local.yml`)

:::note
Note that running `teams config add` command line via the Teams CLI is equivalent **but not equal** to initializing a Teams project using the Teams Toolkit extension or the [Teams Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-cli?pivots=version-three). **Depending on the sample you choose via Teams Toolkit, that project may or may not be using Teams AI v2 library.**
:::

The Teams CLI (Teams AI v2 CLI) helps with TTK configuration, but it is not a replacement for the Teams Toolkit extension or the Teams Toolkit CLI itself. Both CLI tools will support development in different ways.

| Cmd name   | CLI name      | Description                                                                                                                                        |
| ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teams`    | Teams AI v2   | A tool for setting up and utilizing the Teams AI v2 library including integration with TTK, if desired.                                            |
| `teamsapp` | Teams Toolkit | A tool for managing provisioning, deployment, and in-client debugging for Teams. These samples do **not** necessarily use the Teams AI v2 library. |

## Debugging in Teams

After installing Teams Toolkit and adding the configuration:

1. **Open** your agent's project in your IDE.
2. **Open the Teams Toolkit extension panel** (usually on the left sidebar). The extension icon is the Teams logo.
3. **Log in** to your M365 and Azure accounts in the TTK extension.
4. **Select "Local"** under Environment Settings of the TTK extension.
5. **Click on Debug (Chrome) or Debug (Edge)** to start debugging via the 'play' button.

![Teams Toolkit local environment UI](/screenshots/teams-toolkit.png)

When debugging starts, the Teams Toolkit will:

- **Build** your application
- **Start a [devtunnel](/teams/core-concepts#devtunnel)** which will assign a temporary public URL to your local server
- **Provision the Teams app** for your tenant so that it can be installed and be authenticated on Teams
- **Set up the local variables** necessary for your agent to run in Teams in `env/.env.local` and `env/env.local.user`. This includes propagating the app manifest with your newly provisioned resources.
- **Start** the local server.
- **Package your app manifest** into a Teams application zip package and the manifest json with variables inserted in `appPackage/build`.
- **Launch Teams** in an incognito window your browser.
- **Upload the package** to Teams and signal it to sideload the app (fancy word for installing this app just for your use)

If you set up TTK via the Teams AI CLI, you should see something like the following in your terminal:


```sh
[INFO] Microsoft.Hosting.Lifetime Now listening on: http://localhost:3978
[WARN] Echo.Microsoft.Teams.Plugins.AspNetCore.DevTools ⚠️  Devtools are not secure and should not be used production environments ⚠️
[INFO] Echo.Microsoft.Teams.Plugins.AspNetCore.DevTools Available at http://localhost:3978/devtools
[INFO] Microsoft.Hosting.Lifetime Application started. Press Ctrl+C to shut down.
[INFO] Microsoft.Hosting.Lifetime Hosting environment: Development
```


## Testing your agent

After the debugging session starts:

1. Teams will open in your browser
2. You'll be prompted to sign in (if not already)
3. Teams will ask permission to install the app
4. Once installed, you can start chatting with your agent!

![Agent running on Teams](/screenshots/example-on-teams.png)

Congratulations! Now you have a fully functional agent running in Microsoft Teams. Interact with it just like any other Teams app and explore the rest of the documentation to build more complex agents.

:::tip
If you want to monitor the activities and events in your app, you can still use the [DevTools plugin](/developer-tools/devtools)! Note that the DevTools server is running on port 3978. You can open it in your browser to interact with your agent and monitor activities in real time.
:::

## Troubleshooting

While Teams AI v2 SDK heavily endorses Teams Tookit (TTK), you can run your agent in Teams without it. However, using TTK saves time and effort.

:::warning
Please note that TTK is not managed by the Teams AI team. For problems running TTK, please refer to the [Teams Toolkit documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/overview) or contact the [Teams Toolkit team](https://github.com/OfficeDev/Teams-Toolkit).
:::

:::warning
Teams AI v2 library focuses on building agents and does not support manual resource management. If you are having trouble with provisioning or deployment, please refer to the Teams Toolkit documentation or the [Microsoft Teams deployment documentation](https://learn.microsoft.com/en-us/microsoftteams/deploy-overview).
:::

## Next steps

Now that your agent is running in Teams, you can learn more [essential concepts](../essentials) to understand how to build more complex agents. Explore the [in-depth guides](../in-depth-guides) for advanced topics like authentication, message extensions, and more.

## Resources

- [Teams CLI documentation](/developer-tools/cli)
- [Teams Toolkit documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/overview)
- [Teams Toolkit CLI documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/cli)
- [Teams CLI GitHub repository](https://github.com/OfficeDev/Teams-Toolkit)
- [Microsoft Teams deployment documentation](https://learn.microsoft.com/en-us/microsoftteams/deploy-overview)
