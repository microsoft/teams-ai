# Welcome to the Teams AI Library v2

> \[!CAUTION]
> **PREVIEW VERSION** This is a preview version of the Teams AI Library v2. While we will do our best to avoid breaking changes, some breaking changes should be expected until the first major version.

## Overview

Teams AI Library v2 represents a fundamental reimagining of how Teams apps and AI agents are built, while maintaining compatibility with existing botframework-based agents. This new version focuses on developer experience, simplified architecture, and enhanced AI capabilities.

For a detailed explanation of the motivations and architectural decisions behind v2, please see our [WHY.md](./WHY.md) document.

### Quick start

The Teams CLI makes it easy to bootstrap your first agent. First, install the CLI via NPM:

```sh
npm install -g @microsoft/teams.cli@latest
```

Next, use the CLI to create your agent:

```sh
teams new quote-agent --template echo
```

For more information, follow our [quick start guide](book/src/2.getting-started/1.quickstart.md).

### SDK

Microsoft Teams has a robust developer ecosystem with a broad suite of capabilities, now unified via Teams AI v2. Whether you are building [AI-powered agents](book/src/5.in-depth-guides/5.ai/README.md), [message extensions](book/src/5.in-depth-guides/3.message-extensions/README.md), embedded web applications, or Graph, Teams AI v2 has you covered.

Here is a simple example, which responds to incoming messages with information retrieved from Graph.

```typescript
import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';

const app = new App({
  plugins: [new DevtoolsPlugin()],
});

// Listen for incoming messages
app.on('message', async ({ api, isSignedIn, send, signin }) => {
  if (!isSignedIn) {
    await signin(); // initiates Entra login flow
    return;
  }
  const me = await api.user.me.get();
  await send(`Hello, ${me.displayName} from Earth!`);
});

// Start your application
(async () => {
  await app.start();
})();
```

## SDK Language Support

This repository contains submodules that point to dedicated repositories for different language implementations of the SDK:

- [TypeScript/JavaScript](https://github.com/microsoft/teams.ts)
- [.NET](https://microsoft.github.io/teams.net/) (early stage)
- Python (coming soon)

For language-specific bugs or issues, please use the Issues tab in the respective language repository.

## Documentation

For comprehensive documentation, API references, and examples, visit our [documentation site](https://microsoft.github.io/teams-ai/).
