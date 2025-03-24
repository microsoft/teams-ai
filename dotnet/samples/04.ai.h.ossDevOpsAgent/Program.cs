using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.SemanticKernel;
using OSSDevOpsAgent.Models;
using OSSDevOpsAgent;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using OSSDevOpsAgent.Templates;

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
builder.Services.AddSingleton<TeamsAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<TeamsAdapter>());

// Create the storage to persist turn state
builder.Services.AddSingleton<IStorage, MemoryStorage>();

// Create the repository service and plugin
builder.Services.AddTransient<IRepositoryService>(sp =>
{
    MemoryStorage storage = (MemoryStorage)sp.GetService<IStorage>();
    TeamsAdapter adapter = sp.GetService<TeamsAdapter>();
    HttpClient client = sp.GetService<HttpClient>();

    GHPlugin plugin = new(client, config);
    return new GHService(storage, adapter, plugin);
});

// Create semantic kernel 
builder.Services.AddTransient(sp =>
{
    var kernelBuilder = Kernel.CreateBuilder();
    kernelBuilder.Services.AddLogging(services => services.AddConsole().SetMinimumLevel(LogLevel.Debug));

    HttpClient client = sp.GetService<HttpClient>();
    IRepositoryService repoService = sp.GetService<IRepositoryService>();

    kernelBuilder.AddAzureOpenAIChatCompletion(
        deploymentName: config.Azure.OpenAIDeploymentName,
        modelId: config.Azure.OpenAIModelId,
        apiKey: config.Azure.OpenAIApiKey,
        endpoint: config.Azure.OpenAIEndpoint,
        httpClient: client);

    GHPlugin plugin = (GHPlugin)repoService.RepositoryPlugin;
    kernelBuilder.Plugins.AddFromObject(plugin, "GHPlugin");
    return kernelBuilder.Build();
});

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;
    HttpClient client = sp.GetService<HttpClient>();
    IStorage storage = sp.GetService<IStorage>();
    TeamsAdapter adapter = sp.GetService<TeamsAdapter>();

    AppState state = new AppState();
    AuthenticationOptions<AppState> options = new();
    options.AddAuthentication(config.OAUTH_CONNECTION_NAME, new OAuthSettings()
    {
        ConnectionName = config.OAUTH_CONNECTION_NAME,
        Title = "Sign In",
        Text = "Please sign in to use the bot.",
        EndOnInvalidMessage = true
    }
    );

    Application<AppState> app = new ApplicationBuilder<AppState>()
        .WithStorage(storage)
        .WithTurnStateFactory(() => state)
        .WithAuthentication(adapter, options)
        .WithLoggerFactory(loggerFactory)
        .Build();

    // Setup orchestration
    Kernel kernel = sp.GetService<Kernel>();
    KernelOrchestrator orchestrator = new KernelOrchestrator(kernel, storage, config);

    app.OnMessage("/signin", async (context, state, cancellationToken) =>
    {
        await app.Authentication.SignUserInAsync(context, state, cancellationToken: cancellationToken);
        config.AUTH_TOKEN = state.Temp.AuthTokens[config.OAUTH_CONNECTION_NAME];
        await context.SendActivityAsync("You have signed in.");
    });

    // Listen for user to say "/sigout" and then delete cached token
    app.OnMessage("/signout", async (context, state, cancellationToken) =>
    {
        await app.Authentication.SignOutUserAsync(context, state, cancellationToken: cancellationToken);
        await context.SendActivityAsync("You have signed out.");
    });

    app.AdaptiveCards.OnActionSubmit("githubFilters", async (context, state, data, cancellationToken) =>
    {
        GHSubmitPRsActivity filterData = (GHSubmitPRsActivity)((data as JObject)?.ToObject<GHSubmitPRsActivity>());

        var labels = filterData.LabelFilter;
        var assignees = filterData.AssigneeFilter;
        var authors = filterData.AuthorFilter;
        var pullRequests = filterData.PullRequests;

        if (string.IsNullOrEmpty(labels) && string.IsNullOrEmpty(assignees) && string.IsNullOrEmpty(authors))
        {
            await context.SendActivityAsync("Please select at least one filter.");
            return;
        }

        if (pullRequests.Count == 0)
        {
            await context.SendActivityAsync("No pull requests to filter.");
            return;
        }

        KernelArguments args = new KernelArguments();
        args.Add("labels", labels);
        args.Add("assignees", assignees);
        args.Add("authors", authors);
        args.Add("context", context);
        args.Add("pullRequests", pullRequests);

        var result = await kernel.InvokeAsync("GHPlugin", "FilterPRs", args, cancellationToken);
        string activity = result.GetValue<string>();
        await orchestrator.SaveActivityToChatHistory(context, activity);
    });

    app.OnActivity(ActivityTypes.Message, async (turnContext, turnState, cancellationToken) =>
    {
        var token = turnState.Temp.AuthTokens[config.OAUTH_CONNECTION_NAME];
        if (string.IsNullOrEmpty(token))
        {
            await turnContext.SendActivityAsync("Please sign in first.");
        }

        // Saved to authenticate with SK's plugins
        config.AUTH_TOKEN = token;

        await orchestrator.CreateChatHistory(turnContext);

        if (turnContext.Activity.Text.IndexOf("pull requests", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            KernelArguments args = new KernelArguments();
            args.Add("context", turnContext);
            var result = await kernel.InvokeAsync("GHPlugin", "ListPRs", args, cancellationToken);
            string activity = result.GetValue<string>();
            await orchestrator.SaveActivityToChatHistory(turnContext, activity);
        }
        else
        {
            await orchestrator.GetChatMessageContentAsync(turnContext);
        }
    });

    app.Authentication.Get(config.OAUTH_CONNECTION_NAME).OnUserSignInSuccess(async (context, state) =>
    {
        // Saved to authenticate with SK's plugins
        config.AUTH_TOKEN = state.Temp.AuthTokens[config.OAUTH_CONNECTION_NAME];
        await context.SendActivityAsync("Successfully logged in!");
    });

    app.Authentication.Get(config.OAUTH_CONNECTION_NAME).OnUserSignInFailure(async (context, state, ex) =>
    {
        await context.SendActivityAsync("Sorry, we failed to log you in. Please try again.");
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
