# Teams CLI

The Teams CLI was created with the intent of supporting developers by making common actions simple to implement with just a command line. The CLI overarching features are:

| Feature | Description |
|---------|-------------|
| `new` | Create a new Teams AI v2 agent by choosing a template that will be ready to run with one command line. |
| `config` | Add M365 Agents Toolkit configuration files to your existing Teams AI v2 agent project. |
| `environment` | Manage multiple environments (e.g. dev, prod) and their keys for your agent. |

> [!TIP]
> With the CLI installed, you can enter `teams <token-arguments> --help` at any command level to access information about the command, tokens, or required arguments.

## Installation

Install the Teams CLI globally using npm:

<!-- langtabs-start -->
```sh
npm install -g @microsoft/teams.cli@preview
```
<!-- langtabs-end -->

> [!TIP]
> If you prefer not to install globally, all commands below can replace `teams` with npx:
> > ```npx @microsoft/teams.cli@preview <arguments>```

## Create an agent with one command line

<!-- langtabs-start -->
```sh
teams new <app-name> <optional>
```
<!-- langtabs-end -->

The `new` token will create a brand new agent with `app-name` applied as the directory name and project name.

> [!NOTE]
> The name you choose may have case changes when applied; for example, "My App" would become "my-app' due to the requirements for `package.json` files.

### Optional parameters

> [!TIP]
> Use command line `teams new --help` to see the latest options for all optional params.

| Parameter | Description |
|-----------|-------------|
| `--template` | Ready-to-run templates that serve as a starting point depending on your scenario. Template examples include `ai`, `echo`, `graph`, and more. |
| `--start` | Run the agent immediately upon finishing the creation of the project. |
| `--toolkit` or `--ttk` | Include the configuration files required to run the agent in the debugger via the [M365 Agents Toolkit](https://github.com/OfficeDev/teams-toolkit) extension. Options include `basic`, `embed`, and `oauth`, and more may be added in the future. |
| `--client-id` | The app client id, if you already have deployed a resource. This will be added to the root `.env` file of the project. |
| `--client-secret` | The app client secret, if you already have deployed a resource. This will be added to the root `.env` file of the project. |

## Add M365 Toolkit configuration to existing agent

An existing project may also have the appropriate M365 Agents Toolkit configuration files added by configuration name.

<!-- langtabs-start -->
```bash
teams config add <config-name>
```
<!-- langtabs-end -->

| Configuration | Description |
|--------------|-------------|
| `ttk.basic` | Basic M365 Agents Toolkit configuration |
| `ttk.embed` | Configuration for embedded Teams applications |
| `ttk.oauth` | Configuration for OAuth-enabled applications |

Using this command will include
- `env`: folders for managing multiple environments
- `infra`: files for deployment and provisioning
- `.yml` files for tasks, launch, deployment, etc.

## Remove M365 Agents Toolkit configuration files

<!-- langtabs-start -->
```bash
teams config remove <config-name>
```
<!-- langtabs-end -->
