using CardGazer;
using CardGazer.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.Application;

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
builder.Services.AddSingleton<TeamsAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<TeamsAdapter>()!);

// Create singleton instances for bot application
builder.Services.AddSingleton<IStorage, MemoryStorage>();

// Create AI Model
if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
{
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-4o")
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));
}
else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new AzureOpenAIModelOptions(
            config.Azure.OpenAIApiKey,
            "gpt-4o",
            config.Azure.OpenAIEndpoint
        )
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));
}
else
{
    throw new Exception("please configure settings for either OpenAI or Azure");
}

// Create the bot as transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    // Create Prompt Manager
    PromptManager prompts = new(new()
    {
        PromptFolder = "./Prompts"
    });

    // Set up the attachment downloader
    TeamsAdapter adapter = sp.GetService<TeamsAdapter>()!;
    TeamsAttachmentDownloaderOptions options = new(config.BOT_ID!, adapter);
    IInputFileDownloader<AppState> downloader = new TeamsAttachmentDownloader<AppState>(options);

    // Create ActionPlanner
    ActionPlanner<AppState> planner = new(
        options: new(
            model: sp.GetService<OpenAIModel>()!,
            prompts: prompts,
            defaultPrompt: async (context, state, planner) =>
            {
                PromptTemplate template = prompts.GetPrompt("sequence");
                return await Task.FromResult(template);
            }
        )
        { LogRepairs = true },
        loggerFactory: loggerFactory
    );

    return new CardGazerBot(new()
    {
        Storage = sp.GetService<IStorage>(),
        AI = new(planner),
        LoggerFactory = loggerFactory,
        TurnStateFactory = () =>
        {
            return new AppState();
        },
        FileDownloaders = new List<IInputFileDownloader<AppState>> { downloader }
    });
});

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
