using QuestBot;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using QuestBot.State;
using QuestBot.Store;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
ConfigOptions config = builder.Configuration.Get<ConfigOptions>()!;
builder.Configuration["MicrosoftAppType"] = "MultiTenant";
builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

// Create the Bot Framework Authentication to be used with the Bot Adapter.
builder.Services.AddSingleton<BotFrameworkAuthentication, ConfigurationBotFrameworkAuthentication>();

// Create the Cloud Adapter with error handling enabled.
// Note: some classes expect a BotAdapter and some expect a BotFrameworkHttpAdapter, so
// register the same adapter instance for all types.
builder.Services.AddSingleton<CloudAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<CloudAdapter>()!);
builder.Services.AddSingleton<BotAdapter>(sp => sp.GetService<CloudAdapter>()!);

// Create singleton instances for bot application
builder.Services.AddSingleton<IStorage, LastWriterWinsMemoryStore>();

#region Use Azure OpenAI
// Following code is for using Azure OpenAI
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey)
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    throw new ArgumentException("Missing Azure configuration.");
}
builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new(config.Azure.OpenAIApiKey, "gpt-35-turbo", config.Azure.OpenAIEndpoint));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create AzureOpenAIPlanner
    IPlanner<QuestState> planner = new AzureOpenAIPlanner<QuestState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory);

    // Create Application
    AIOptions<QuestState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<QuestState>("./Prompts"),
        prompt: "Intro",
        history: new AIHistoryOptions
        {
            UserPrefix = "Player:",
            AssistantPrefix = "DM:",
            MaxTurns = 3,
            MaxTokens = 600,
            TrackHistory = true
        });
    ApplicationOptions<QuestState, QuestStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new QuestStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
    };
    TeamsQuestBot app = new(ApplicationOptions);
    TeamsQuestBotHandlers handlers = new(app);

    // register turn and activity handlers
    app.OnBeforeTurn(handlers.OnBeforeTurnAsync);
    app.OnAfterTurn(handlers.OnAfterTurnAsync);
    app.OnActivity(ActivityTypes.Message, handlers.OnMessageActivityAsync);

    return app;
});
#endregion

#region Use OpenAI
/** // Use OpenAI
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new ArgumentException("Missing OpenAI configuration.");
}
builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OpenAI.ApiKey, "gpt-3.5-turbo"));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create OpenAIPlanner
    IPlanner<QuestState> planner = new OpenAIPlanner<QuestState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory);

    // Create Application
    AIOptions<QuestState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<QuestState>("./Prompts"),
        prompt: "Intro",
        history: new AIHistoryOptions
        {
            UserPrefix = "Player:",
            AssistantPrefix = "DM:",
            MaxTurns = 3,
            MaxTokens = 600,
            TrackHistory = true
        });
    ApplicationOptions<QuestState, QuestStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new QuestStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
    };
    TeamsQuestBot app = new(ApplicationOptions);
    TeamsQuestBotHandlers handlers = new(app);

    // register turn and activity handlers
    app.OnBeforeTurn(handlers.OnBeforeTurnAsync);
    app.OnAfterTurn(handlers.OnAfterTurnAsync);
    app.OnActivity(ActivityTypes.Message, handlers.OnMessageActivityAsync);

    return app;
});
**/
#endregion

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.Run();
