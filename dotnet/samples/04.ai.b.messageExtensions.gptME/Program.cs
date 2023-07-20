using GPT;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.State;

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

// This Message Extension can either drop the created card into the compose window (default.)
// Or use Teams botMessagePreview feature to post the activity directly to the feed onBehalf of the user.
// Set PREVIEW_MODE to true to enable this feature and update your manifest accordingly.
bool PREVIEW_MODE = false;

#region Use OpenAI
// Use OpenAI
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
    IPlanner<TurnState> planner = new OpenAIPlanner<TurnState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<OpenAIPlanner<TurnState>>());

    // Create OpenAIModerator
    IModerator<TurnState> moderator = new OpenAIModerator<TurnState>(
        sp.GetService<OpenAIModeratorOptions>()!,
        loggerFactory.CreateLogger<OpenAIModerator<TurnState>>(),
        moderatorHttpClient);

    // Create Application
    AIOptions<TurnState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<TurnState>("./Prompts"),
        moderator: moderator);
    ApplicationOptions<TurnState, TurnStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new TurnStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
    };
    return new GPtMessageExtension(ApplicationOptions, PREVIEW_MODE);
});
#endregion

#region Use Azure OpenAI and Azure Content Safety
/** // Following code is for using Azure OpenAI and Azure Content Safety
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

    // Get HttpClient
    HttpClient moderatorHttpClient = sp.GetService<IHttpClientFactory>()!.CreateClient("WebClient");

    // Create AzureOpenAIPlanner
    IPlanner<TurnState> planner = new AzureOpenAIPlanner<TurnState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<AzureOpenAIPlanner<TurnState>>());

    // Create AzureContentSafetyModerator
    IModerator<TurnState> moderator = new AzureContentSafetyModerator<TurnState>(
        sp.GetService<AzureContentSafetyModeratorOptions>()!,
        loggerFactory.CreateLogger<AzureContentSafetyModerator<TurnState>>(),
        moderatorHttpClient);

    // Create Application
    AIOptions<TurnState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<TurnState>("./Prompts"),
        moderator: moderator);
    ApplicationOptions<TurnState, TurnStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new TurnStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
    };
    return new GPtMessageExtension(ApplicationOptions, PREVIEW_MODE);
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
