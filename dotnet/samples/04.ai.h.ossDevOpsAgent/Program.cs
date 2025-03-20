using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.SemanticKernel;
using OSSDevOpsAgent.Model;
using OSSDevOpsAgent;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;

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

// Add Semantic Kernel registration
builder.Services.AddTransient(sp =>
{
    var kernelBuilder = Kernel.CreateBuilder();
    kernelBuilder.Services.AddLogging(services => services.AddConsole().SetMinimumLevel(LogLevel.Debug));
    HttpClient client = sp.GetService<HttpClient>();

    kernelBuilder.AddAzureOpenAIChatCompletion(
        deploymentName: config.Azure.OpenAIDeploymentName,
        modelId: config.Azure.OpenAIModelId,
        apiKey: config.Azure.OpenAIApiKey,
        endpoint: config.Azure.OpenAIEndpoint,
        httpClient: client);

    PullRequestsPlugin plugin = new(client, config);
    kernelBuilder.Plugins.AddFromObject(plugin, "PullRequestsPlugin");
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
    options.AddAuthentication("github", new OAuthSettings()
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
        config.GITHUB_AUTH_TOKEN = state.Temp.AuthTokens["github"];
        await context.SendActivityAsync("You have signed into GitHub");
    });

    // Listen for user to say "/sigout" and then delete cached token
    app.OnMessage("/signout", async (context, state, cancellationToken) =>
    {
        await app.Authentication.SignOutUserAsync(context, state, cancellationToken: cancellationToken);
        await context.SendActivityAsync("You have signed out from GitHub");
    });

    app.AdaptiveCards.OnActionSubmit("applyFilters", async (context, state, data, cancellationToken) =>
    {
        ListOfPRsSubmitActivity filterData = (data as JObject)?.ToObject<ListOfPRsSubmitActivity>() ?? throw new Exception("Incorrect filter data format");

        var labels = filterData.LabelFilter ?? "";
        var assignees = filterData.AssigneeFilter ?? "";
        var authors = filterData.AuthorFilter ?? "";
        var pullRequests = filterData.PullRequests;

        if (labels == null && assignees == null && authors == null)
        {
            await context.SendActivityAsync("Please select at least one filter.");
            return;
        }

        KernelArguments args = new KernelArguments();
        args.Add("labels", labels);
        args.Add("assignees", assignees);
        args.Add("authors", authors);
        args.Add("context", context);
        args.Add("pullRequests", pullRequests);

        var result = await kernel.InvokeAsync("PullRequestsPlugin", "FilterPRs", args, cancellationToken);
        string activity = result.GetValue<string>();
        await orchestrator.SaveActivityToChatHistory(context, activity);
    });

    app.OnActivity(ActivityTypes.Message, async (turnContext, turnState, cancellationToken) =>
    {
        var token = turnState.Temp.AuthTokens["github"];
        if (string.IsNullOrEmpty(token))
        {
            await turnContext.SendActivityAsync("Please sign in to GitHub first.");
        }

        config.GITHUB_AUTH_TOKEN = state.Temp.AuthTokens["github"];

        await orchestrator.CreateChatHistory(turnContext);

        if (turnContext.Activity.Text.IndexOf("pull requests", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            KernelArguments args = new KernelArguments();
            args.Add("context", turnContext);
            var result = await kernel.InvokeAsync("PullRequestsPlugin", "ListPRs", args, cancellationToken);
            string activity = result.GetValue<string>();
            await orchestrator.SaveActivityToChatHistory(turnContext, activity);
        }
        else
        {
            await orchestrator.GetChatMessageContentAsync(turnContext);
        }
    });

    app.Authentication.Get("github").OnUserSignInSuccess(async (context, state) =>
    {
        // Successfully logged in
        config.GITHUB_AUTH_TOKEN = state.Temp.AuthTokens["github"];
        await context.SendActivityAsync("Successfully logged in!");
    });

    app.Authentication.Get("github").OnUserSignInFailure(async (context, state, ex) =>
    {
        // Failed to login
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
