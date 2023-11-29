using GPT;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Models;
using GPT.Model;

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

OpenAIModel? model = null;

if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
{
    model = new(new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-3.5-turbo"));
}
else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    model = new(new AzureOpenAIModelOptions(
        config.Azure.OpenAIApiKey,
        "gpt-35-turbo",
        config.Azure.OpenAIEndpoint
    ));
}

if (model == null)
{
    throw new Exception("please configure settings for either OpenAI or Azure");
}

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    IStorage? storage = sp.GetService<IStorage>();

    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    PromptManager prompts = new(new() { PromptFolder = "./Prompts" });

    // Create OpenAIPlanner
    ActionPlanner<AppState> planner = new(
        new(
            model,
            prompts,
            async (context, state, planner) =>
            {
                return await Task.FromResult(prompts.GetPrompt("chat"));
            }
        ),
        loggerFactory
    );

    var appBuilder = new ApplicationBuilder<AppState>()
        .WithAIOptions(new(planner))
        .WithLoggerFactory(loggerFactory)
        .WithTurnStateFactory(() => new AppState());

    if (storage != null)
    {
        appBuilder.WithStorage(storage);
    }

    // Create Application
    Application<AppState> app = appBuilder.Build();
    ActivityHandlers routeHandlers = new(planner, prompts, PREVIEW_MODE);

    app.MessageExtensions.OnFetchTask("CreatePost", routeHandlers.FetchTaskHandler);
    app.MessageExtensions.OnSubmitAction("CreatePost", routeHandlers.SubmitActionHandler);
    app.MessageExtensions.OnBotMessagePreviewEdit("CreatePost", routeHandlers.BotMessagePreviewEditHandler);
    app.MessageExtensions.OnBotMessagePreviewSend("CreatePost", routeHandlers.BotMessagePreviewSendHandler);

    return app;
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
