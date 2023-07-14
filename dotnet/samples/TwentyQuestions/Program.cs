using TwentyQuestions;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
var config = builder.Configuration.Get<ConfigOptions>()!;
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
builder.Services.AddSingleton<IStorage, MemoryStorage>();
builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OPENAI_API_KEY!, "text-davinci-003"));
builder.Services.AddSingleton<OpenAIModeratorOptions>(_ => new(config.OPENAI_API_KEY!, ModerationType.Both));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Get HttpClient
    HttpClient moderatorHttpClient = sp.GetService<IHttpClientFactory>()!.CreateClient("WebClient");

    // Create OpenAIPlanner
    IPlanner <GameTurnState> planner = new OpenAIPlanner<GameTurnState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<OpenAIPlanner<GameTurnState>>());
    
    // Create OpenAIModerator
    IModerator<GameTurnState> moderator = new OpenAIModerator<GameTurnState>(
        sp.GetService<OpenAIModeratorOptions>()!,
        loggerFactory.CreateLogger<OpenAIModerator<GameTurnState>>(),
        moderatorHttpClient);

    // Create Application
    AIHistoryOptions aiHistoryOptions = new()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };
    AIOptions<GameTurnState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<GameTurnState>("./Prompts"),
        moderator: moderator,
        prompt: "Chat",
        history: aiHistoryOptions);
    ApplicationOptions<GameTurnState, GameTurnStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new GameTurnStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
    };
    return new GameBot(ApplicationOptions);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.Run();
