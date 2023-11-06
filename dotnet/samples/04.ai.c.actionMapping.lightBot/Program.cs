using LightBot;
using LightBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();
builder.Logging.AddConsole();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
var config = builder.Configuration.Get<ConfigOptions>()!;
builder.Configuration["MicrosoftAppType"] = "MultiTenant";
builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

// Create the Bot Framework Authentication to be used with the Bot Adapter.
builder.Services.AddSingleton<BotFrameworkAuthentication, ConfigurationBotFrameworkAuthentication>();

// Create the Cloud Adapter with error handling enabled.
builder.Services.AddSingleton<CloudAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<CloudAdapter>()!);

// Create singleton instances for bot application
builder.Services.AddSingleton<IStorage, MemoryStorage>();

#region Use Azure OpenAI
// Use Azure OpenAI service
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey)
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    throw new Exception("Missing Azure OpenAI configuration.");
}

builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new(config.Azure.OpenAIApiKey, "gpt-35-turbo", config.Azure.OpenAIEndpoint) { LogRequests = true });

// Create the bot as transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create AzureOpenAIPlanner
    IPlanner<AppState> planner = new AzureOpenAIPlanner<AppState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory);

    // Create Application
    AIHistoryOptions aiHistoryOptions = new()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };

    AIOptions<AppState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<AppState>("./Prompts"),
        prompt: "chatGPT",
        history: aiHistoryOptions);

    ApplicationOptions<AppState, AppStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new AppStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
        LoggerFactory = loggerFactory,
    };

    return new TeamsLightBot(ApplicationOptions);
});
#endregion

#region Use OpenAI
/** // Use OpenAI service
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new Exception("Missing OpenAI configuration.");
}

builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OpenAI.ApiKey, "gpt-3.5-turbo") { LogRequests = true });

// Create the bot as transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create OpenAIPlanner
    IPlanner<AppState> planner = new OpenAIPlanner<AppState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory);

    // Create Application
    AIHistoryOptions aiHistoryOptions = new()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };

    AIOptions<AppState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<AppState>("./Prompts"),
        prompt: "chatGPT",
        history: aiHistoryOptions);

    ApplicationOptions<AppState, AppStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new AppStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
        LoggerFactory = loggerFactory,
    };

    return new TeamsLightBot(ApplicationOptions);
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
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.Run();
