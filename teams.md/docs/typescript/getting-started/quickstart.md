---
sidebar_position: 1
---

# Quickstart

Get started with Teams AI Library (v2) quickly using the Teams CLI.

## Set up a new project

### Prerequisites

- **Node.js** v.20 or higher. Install or upgrade from [nodejs.org](https://nodejs.org/).

## Instructions

### Install the Teams CLI

Use your terminal to install the Teams CLI globally using npm:


```sh
npm install -g @microsoft/teams.cli@preview
```


:::info
_The [Teams CLI](/developer-tools/cli) is a command-line tool that helps you create and manage Teams applications. It provides a set of commands to simplify the development process._<br /><br />
After installation, you can run `teams --version` to verify the installation.
:::

## Creating Your First Agent

Let's create a simple echo agent that responds to messages. Run:


```sh
teams new typescript quote-agent --template echo
```


This command:

1. Creates a new directory called `quote-agent`.
2. Bootstraps the echo agent template files into it under `quote-agent/src`.
3. Creates your agent's manifest files, including a `manifest.json` file and placeholder icons in the `quote-agent/appPackage` directory. The Teams [app manifest](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema) is required for [sideloading](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) the app into Teams.

> The `echo` template creates a basic agent that repeats back any message it receives - perfect for learning the fundamentals.

## Running your agent

Navigate to your new agent's directory:


```sh
cd quote-agent
```


Install the dependencies:


```sh
npm install
```


Start the development server:


```sh
npm run dev
```


In the console, you should see a similar output:


```sh
> quote-agent@0.0.0 dev
> npx nodemon -w "./src/**" -e ts --exec "node -r ts-node/register -r dotenv/config ./src/index.ts"

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**
[nodemon] watching extensions: ts
[nodemon] starting `node -r ts-node/register -r dotenv/config ./src/index.ts`
[WARN] @teams/app/devtools ⚠️  Devtools are not secure and should not be used production environments ⚠️
[INFO] @teams/app/http listening on port 3978 🚀
[INFO] @teams/app/devtools available at http://localhost:3979/devtools
```


When the application starts, you'll see:

1. An http server starting up (on port 3978). This is the main server which handles incoming requests and serves the agent application.
2. A devtools server starting up (on port 3979). This is a developer server that provides a web interface for debugging and testing your agent quickly, without having to deploy it to Teams.

Let's navigate to the devtools server. Open your browser and head to [http://localhost:3979/devtools](http://localhost:3979/devtools). You should see a simple interface where you can interact with your agent. Send it a message!

![devtools](/screenshots/devtools-echo-chat.png)

## Next steps

Now that you have your first agent running, learn about [the code basics](code-basics) to understand its components and structure.

Otherwise, if you want to run your agent in Teams, check out the [Running in Teams](running-in-teams) guide.

## Resources

- [Teams CLI documentation](/developer-tools/cli)
- [Teams DevTools documentation](/developer-tools/devtools)
- [Teams manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Teams sideloading](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload)
