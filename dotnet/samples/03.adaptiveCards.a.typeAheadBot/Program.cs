using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using NewApp = Microsoft.TeamsAI.Application;
using Microsoft.TeamsAI.State;
using TypeAheadBot;
using System.Text.RegularExpressions;
using Microsoft.Bot.Schema;

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
builder.Services.AddSingleton<ActivityHandlers>();

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    IStorage storage = sp.GetService<IStorage>()!;
    ApplicationOptions<TurnState, TurnStateManager> applicationOptions = new()
    {
        Storage = storage,
    };

    NewApp.Application<TurnState, TurnStateManager> app = new(applicationOptions);
    NewApp.AdaptiveCards<TurnState, TurnStateManager> adaptiveCards = new(app);

    ActivityHandlers activityHandlers = sp.GetService<ActivityHandlers>()!;

    // Listen for new members to join the conversation
    app.OnConversationUpdate("membersAdded", activityHandlers.MembersAddedHandler);

    // Listen for messages that trigger returning an adaptive card
    app.OnMessage(new Regex(@"static", RegexOptions.IgnoreCase), activityHandlers.StaticMessageHandler);
    app.OnMessage(new Regex(@"dynamic", RegexOptions.IgnoreCase), activityHandlers.DynamicMessageHandler);

    // Listen for query from dynamic search card
    adaptiveCards.OnSearch("nugetpackages", activityHandlers.SearchHandler);
    // Listen for submit buttons
    adaptiveCards.OnActionSubmit("StaticSubmit", activityHandlers.StaticSubmitHandler);
    adaptiveCards.OnActionSubmit("DynamicSubmit", activityHandlers.DynamicSubmitHandler);

    // Listen for ANY message to be received. MUST BE AFTER ANY OTHER HANDLERS
    app.OnActivity(ActivityTypes.Message, activityHandlers.MessageHandler);

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
