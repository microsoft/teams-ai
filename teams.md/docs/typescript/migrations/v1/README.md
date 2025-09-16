---
sidebar_position: 2
summary: Migration guide from Teams AI v1 to v2 highlighting the key changes and upgrade steps.
---

# Migrating from Teams AI v1

Welcome, fellow agent developer! You've made it through a full major release of Teams AI, and now you want to take the plunge into v2. In this guide, we'll walk you through everything you need to know, from migrating core features like message handlers and auth, to optional AI features like `ActionPlanner`. We'll also discuss how you can migrate features over incrementally via the [botbuilder adapter](../BotBuilder/README.md).

## Installing Teams AI v2

First, let's install Teams AI v2 into your project. Notably, this won't replace any existing installation of Teams AI v1. When you've completed your migration, you can safely remove the `@microsoft/teams-ai` dependency from your `package.json` file.

```sh
npm install @microsoft/teams.apps
```

## Migrate Application class

First, migrate your `Application` class from v1 to the new `App` class.

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
import {
  ConfigurationServiceClientCredentialFactory,
  MemoryStorage,
  TurnContext,
} from 'botbuilder';
import { Application, TeamsAdapter } from '@microsoft/teams-ai';
import * as restify from 'restify';

// Create adapter.
const adapter = new TeamsAdapter(
    {},
    new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.ENTRA_APP_CLIENT_ID,
        MicrosoftAppPassword: process.env.ENTRA_APP_CLIENT_SECRET,
        MicrosoftAppType: 'SingleTenant',
        MicrosoftAppTenantId: process.env.ENTRA_APP_TENANT_ID
    })
);

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: any) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
});

// Define storage and application
const app = new Application<ApplicationTurnState>({
    storage: new MemoryStorage()
});

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});
```

</td>
<td>

```ts
import { App } from '@microsoft/teams.apps';
import { LocalStorage } from '@microsoft/teams.common/storage';

// Define app
const app = new App({
  clientId: process.env.ENTRA_APP_CLIENT_ID!,
  clientSecret: process.env.ENTRA_APP_CLIENT_SECRET!,
  tenantId: process.env.ENTRA_TENANT_ID!,
});

// Optionally create local storage
const storage = new LocalStorage();

// Listen for errors
app.event('error', async (client) => {
  console.error('Error event received:', client.error);
  if (client.activity) {
    await app.send(
      client.activity.conversation.id,
      'An error occurred while processing your message.',
    );
  }
});

// App creates local server with route for /api/messages
// To reuse your restify or other server,
// create a custom `HttpPlugin`.
(async () => {
  // starts the server
  await app.start();
})();
```

</td>
</tr>
</table>

## Migrate activity handlers

Both Teams AI v1 and v2 are built atop incoming `Activity` requests, which trigger handlers in your code when specific type of activities are received. The syntax for how you register different types of `Activity` handlers differs between the v1 and v2 versions of our SDK.

### Message handlers

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
// triggers when user sends "/hi" or "@bot /hi"
app.message("/hi", async (context) => {
  await context.sendActivity("Hi!");
});
// listen for ANY message to be received
app.activity(
  ActivityTypes.Message,
  async (context) => {
    // echo back users request
    await context.sendActivity(
      `you said: ${context.activity.text}`
    );
  }
);
```

</td>
<td>

```ts
// triggers when user sends "/hi" or "@bot /hi"
app.message('/hi', async (client) => {
  // SDK does not auto send typing indicators
  await client.send({ type: 'typing' });
  await client.send("Hi!");
});
// listen for ANY message to be received
app.on('message', async (client) => {
  await client.send({ type: 'typing' });
  await client.send(
    `you said "${client.activity.text}"`
  );
});
```

</td>
</tr>
</table>

### Task modules

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
app.taskModules.fetch("connect-account", async (context, state, data) => {
  const taskInfo: TaskModuleTaskInfo = {
    title: "Connect your Microsoft 365 account",
    height: "medium",
    width: "medium",
    url: `https://${process.env.NEXT_PUBLIC_BOT_DOMAIN}/connections`,
    fallbackUrl: `https://${process.env.NEXT_PUBLIC_BOT_DOMAIN}/connections`,
    completionBotId: process.env.NEXT_PUBLIC_BOT_ID,
  };
  return taskInfo;
});
app.taskModules.submit("connect-account", async (context, state, data) => {
  console.log(
    `bot-app.ts taskModules.submit("connect-account"): data`,
    JSON.stringify(data, null, 4)
  );
  await context.sendActivity("You are all set! Now, how can I help you today?");
  return undefined;
});
```

</td>
<td>

```ts
app.on("dialog.open", (client) => {
  const dialogType = client.activity.value.data?.opendialogtype;
  if (dialogType === "some-type") {
    return {
      task: {
        type: "continue",
        value: {
          title: "Dialog title",
          height: "medium",
          width: "medium",
          url: `https://${process.env.YOUR_WEBSITE_DOMAIN}/some-path`,
          fallbackUrl: `https://${process.env.YOUR_WEBSITE_DOMAIN}/fallback-path-for-web`,
          completionBotId: process.env.ENTRA_APP_CLIENT_ID!,
        },
      },
    };
  }
});

app.on("dialog.submit", async (client) => {
  const dialogType = client.activity.value.data?.submissiondialogtype;
  if (dialogType === "some-type") {
    const { data } = client.activity.value;
    await client.send(JSON.stringify(data));
  }
  return undefined;
});
```

</td>
</tr>
</table>

Learn more [here](../../in-depth-guides/dialogs/README.md).

## Adaptive cards

In Teams AI v2, cards have much more rich type validation than existed in v1. However, assuming your cards were valid, it should be easy to migrate to v2.

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2 (Option 1)</strong> </td> <td> <strong>Teams AI v2 (Option 2)</strong> </td>
</tr>
<tr>
<td>

```ts
app.message("/card", async (context: TurnContext) => {
    const card = CardFactory.adaptiveCard({
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        type: "AdaptiveCard",
        body: [
            {
                type: "TextBlock",
                text: "Hello, world!",
                wrap: true,
                isSubtle: false,
            }
        ],
        msteams: {
            width: "Full",
        },
    });
    await context.sendActivity({
        attachments: [card],
    });
});
```

</td>
<td>

For existing cards like this, the simplest way to convert that to Teams AI v2 is this:

```ts
app.message("/card", async (client) => {
  await client.send({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "Hello, world!",
        wrap: true,
        isSubtle: false,
      },
    ],
    msteams: {
      width: "Full",
    },
  });
});
```

</td>

<td>

For a more thorough port, you could also do the following:

```ts
import { Card, TextBlock } from "@microsoft/teams.cards";

app.message("/card", async (client) => {
  await client.send(
    new Card(
      new TextBlock(
        "Hello, world!",
        { wrap: true, isSubtle: false },
      )
    ).withOptions({ width: "Full" })
  );
});
```

</td>
</tr>
</table>

Learn more [here](../../in-depth-guides/adaptive-cards/README.md).

## Authentication

Most agents feature authentication for user identification, interacting with APIs, etc. Whether your Teams AI v1 app used Entra SSO or custom OAuth, porting to v2 should be simple.

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
const storage = new MemoryStorage();
const app = new Application({
    storage: new MemoryStorage(),
    authentication: {
        autoSignIn: (context) => {
            const activity = context.activity;
            // No auth when user wants to sign in
            if (activity.text === "/signout") {
                return Promise.resolve(false);
            }
            // No auth for "/help"
            if (activity.text === "/help") {
                return Promise.resolve(false);
            }
            // Manually sign in (for illustrative purposes)
            if (activity.text === "/signin") {
                return Promise.resolve(false);
            }
            // For all other messages, require sign in
            return Promise.resolve(true);
        },
        settings: {
            graph: {
                connectionName: process.env.OAUTH_CONNECTION_NAME!,
                title: "Sign in",
                text: "Please sign in to use the bot.",
                endOnInvalidMessage: true,
                tokenExchangeUri: process.env.TOKEN_EXCHANGE_URI!,
                enableSso: true,
            },
        },
    }
});

app.message(
    "/signout",
    async (context, state) => {
        await app.authentication.signOutUser(context, state);

        // Echo back users request
        await context.sendActivity(`You have signed out`);
    }
);

app.message(
    "/signin",
    async (context, state) => {
        let token = state.temp.authTokens['graph'];
        if (!token) {
            const res = await app.authentication.signInUser(context, state);
            if (res.error) {
                console.log(res.error);
                return;
            }
            token = state.temp.authTokens['graph'];
        }

        if (token) {
            // Echo back users request
            await context.sendActivity(`You are already authenticated!`);
            return;
        }

        // Sign in is pending...
    }
);

app.message(
    "/help",
    async (context, state) => {
        await context.sendActivity(`your help text`);
    }
);

app.authentication.get('graph')
    .onUserSignInSuccess(async (context, state) => {
        // Successfully logged in
        await context.sendActivity('Successfully logged in');
        await context.sendActivity(
          `Token string length: ${state.temp.authTokens['graph']!.length}`,
        );
    });

app.authentication
    .get('graph')
    .onUserSignInFailure(async (context, _state, error) => {
        // Failed to login
        await context.sendActivity(
          `Failed to login with error: ${error.message}`,
        );
    });
```

</td>
<td>

```ts
const app = new App({ 
  oauth: { // oauth configurations
    /**
     * The name of the auth connection to use.
     * It should be the same as the OAuth connection name defined in the Azure Bot configuration.
     */
    defaultConnectionName: 'graph' 
  },
  logger: new ConsoleLogger('@tests/auth', { level: 'debug' })
});

app.message('/signout', async (client) => {
  if (!client.isSignedIn) return;
  await client.signout(); // call signout for your auth connection...
  await client.send('you have been signed out!');
});

app.message('/help', async (client) => {
    await client.send("your help text")
});

app.on('message', async (client) => {
  if (!client.isSignedIn) {
    await client.signin({
      // Customize the OAuth card text (only renders in OAuth flow, not SSO)
      oauthCardText: 'Sign in to your account',
      signInButtonText: 'Sign in' 
    }); // call signin for your auth connection...
    return;
  }

  const me = await client.userGraph.me.get();
  log.info(`user "${me.displayName}" already signed in!`);
});

app.event('signin', async (client) => {
  const me = await client.userGraph.me.get();
  await client.send(`user "${me.displayName}" signed in.`);
  await client.send(`Token string length: ${client.token.token.length}`);
});
```

</td>
</tr>
</table>

## AI

### Action planner

When we created Teams AI v1, LLM's didn't natively support tool calling or orchestration. A lot has changed since then, which is why we decided to deprecate `ActionPlanner` from Teams AI v1, and replace it with something a bit more lightweight. Notably, Teams AI v1 had two similar concepts: functions and actions. In Teams AI v2, these are consolidated into functions.

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
// Create AI components
const model = new OpenAIModel({
    // OpenAI Support
    apiKey: process.env.OPENAI_KEY!,
    defaultModel: 'gpt-4o',

    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-4o',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2023-03-15-preview',

    // Request logging
    logRequests: true
});

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

// Define a prompt function for getting the current status of the lights
prompts.addFunction('getLightStatus', async (context, memory) => {
    return memory.getValue('conversation.lightsOn') ? 'on' : 'off';
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: 'tools'
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner
    }
});

// Register action handlers
app.ai.action('ToggleLights', async (context, state) => {
    state.conversation.lightsOn = !state.conversation.lightsOn;
    const lightStatusText = state.conversation.lightsOn ? "on" : "off";
    await context.sendActivity(`[lights ${lightStatusText}]`);
    return `the lights are now ${lightStatusText}$`;
});

interface PauseParameters {
    time: number;
}

app.ai.action('Pause',
  async (context, state, parameters: PauseParameters) => {
    await context.sendActivity(
      `[pausing for ${parameters.time / 1000} seconds]`,
    );
    await new Promise((resolve) => setTimeout(resolve, parameters.time));
    return `done pausing`;
  },
);

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});
```

And the corresponding `actions.json` file:

```json
[
    {
        "name": "ToggleLights",
        "description": "Turns on/off the lights"
    },
    {
        "name": "Pause",
        "description": "Delays for a period of time",
        "parameters": {
            "type": "object",
            "properties": {
                "time": {
                    "type": "number",
                    "description": "The amount of time to delay in milliseconds"
                }
            },
            "required": [
                "time"
            ]
        }
    }
]
```

</td>
<td>

In Teams AI v2, there is no `actions.json` file. Instead, function prompts, parameters, etc. are declared in your code.

```ts
import '@azure/openai/types';
import { ChatPrompt, Message } from '@microsoft/teams.ai';
import { MessageActivity } from '@microsoft/teams.api';
import { App } from '@microsoft/teams.apps';
import { LocalStorage } from '@microsoft/teams.common/storage';
import { OpenAIChatModel } from '@microsoft/teams.openai';

interface IStorageState {
  status: boolean;
  messages: Message[];
}

const storage = new LocalStorage<IStorageState>();

const app = new App();

app.on('message', async (client) => {
  let state = storage.get(client.activity.from.id);

  if (!state) {
    state = {
      status: false,
      messages: [],
    };

    storage.set(client.activity.from.id, state);
  }

  const prompt = new ChatPrompt({
    messages: state.messages,
    instructions: `The following is a conversation with an AI assistant.
  The assistant can turn a light on or off.
  The lights are currently off.`,
    model: new OpenAIChatModel({
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    }),
  })
    .function('get_light_status', 'get the current light status', () => {
      return state.status;
    })
    .function('toggle_lights', 'toggles the lights on/off', () => {
      state.status = !state.status;
      storage.set(client.activity.from.id, state);
    })
    .function(
      'pause',
      'delays for a period of time',
      {
      type: 'object',
      properties: {
          time: {
            type: 'number',
            description: 'the amount of time to delay in milliseconds',
          },
        },
        required: ['time'],
      },
      async ({ time }: { time: number }) => {
        await new Promise((resolve) => setTimeout(resolve, time));
      }
    );

  await prompt.send(client.activity.text, {
    onChunk: (chunk) => {
      client.stream.emit(new MessageActivity(chunk));
    },
  });
});

(async () => {
  await app.start();
})();
```

</td>
</tr>
</table>

### Feedback

If you supported feedback for AI generated messages, migrating is simple.

<table>
<tr>
<td> <strong>Teams AI v1</strong> </td> <td> <strong>Teams AI v2</strong> </td>
</tr>
<tr>
<td>

```ts
export const app = new Application({
  ai: {
    // opts into feedback loop
    enable_feedback_loop: true
  },
});

// Reply with message including feedback buttons
app.activity(ActivityTypes.Message, async (context) => {
  await context.sendActivity({
    type: ActivityTypes.Message,
    text: `Hey, give me feedback!`,
    channelData: {
      feedbackLoop: {
          type: "custom"
      },
    },
  });
});

// Handle feedback submit
app.feedbackLoop(async (context, state, feedbackLoopData) => {
  // custom logic here...
});
```

</td>
<td>

```ts
import { MessageActivity } from "@microsoft/teams.api";

// Reply with message including feedback buttons
app.on('message', async (client) => {
  await client.send(
    new MessageActivity("Hey, give me feedback!")
        .addAiGenerated() // AI generated label
        .addFeedback() // Feedback buttons
  );
});

// Listen for feedback submissions
app.on('message.submit.feedback', async ({ activity, log }) => {
  // custom logic here...
});
```

*Note:* In Teams AI v2, you do not need to opt into feedback at the `App` level.

</td>
</tr>
</table>

You can learn more about feedback in Teams AI v2 [here](../../in-depth-guides/feedback.mdx).

## Incrementally migrating code via botbuilder plugin

:::info
Comparison code coming soon!
:::

If you aren't ready to migrate all of your code, you can run your existing Teams AI v1 code in parallel with Teams AI v2. Learn more [here](../BotBuilder/adapters.mdx).
