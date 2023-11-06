using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using TwentyQuestions;

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

#region Use Azure OpenAI and Azure Content Safety
// Following code is for using Azure OpenAI and Azure Content Safety
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey)
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint)
    || string.IsNullOrEmpty(config.Azure.ContentSafetyApiKey)
    || string.IsNullOrEmpty(config.Azure.ContentSafetyEndpoint))
{
    throw new Exception("Missing Azure configuration.");
}
builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new(config.Azure.OpenAIApiKey, "text-davinci-003", config.Azure.OpenAIEndpoint));
builder.Services.AddSingleton<AzureContentSafetyModeratorOptions>(_ => new(config.Azure.ContentSafetyApiKey, config.Azure.ContentSafetyEndpoint, ModerationType.Both));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create AzureOpenAIPlanner
    IPlanner<GameState> planner = new AzureOpenAIPlanner<GameState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory);

    // Create AzureContentSafetyModerator
    IModerator<GameState> moderator = new AzureContentSafetyModerator<GameState>(sp.GetService<AzureContentSafetyModeratorOptions>()!);

    // Create Application
    AIHistoryOptions aiHistoryOptions = new()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };
    AIOptions<GameState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<GameState>("./Prompts"),
        moderator: moderator,
        prompt: "Chat",
        history: aiHistoryOptions);
    ApplicationOptions<GameState, GameStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new GameStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
        LoggerFactory = loggerFactory,
    };
    return new GameBot(ApplicationOptions);
});
#endregion

#region Use OpenAI
/** // Use OpenAI
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new Exception("Missing OpenAI configuration.");
}
builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OpenAI.ApiKey, "text-davinci-003"));
builder.Services.AddSingleton<OpenAIModeratorOptions>(_ => new(config.OpenAI.ApiKey, ModerationType.Both));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Get HttpClient
    HttpClient moderatorHttpClient = sp.GetService<IHttpClientFactory>()!.CreateClient("WebClient");

    // Create OpenAIPlanner
    IPlanner<GameState> planner = new OpenAIPlanner<GameState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory);

    // Create OpenAIModerator
    IModerator<GameState> moderator = new OpenAIModerator<GameState>(
        sp.GetService<OpenAIModeratorOptions>()!,
        loggerFactory,
        moderatorHttpClient);

    // Create Application
    AIHistoryOptions aiHistoryOptions = new()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };
    AIOptions<GameState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<GameState>("./Prompts"),
        moderator: moderator,
        prompt: "Chat",
        history: aiHistoryOptions);
    ApplicationOptions<GameState, GameStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new GameStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
        LoggerFactory = loggerFactory,
    };
    return new GameBot(ApplicationOptions);
});
**/
#endregion

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.Run();
