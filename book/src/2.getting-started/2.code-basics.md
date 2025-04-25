# Code basics

After creating your first Teams application, let's understand its structure and key components. This will help you build more complex applications as you progress.

## Project Structure

When you create a new Teams application, it generates a directory with this basic structure:

```
quote-agent/
|── appPackage/       # Teams app package files
├── src/
│   └── index.ts      # Main application code
```

- **appPackage/**: Contains the Teams app package files, including the `manifest.json` file and icons. This is required for [sideloading](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload) the app into Teams for testing. The app manifest defines the app's metadata, capabilities, and permissions.
- **src/**: Contains the main application code. The `index.ts` file is the entry point for your application.

## Core Components

Let's break down the simple application we created in the [quickstart](1.quickstart.md) into its core components.:

### The App Class

The heart of your application is the `App` class. This class handles all incoming activities and manages your application's lifecycle. It also acts as a way to host your application service.

```typescript
import { App } from '@microsoft/teams.apps';
import { ConsoleLogger } from '@microsoft/teams.common/logging';
import { DevtoolsPlugin } from '@microsoft/teams.dev';

const app = new App({
  plugins: [new DevtoolsPlugin()],
});
```

The app configuration includes a variety of options that allow you to customize its behavior, including controlling the underlying server, authentication, and other settings. For simplicity's sake, let's focus on plugins.

### Plugins

Plugins are a core part of the Teams AI v2 SDK. They allow you to hook into various lifecycles of the application. The lifecycles include server events (start, stop, initialize etc.), and also Teams Activity events (onActivity, onActivitySent, etc.). In fact, the [DevTools](../7.developer-tools/2.devtools) application you already have running is a plugin too. It allows you to inspect and debug your application in real-time.

> [!CAUTION]
> DevTools is a plugin that should only be used in development mode. It should not be used in production applications since it offers no authentication and allows your application to be accessed by anyone.\
> **Be sure to remove the DevTools plugin from your production code.**

### Message Handling

Teams applications respond to various types of activities. The most basic is handling messages:

```typescript
app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  await send(`you said "${activity.text}"`);
});
```

This code:

1. Listens for all incoming messages using `app.on('message')`.
2. Sends a typing indicator, which renders as an animated ellipsis (…) in the chat.
3. Responds by echoing back the received message.

> [!NOTE]
> Type safety is a core tenet of this version of the SDK. You can change the activity `name` to a different supported value, and the type system will automatically adjust the type of activity to match the new value.

### Application Lifecycle

Your application starts when you run:

```typescript
(async () => {
  await app.start();
})();
```

This part initializes your application server and, when configured for Teams, also authenticates it to be ready for sending and receiving messages.

## Next Steps

Now that you understand the basic structure of your Teams application, you're ready to [run it in Teams](3.running-in-teams.md). You will learn about Teams Toolkit and other important tools that help you with deployment and testing your application.

After that, you can:

- Add more activity handlers for different types of interactions. See [Listening to Activities](../3.essentials/1.on-activity.md) and [Listening to Messages](../3.essentials/2.on-message.md) for more details.
- Integrate with external services using the [API Client](../3.essentials/6.api.md).
- Add interactive [cards](../5.in-depth-guides/1.cards/README.md) and [dialogs](../5.in-depth-guides/2.dialogs/README.md). See and for more information.
- Implement [AI](../5.in-depth-guides/5.ai/README.md).

Continue on to the next page to learn about these advanced features.

## Other Resources

- [Essentials](../3.essentials)
- [Teams developer tools](../7.developer-tools)
