# Teams AI (JS) SDK JS

Welcome to the Teams AI SDK js package. See the [Teams AI repo README.md](https://github.com/microsoft/teams-ai), for general information, including updates on dotnet support.

Requirements:

-   node v16.x

## Getting Started: Migration v.s. New Project

If you're migrating an existing project, switching to add on the Teams AI layer is quick and simple. For a more-detailed walkthrough, see the [migration guide](getting-started/00.MIGRATION.md). The basics are listed below.

### Migration

In your existing Teams bot, you'll need to add the Teams AI SDK package and import it into your bot code.

```bash
yarn add @microsoft/teams-ai
#or
npm install @microsoft/teams-ai
```

Replace `BotActivityHandler` and `ApplicationTurnState` with this `Application` and `DefaultTurnState` in your bot. Note that here, `DefaultTurnState` is constructed to include `ConversationState`, but can also have `UserState` and `TempState`.

![Line 72 shows use of 'Application' class](https://user-images.githubusercontent.com/14900841/225122653-6338b82f-2236-4897-8c6d-807fd293a6ca.png)

js `index.ts`:

```js
// Old code:
// const bot = BotActivityHandler();

interface ConversationState {
    count: number;
}
type ApplicationTurnState = DefaultTurnState<ConversationState>;

const app =
    new Application() <
    ApplicationTurnState >
    {
        storage // in this case, MemoryStorage
    };
```

The rest of the code, including `server.post` and `await app.run(context)` stays the same.

That's it!

Run your bot (with ngrok) and sideload your manifest to test.

For migrating specific features such as Message Extension and Adaptive Card capabilities, please see the [Migration Guide](../../getting-started/00.MIGRATION.md).

### New Project

If you are starting a new project, you can use the [Teams AI SDK echobot sample](../samples/01.messaging.a.echoBot/) as a starting point. You don't need to make any changes to the sample to get it running, but you can use it as your base setup. Echo Bot supports the Teams AI SDK out of the box.

You can either copy-paste the code into your own project, or clone the repo and run the Teams Toolkit features to explore.

### Optional ApplicationBuilder Class 

You may also use the `ApplicationBuilder` class to instantiate your `Application` instance. This option provides greater readability and separates the management of the various configuration options (e.g., storage, turn state, AI module options, etc).

js `index.ts`:

```js
// Old method:
// const app = new Application()<ApplicationTurnState>
//    {
//        storage
//    };

const app = new ApplicationBuilder()<ApplicationTurnState>
    .withStorage(storage)
    .build(); // this function internally calls the Application constructor
```

## AI Setup

The detailed steps for setting up your bot to use AI are in the [GPT Setup Guide](getting-started/01.AI-SETUP.md).

On top of your Microsoft App Id and password, you will need an OpenAI API key. You can get one from the [OpenAI platform](https://platform.openai.com/). Once you have your key, add it to your `.env` file as `OPEN_AI_KEY`

### AI Prompt Manager

```ts
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));

// Define storage and application
// - Note that we're not passing a prompt for our AI options as we won't be chatting with the app.
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    adapter,
    botAppId: process.env.MicrosoftAppId,
    ai: {
        planner,
        promptManager
    }
});
```

For more information on how to create and use prompts, see [APIREFERENCE](./02.API-REFERENCE.md) and look at the [samples](../samples/) numbered `04._.xxx`).

Happy coding!
