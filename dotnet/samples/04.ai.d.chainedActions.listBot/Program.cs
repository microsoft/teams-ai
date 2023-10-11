using ListBot;
using ListBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI;
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

builder.Services.AddSingleton<IStorage, MemoryStorage>();

#region Use Azure OpenAI
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey)
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    throw new Exception("Missing Azure configuration.");
}

builder.Services.AddSingleton(_ => new AzureOpenAIPlannerOptions(config.Azure.OpenAIApiKey, "text-davinci-003", config.Azure.OpenAIEndpoint)
{
    LogRequests = true
});

// Create the Application.
builder.Services.AddTransient<IBot, ListBotApplication>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    PromptManager<ListState> promptManager = new("./Prompts");

    AzureOpenAIPlanner<ListState> planner = new(sp.GetService<AzureOpenAIPlannerOptions>()!, loggerFactory);

    ApplicationOptions<ListState, ListStateManager> applicationOptions = new()
    {
        AI = new AIOptions<ListState>(planner, promptManager)
        {
            Prompt = "Chat"
        },
        Storage = sp.GetService<IStorage>(),
        LoggerFactory = loggerFactory,
    };

    return new ListBotApplication(applicationOptions);
});
#endregion

#region Use OpenAI
/**
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new Exception("Missing OpenAI configuration.");
}

builder.Services.AddSingleton(_ => new OpenAIPlannerOptions(config.OpenAI.ApiKey, "text-davinci-003")
{
    LogRequests = true
});

// Create the Application.
builder.Services.AddTransient<IBot, ListBotApplication>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    PromptManager<ListState> promptManager = new("./Prompts");

    OpenAIPlanner<ListState> planner = new(sp.GetService<OpenAIPlannerOptions>()!, loggerFactory);

    ApplicationOptions<ListState, ListStateManager> applicationOptions = new()
    {
        AI = new AIOptions<ListState>(planner, promptManager)
        {
            Prompt = "Chat"
        },
        Storage = sp.GetService<IStorage>(),
        LoggerFactory = loggerFactory,
    };

    return new ListBotApplication(applicationOptions);
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
