# Teams AI Library

Welcome to the Teams AI Library .NET package! 

This SDK is specifically designed to assist you in creating bots capable of interacting with Teams and Microsoft 365 applications. It is constructed using the [Bot Framework SDK](https://github.com/microsoft/botbuilder-dotnet) as its foundation, simplifying the process of developing bots that interact with Teams' artificial intelligence capabilities. See the [Teams AI repo README.md](https://github.com/microsoft/teams-ai), for general information, and JavaScript support is available via the [js](https://github.com/microsoft/teams-ai/tree/main/js) folder.

Requirements:

*   [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
*   [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) resource or an account with [OpenAI](https://platform.openai.com/)

## Getting Started: Migration vs New Project

If you're migrating an existing project, switching to add on the Teams AI Library layer is quick and simple. For a more-detailed walkthrough, see the [migration guide](https://github.com/microsoft/teams-ai/blob/main/getting-started/dotnet/00.MIGRATION.md). The basics are listed below.

### Migration
### *IMPORTANT Migration code & steps below needs to be updated for C#

In your existing Teams bot, you'll need to add the Teams AI Library SDK package and import it into your bot code.

```bash
dotnet add package Microsoft.TeamsAI
```

Replace `BotActivityHandler` and `ApplicationTurnState` in your bot. Note that here, `TurnState` is constructed to include `ConversationState`, but can also have `UserState` and `TempState`.

`State.cs`:

```c#
namespace Application {
    public class ApplicationTurnState : TurnState
    {
        public ApplicationTurnState()
        {
            ScopeDefaults[CONVERSATION_SCOPE] = new ConversationState();
        }

        public new ConversationState Conversation
        {
            get
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (ConversationState)scope.Value!;
            }
            set
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }
    }

    public class ConversationState : Record
    {
        public int Count
        {
            get => Get<int>("count");
            set => Set("count", value);
        }
    }
}
```

`Program.cs`

```c#
using Application;

...

Application<ApplicationTurnState> app = new(new())
{
    Storage = new MemoryStorage()
};
```

The rest of the code stays the same.

That's it!

Run your bot (with ngrok) and sideload your manifest to test.

For migrating specific features such as Message Extension and Adaptive Card capabilities, please see the [Migration Guide](https://github.com/microsoft/teams-ai/blob/main/getting-started/dotnet/00.MIGRATION.md).

### New Project

If you are starting a new project, you can use the [Teams AI Library SDK echobot sample](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples/01.messaging.echoBot) as a starting point. You don't need to make any changes to the sample to get it running, but you can use it as your base setup. Echo Bot supports the Teams AI Library SDK out of the box.

You can either copy-paste the code into your own project, or clone the repo and run the Teams Toolkit features to explore.

### Optional ApplicationBuilder Class

You may also use the `ApplicationBuilder` class to instantiate your `Application` instance. This option provides greater readability and separates the management of the various configuration options (e.g., storage, turn state, AI module options, etc).

`Program.cs`:

```c#
// Old method:
// Application<ApplicationTurnState> app = new()
//    {
//        storage
//    };

var app = new ApplicationBuilder<ApplicationTurnState>()
    .WithStorage(storage)
    .Build(); // this function internally calls the Application constructor
```

## AI Setup

The detailed steps for setting up your bot to use AI are in the [AI Setup Guide](https://github.com/microsoft/teams-ai/blob/main/getting-started/dotnet/01.AI-SETUP.md).

On top of your Microsoft App Id and password, you will need an OpenAI API key or an Azure OpenAI key and endpoint. You can get one from the [OpenAI platform](https://platform.openai.com/) or from [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service). Once you have your key, add it to `appsettings.Development.json` or `appsettings.json`.

### AI Prompt Manager
### *IMPORTANT AI Prompt Manager code needs to be updated to C#

```c#
PromptManager prompts = new(new()
{
    PromptFolder = "./Prompts"
});

ActionPlanner<ApplicationTurnState> planner = new(
    options: new(
        model: sp.GetService<OpenAIModel>()!,
        prompts: prompts,
        defaultPrompt: async (context, state, planner) =>
        {
            PromptTemplate template = prompts.GetPrompt("default");
            return await Task.FromResult(template);
        }
    )
    { LogRepairs = true }
);

// Define storage and application
// - Note that we're not passing a prompt for our AI options as we won't be chatting with the app.
MemoryStorage storage = new();
Application<ApplicationTurnState> app = new()
{
    Storage = storage,
    AI: new(planner)
};
```

For more information on how to create and use prompts, see [PROMPTS](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/teams%20conversational%20ai/how-conversation-ai-get-started?tabs=javascript4%2Cjavascript1%2Cjavascript3%2Cjavascript2#:~:text=VectraDataSource%20and%20OpenAIEmbeddings%3A-,Prompt,-Prompts%20are%20pieces) and look at the [samples](https://github.com/microsoft/teams-ai/tree/main/dotnet/samples) numbered `04._.xxx`.

Happy coding!


