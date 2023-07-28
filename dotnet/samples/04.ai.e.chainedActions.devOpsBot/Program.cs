using DevOpsBot;
using DevOpsBot.Model;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI;
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
builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new(config.OpenAI.ApiKey, "text-davinci-003"));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create OpenAIPlanner
    IPlanner<DevOpsState> planner = new OpenAIPlanner<DevOpsState>(
        sp.GetService<OpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<OpenAIPlanner<DevOpsState>>());

    // Create Application
    AIOptions<DevOpsState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<DevOpsState>("./Prompts"),
        prompt: "Chat");
    ApplicationOptions<DevOpsState, DevOpsStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new DevOpsStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
    };
    return new TeamsDevOpsBot(ApplicationOptions);
});

#endregion

#region Use Azure OpenAI
/** // Following code is for using Azure OpenAI
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey)
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    throw new ArgumentException("Missing Azure configuration.");
}
builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new(config.Azure.OpenAIApiKey, "text-davinci-003", config.Azure.OpenAIEndpoint));

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create AzureOpenAIPlanner
    IPlanner<DevOpsState> planner = new AzureOpenAIPlanner<DevOpsState>(
        sp.GetService<AzureOpenAIPlannerOptions>()!,
        loggerFactory.CreateLogger<AzureOpenAIPlanner<DevOpsState>>());

    // Create Application
    AIOptions<DevOpsState> aiOptions = new(
        planner: planner,
        promptManager: new PromptManager<DevOpsState>("./Prompts"),
        prompt: "Chat");
    ApplicationOptions<DevOpsState, DevOpsStateManager> ApplicationOptions = new()
    {
        TurnStateManager = new DevOpsStateManager(),
        Storage = sp.GetService<IStorage>(),
        AI = aiOptions
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
