# Running in Teams

Now that your agent is running locally, let's deploy it to Microsoft Teams for testing. This guide will walk you through the process.

## M365 Agents Toolkit

M365 Agents Toolkit is a powerful tool that simplifies deploying and debugging Teams applications. It automates tasks like managing the Teams app manifest, configuring authentication, provisioning, and deployment. If you'd like to learn what it helps automate, check out [Teams core concepts](../teams/core-concepts.md).

### Install M365 Agents Toolkit

First, you'll need to install the M365 Agents Toolkit IDE extension:

- Visit the [M365 Agents Toolkit installation guide](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/install-teams-toolkit) to install on your preferred IDE.

## Adding Teams configuration files via `teams` CLI

To configure your agent for Teams, run the following command in the terminal inside your quote-agent folder:

<!-- langtabs-start -->
```bash
# (if you have `teams` CLI installed globally, use `teams` instead of `npx`)
npx @microsoft/teams.cli config add ttk.basic
```
<!-- langtabs-end -->

> [!TIP]
> The `ttk.basic` configuration is a basic setup for Agents Toolkit. It includes the necessary files and configuration to get started with Teams development.<br/>
> Explore more advanced configurations as needed with teams config --help.<br>

This [CLI](../developer-tools/cli/README.md) command adds configuration files required by M365 Agents Toolkit, including:

- Environment setup in the `env` folder and root `.env` file
- Teams app manifest in the `appPackage` folder (if not already present)
- Debug instructions in `.vscode/launch.json` and `.vscode/tasks.json`
- Agents Toolkit automation files to your project (e.g. `teamsapp.local.yml`)

> [!NOTE]
> Note that running `teams config add` command line via the Teams CLI is equivalent **but not equal** to initializing a Teams project using the M365 Agents Toolkit extension or the [Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-cli?pivots=version-three). **Depending on the sample you choose via M365 Agents Toolkit, that project may or may not be using Teams AI v2 library.**

The Teams CLI (Teams AI v2 CLI) helps with M365 Agents Toolkit configuration, but it is not a replacement for the M365 Agents Toolkit extension or the Agents Toolkit CLI itself. Both CLI tools will support development in different ways.

| Cmd name   | CLI name      | Description                                                                                                                                        |
| ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teams`    | Teams AI v2   | A tool for setting up and utilizing the Teams AI v2 library including integration with Agents Toolkit, if desired.                                            |
| `atk` | M365 Agents Toolkit | A tool for managing provisioning, deployment, and in-client debugging for Teams. These samples do **not** necessarily use the Teams AI v2 library. |

## Debugging in Teams

After installing Agents Toolkit and adding the configuration:

1. **Open** your agent's project in your IDE.
2. **Open the Agents Toolkit extension panel** (usually on the left sidebar). The extension icon is the Teams logo.
3. **Log in** to your M365 and Azure accounts in the toolkit extension.
4. **Select "Local"** under Environment Settings of the toolkit extension.
5. **Click on Debug (Chrome) or Debug (Edge)** to start debugging via the 'play' button.

![M365 Agents Toolkit local environment UI](../assets/screenshots/teams-toolkit.png)

When debugging starts, the Agents Toolkit will:

- **Build** your application
- **Start a [devtunnel](../teams/core-concepts.md#devtunnel)** which will assign a temporary public URL to your local server
- **Provision the Teams app** for your tenant so that it can be installed and be authenticated on Teams
- **Set up the local variables** necessary for your agent to run in Teams in `env/.env.local` and `env/env.local.user`. This includes propagating the app manifest with your newly provisioned resources.
- **Start** the local server.
- **Package your app manifest** into a Teams application zip package and the manifest json with variables inserted in `appPackage/build`.
- **Launch Teams** in an incognito window your browser.
- **Upload the package** to Teams and signal it to sideload the app (fancy word for installing this app just for your use)

If you set up Agents Toolkit configuration via the Teams AI CLI, you should see something like the following in your terminal:

<!-- langtabs-start -->
```sh
[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**
[nodemon] watching extensions: ts
[nodemon] starting `node -r ts-node/register -r dotenv/config ./src/index.ts`
[WARN] @teams/app/devtools ⚠️  Devtools are not secure and should not be used production environments ⚠️
[INFO] @teams/app/http listening on port 3978 🚀
[INFO] @teams/app/devtools available at http://localhost:3979/devtools
```
<!-- langtabs-end -->

## Testing your agent

After the debugging session starts:

1. Teams will open in your browser
2. You'll be prompted to sign in (if not already)
3. Teams will ask permission to install the app
4. Once installed, you can start chatting with your agent!

![Agent running on Teams](../assets/screenshots/example-on-teams.png)

Congratulations! Now you have a fully functional agent running in Microsoft Teams. Interact with it just like any other Teams app and explore the rest of the documentation to build more complex agents.

> [!TIP]
> If you want to monitor the activities and events in your app, you can still use the [DevTools plugin](../developer-tools/devtools/README.md)! Note that the DevTools server is running on port 3979. You can open it in your browser to interact with your agent and monitor activities in real time.

## Troubleshooting

While Teams AI v2 SDK heavily endorses M365 Agents Tookit, you can run your agent in Teams without it. However, using the toolkit saves time and effort.

> [!CAUTION]
> Please note that M365 Agents Toolkit is not managed by the Teams AI team. For problems running the toolkit, please refer to the [M365 Agents Toolkit documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/overview) or contact the [M365 Agents Toolkit team](https://github.com/OfficeDev/Teams-Toolkit).

> [!CAUTION]
> Teams AI v2 library focuses on building agents and does not support manual resource management. If you are having trouble with provisioning or deployment, please refer to the M365 Agents Toolkit documentation or the [Microsoft Teams deployment documentation](https://learn.microsoft.com/en-us/microsoftteams/deploy-overview).

## Next steps

Now that your agent is running in Teams, you can learn more [essential concepts](../essentials/README.md) to understand how to build more complex agents. Explore the [in-depth guides](../in-depth-guides/README.md) for advanced topics like authentication, message extensions, and more.

## Resources

- [Teams CLI documentation](../developer-tools/cli/README.md)
- [M365 Agents Toolkit documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/overview)
- [M365 Agents Toolkit CLI documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/cli/README.md)
- [Teams CLI GitHub repository](https://github.com/OfficeDev/Teams-Toolkit)
- [Microsoft Teams deployment documentation](https://learn.microsoft.com/en-us/microsoftteams/deploy-overview)
