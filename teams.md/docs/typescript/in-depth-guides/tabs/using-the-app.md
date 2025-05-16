---
sidebar_position: 2
---

# Using The App

The `@microsoft/teams.client` App class helps solve common challenges when building Single Page Applications hosted in Microsoft Teams, Outlook, and Microsoft 365. It is the client-side counterpart to the `@microsoft/teams.app` App that you can use to build AI agents.

These two App classes are designed to work well together. For instance, when you use the `@microsoft/teams.app` App to expose a server-side function, you can then use the `@microsoft/teams.client` App `exec` method to easily invoke that function, as the client-side app knows how to construct an HTTP request that the server-side app can process. It can issue a request to the right URL, with the expected payload and contextual headers. The client-side app even includes a bearer token that the server side app uses to authenticate the caller.

# Starting the app

To use the `@microsoft/teams.client` package, you first create an App instance and then call `app.start()`. 

```typescript
import { App } from '@microsoft/teams.client';

const app = new App(clientId);
await app.start();
```


The app constructor strives to make it easy to get started on a new app, while still being flexible enough that it can integrate easily with existing apps.

The constructor takes two arguments: a required app client ID, and an optional `AppOptions` argument. The app client ID is the AAD app registration **Application (client) ID**. The options can be used to customize observability, Microsoft Authentication Library (MSAL) configuration, and 
remote agent function calling.

For more details on the app options, see the [App options](./app-options.md) page.

## What happens during start
The app constructor does the following:
 - it creates an app logger, if none is provided in the app options. 
 - it creates an http client used to call the remote agent.
 - it creates a graph client that can be used as soon as the app is started.

The `app.start()` call does the following:
- it initializes TeamsJS.
- it creates an MSAL instance, if none is provided in the app options.
- it connects the MSAL instance to the graph client.
- it prompts the user for MSAL token consent, if needed and if pre-warming is not disabled through the app options.

## Using the app
When the `app.start()` call has completed, you can use the app instance to call Graph APIs and to call remote agent functions using the `exec()` function, or directly by using the `app.http` HTTP client. TeamsJS is now initialized, so you can interact with the hosting app. The `app.msalInstance` is now populated, in case you need to use the same MSAL for other purposes.


```typescript
import * as teamsJs from '@microsoft/teams-js';
import { App } from '@microsoft/teams.client';

const app = new App(clientId);
await app.start();

// you can now get the TeamsJS context...
const context = await teamsJs.app.getContext();

// ...call Graph end points...
const presenceResult = await app.graph.me.presence.get();

// ...end call remote agent functions...
const agentResult = await app.exec<string>('hello-world');
```
