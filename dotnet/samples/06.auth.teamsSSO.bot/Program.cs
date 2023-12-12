using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI;
using Microsoft.Identity.Web;
using BotAuth;
using BotAuth.Model;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();
builder.Logging.AddConsole();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
var config = builder.Configuration.Get<ConfigOptions>();
builder.Configuration["MicrosoftAppType"] = "MultiTenant";
builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

// Create the Bot Framework Authentication to be used with the Bot Adapter.
builder.Services.AddSingleton<BotFrameworkAuthentication, ConfigurationBotFrameworkAuthentication>();

// Create the Cloud Adapter with error handling enabled.
// Note: some classes expect a BotAdapter and some expect a BotFrameworkHttpAdapter, so
// register the same adapter instance for both types.
builder.Services.AddSingleton<CloudAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<CloudAdapter>());

// Create the storage to persist turn state
builder.Services.AddSingleton<IStorage, MemoryStorage>();

builder.Services.AddSingleton<IConfidentialClientApplication>(sp =>
{
    IConfidentialClientApplication app = ConfidentialClientApplicationBuilder.Create(config.AAD_APP_CLIENT_ID)
                                        .WithClientSecret(config.AAD_APP_CLIENT_SECRET)
                                        .WithTenantId(config.AAD_APP_TENANT_ID)
                                        .WithLegacyCacheCompatibility(false)
                                        .Build();
    app.AddInMemoryTokenCache(); // For development purpose only, use distributed cache in production environment
    return app;
});

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    IStorage storage = sp.GetService<IStorage>();
    BotAdapter adapter = sp.GetService<CloudAdapter>()!;
    IConfidentialClientApplication msal = sp.GetService<IConfidentialClientApplication>();
    string signInLink = $"https://{config.BOT_DOMAIN}/auth-start.html";

    AuthenticationOptions<AppState> options = new();
    options.AddAuthentication("graph", new TeamsSsoSettings(new string[]{"User.Read"}, signInLink, msal));

    Application<AppState> app = new ApplicationBuilder<AppState>()
        .WithStorage(storage)
        .WithTurnStateFactory(() => new AppState())
        .WithAuthentication(adapter, options)
        .Build();

    // Listen for user to say "/reset" and then delete conversation state
    app.OnMessage("/reset", async (turnContext, turnState, cancellationToken) =>
    {
        turnState.DeleteConversationState();
        await turnContext.SendActivityAsync("Ok I've deleted the current conversation state", cancellationToken: cancellationToken);
    });

    // Listen for user to say "/sigout" and then delete cached token
    app.OnMessage("/signout", async (context, state, cancellationToken) =>
    {
        await app.Authentication.SignOutUserAsync(context, state, cancellationToken: cancellationToken);

        await context.SendActivityAsync("You have signed out");
    });

    // Listen for ANY message to be received. MUST BE AFTER ANY OTHER MESSAGE HANDLERS
    app.OnActivity(ActivityTypes.Message, async (turnContext, turnState, cancellationToken) =>
    {
        int count = turnState.Conversation.MessageCount;

        // Increment count state.
        turnState.Conversation.MessageCount = ++count;

        await turnContext.SendActivityAsync($"[{count}] you said: {turnContext.Activity.Text}", cancellationToken: cancellationToken);
    });

    app.Authentication.Get("graph").OnUserSignInSuccess(async (context, state) =>
    {
        // Successfully logged in
        await context.SendActivityAsync("Successfully logged in");
        await context.SendActivityAsync($"Token string length: {state.Temp.AuthTokens["graph"].Length}");
        await context.SendActivityAsync($"This is what you said before the AuthFlow started: {context.Activity.Text}");
    });

    app.Authentication.Get("graph").OnUserSignInFailure(async (context, state, ex) =>
    {
        // Failed to login
        await context.SendActivityAsync("Failed to login");
        await context.SendActivityAsync($"Error message: {ex.Message}");
    });

    return app;
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
