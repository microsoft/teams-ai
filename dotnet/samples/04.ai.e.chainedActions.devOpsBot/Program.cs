using DevOpsBot;
using DevOpsBot.Model;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;

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
builder.Services.AddSingleton<IStorage, MemoryStorage>();

#region Use OpenAI
// Use OpenAI
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new ArgumentException("Missing OpenAI configuration.");
}
builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OpenAI.ApiKey, "gpt-3.5-turbo"));
builder.Services.AddSingleton<OpenAIModeratorOptions>(_ => new(config.OpenAI.ApiKey, ModerationType.Both));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Get HttpClient
    HttpClient moderatorHttpClient = sp.GetService<IHttpClientFactory>()!.CreateClient("WebClient");

    // Create OpenAIPlanner
    IPlanner<DevOpsState> planner = new OpenAIPlanner<DevOpsState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<OpenAIPlanner<DevOpsState>>());

    // Create OpenAIModerator
    IModerator<DevOpsState> moderator = new OpenAIModerator<DevOpsState>(
        sp.GetService<OpenAIModeratorOptions>()!,
        loggerFactory.CreateLogger<OpenAIModerator<DevOpsState>>(),
        moderatorHttpClient);

    // Create Application
    AIOptions<DevOpsState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<DevOpsState>("./Prompts"),
        prompt: "ChatGPT",
        moderator: moderator);
    ApplicationOptions<DevOpsState, DevOpsStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new DevOpsStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
    };
    return new TeamsDevOpsBot(ApplicationOptions);
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
    throw new ArgumentException("Missing Azure configuration.");
}
builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new(config.Azure.OpenAIApiKey, "gpt-3.5-turbo", config.Azure.OpenAIEndpoint));
builder.Services.AddSingleton<AzureContentSafetyModeratorOptions>(_ => new(config.Azure.ContentSafetyApiKey, config.Azure.ContentSafetyEndpoint, ModerationType.Both));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Get HttpClient
    HttpClient moderatorHttpClient = sp.GetService<IHttpClientFactory>()!.CreateClient("WebClient");

    // Create AzureOpenAIPlanner
    IPlanner<DevOpsState> planner = new AzureOpenAIPlanner<DevOpsState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<AzureOpenAIPlanner<DevOpsState>>());

    // Create AzureContentSafetyModerator
    IModerator<DevOpsState> moderator = new AzureContentSafetyModerator<DevOpsState>(
        sp.GetService<AzureContentSafetyModeratorOptions>()!,
        loggerFactory.CreateLogger<AzureContentSafetyModerator<DevOpsState>>(),
        moderatorHttpClient);

    // Create Application
    AIOptions<DevOpsState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<DevOpsState>("./Prompts"),
        prompt: "ChatGPT",
        moderator: moderator);
    ApplicationOptions<DevOpsState, DevOpsStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new DevOpsStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions,
    };
    return new TeamsDevOpsBot(ApplicationOptions);
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
