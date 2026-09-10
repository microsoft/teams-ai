<!-- setup-example -->

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

<!-- oauth-note -->

Registering an OAuth flow with `AddOAuthFlow()` automatically enables state so pending sign-ins can be associated with the correct flow.

<!-- read-write-example -->


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

<!-- clear-example -->

```csharp
await context.State.DeleteAsync(cancellationToken);
```

<!-- distributed-example -->

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
