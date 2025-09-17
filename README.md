# Welcome to the Teams AI Library v2

## Overview

Teams AI Library v2 represents a fundamental reimagining of how Teams apps and AI agents are built, while maintaining compatibility with existing botframework-based agents. This new version focuses on developer experience, simplified architecture, and enhanced AI capabilities.

### Quick start

The Teams CLI makes it easy to bootstrap your first agent. First, install the CLI via NPM:

```sh
npm install -g @microsoft/teams.cli@preview
```

Next, use the CLI to create your agent:

```sh
teams new <typescript | csharp | python> quote-agent --template echo
```

For more information, follow our quickstart guide: [C#](http://microsoft.github.io/teams-ai/csharp/getting-started/quickstart), [Typescript](http://microsoft.github.io/teams-ai/typescript/getting-started/quickstart), [Python](http://microsoft.github.io/teams-ai/python/getting-started/quickstart)

### SDK

Microsoft Teams has a robust developer ecosystem with a broad suite of capabilities, now unified via Teams AI v2. Whether you are building AI-powered agents ([TS]https://microsoft.github.io/teams-ai/typescript/in-depth-guides/ai/), [C#](https://microsoft.github.io/teams-ai/csharp/in-depth-guides/ai/), [Python](https://microsoft.github.io/teams-ai/python/in-depth-guides/ai/), Message Extensions ([TS](https://microsoft.github.io/teams-ai/typescript/in-depth-guides/message-extensions/), [C#][https://microsoft.github.io/teams-ai/csharp/in-depth-guides/message-extensions/]), [Python][https://microsoft.github.io/teams-ai/python/in-depth-guides/message-extensions/], embedded web applications, or Graph, Teams AI v2 has you covered.

Here is a simple example, which responds to incoming messages with information retrieved from Graph.

```typescript
import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import * as endpoints from '@microsoft/teams.graph-endpoints';

const app = new App({
  plugins: [new DevtoolsPlugin()],
});

// Listen for incoming messages
app.on('message', async ({ userGraph, isSignedIn, send, signin }) => {
  if (!isSignedIn) {
    await signin(); // initiates Entra login flow
    return;
  }
  const me = await userGraph.call(endpoints.me.get); 
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
- [.NET](https://github.com/microsoft/teams.net)
- [Python](https://github.com/microsoft/teams.py)

For language-specific bugs or issues, please use the Issues tab in the respective language repository.

## Important: v1 to v2 Transition Notice

**This repository has transitioned from v1 to v2 as the main branch.**

- **v1 code location:** Preserved on [`release/v1`](https://github.com/microsoft/teams-ai/tree/release/v1) branch



## Documentation

For comprehensive documentation, API references, and examples, visit our [documentation site](https://microsoft.github.io/teams-ai/).
