<!-- overview -->

The Teams SDK provides built-in `ConversationState` and `UserState` for storing per-conversation and per-user data across turns. State is backed by `IDistributedCache` — in-memory by default for local development, and swappable for any distributed cache provider (Redis, SQL, Azure Cache for Redis) for production without changing your handler code.

<!-- setup -->

Call `UseState()` inside `AddTeamsBotApplication()`:

```csharp title="Program.cs"
using Microsoft.Teams.Apps;

WebApplicationBuilder builder = WebApplication.CreateSlimBuilder(args);
builder.Services.AddTeamsBotApplication(options =>
{
    options.UseState();
});

WebApplication app = builder.Build();
TeamsBotApplication teams = app.UseTeamsBotApplication();
```

<!-- read-write -->

Use `context.State.ConversationState` and `context.State.UserState` in any handler:

```csharp
teams.OnMessage(async (context, cancellationToken) =>
{
    // Write
    context.State.ConversationState.Set("lastMessage", context.Activity.Text ?? string.Empty);
    context.State.UserState.Set("messageCount",
        (context.State.UserState.Get<int>("messageCount")) + 1);

    // Read
    string? last = context.State.ConversationState.Get<string>("lastMessage");
    int count = context.State.UserState.Get<int>("messageCount");

    await context.SendAsync(
        $"Message #{count}. Last message was: {last}",
        cancellationToken);
});
```

Use `ContainsKey()`, `Remove()`, and `Clear()` to inspect or remove values. If you mutate an object or collection returned by `Get<T>(string)`, call `Set()` with the updated value so the scope is marked for persistence.

<!-- clearing -->

Remove a value with `Remove()` or clear a scope with `Clear()`. To remove both scopes from the backing store:

```csharp
await context.State.DeleteAsync(cancellationToken);
```

Values written after `DeleteAsync()` are saved normally at the end of the current turn.

<!-- distributed-state -->

For production or multi-instance deployments, register a distributed cache provider before calling `UseState()`. Your handler code stays exactly the same:

```csharp title="Program.cs"
using Microsoft.Teams.Apps;
using StackExchange.Redis;

WebApplicationBuilder builder = WebApplication.CreateSlimBuilder(args);

// Register Redis — UseState() picks this up automatically
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});

builder.Services.AddTeamsBotApplication(options =>
{
    options.UseState();
});
```

Any `IDistributedCache` implementation works — Redis, SQL Server (`AddDistributedSqlServerCache`), or Azure Cache for Redis.
