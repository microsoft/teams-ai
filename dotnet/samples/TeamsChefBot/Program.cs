using TeamsChefBot;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.State;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Moderator;

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

#region Use OpenAI
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new Exception("Missing OpenAI configuration.");
}

builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new OpenAIPlannerOptions(config.OpenAI.ApiKey, "text-davinci-003"));
builder.Services.AddSingleton<OpenAIModeratorOptions>(_ => new OpenAIModeratorOptions(config.OpenAI.ApiKey, ModerationType.Both));

// Create the Application.
builder.Services.AddTransient<IBot, TeamsChefBotApplication>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    IPromptManager<TurnState> promptManager = new PromptManager<TurnState>("./Prompts");

    IPlanner<TurnState> planner = new OpenAIPlanner<TurnState>(sp.GetService<OpenAIPlannerOptions>()!, loggerFactory.CreateLogger<OpenAIPlanner<TurnState>>());
    IModerator<TurnState> moderator = new OpenAIModerator<TurnState>(sp.GetService<OpenAIModeratorOptions>()!, loggerFactory.CreateLogger<OpenAIModerator<TurnState>>());

    ApplicationOptions<TurnState, TurnStateManager> applicationOptions = new ApplicationOptions<TurnState, TurnStateManager>()
    {
        AI = new AIOptions<TurnState>(planner, promptManager)
        {
            Moderator = moderator,
            Prompt = "Chat",
            History = new AIHistoryOptions()
            {
                AssistantHistoryType = AssistantHistoryType.Text
            }
        },
        Storage = sp.GetService<IStorage>()
    };

    return new TeamsChefBotApplication(applicationOptions);
});
#endregion

#region Use Azure OpenAI and Azure Content Safety
/**
if (config.Azure == null
    || string.IsNullOrEmpty(config.Azure.OpenAIApiKey) 
    || string.IsNullOrEmpty(config.Azure.OpenAIEndpoint)
    || string.IsNullOrEmpty(config.Azure.ContentSafetyApiKey)
    || string.IsNullOrEmpty(config.Azure.ContentSafetyEndpoint))
{
    throw new Exception("Missing Azure configuration.");
}

builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new AzureOpenAIPlannerOptions(config.Azure.OpenAIApiKey, "text-davinci-003", config.Azure.OpenAIEndpoint));
builder.Services.AddSingleton<AzureContentSafetyModeratorOptions>(_ => new AzureContentSafetyModeratorOptions(config.Azure.ContentSafetyApiKey, config.Azure.ContentSafetyEndpoint, ModerationType.Both));

// Create the Application.
builder.Services.AddTransient<IBot, TeamsChefBotApplication>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    IPromptManager<TurnState> promptManager = new PromptManager<TurnState>("./Prompts");

    IPlanner<TurnState> planner = new AzureOpenAIPlanner<TurnState>(sp.GetService<AzureOpenAIPlannerOptions>(), loggerFactory.CreateLogger<AzureOpenAIPlanner<TurnState>>());
    IModerator<TurnState> moderator = new AzureContentSafetyModerator<TurnState>(sp.GetService<AzureContentSafetyModeratorOptions>(), loggerFactory.CreateLogger<AzureContentSafetyModerator<TurnState>>());

    ApplicationOptions<TurnState, TurnStateManager> applicationOptions = new ApplicationOptions<TurnState, TurnStateManager>()
    {
        AI = new AIOptions<TurnState>(planner, promptManager)
        {
            Moderator = moderator,
            Prompt = "Chat",
            History = new AIHistoryOptions()
            {
                AssistantHistoryType = AssistantHistoryType.Text
            }
        },
        Storage = sp.GetService<IStorage>(),
        StartTypingTimer = false
    };

    return new TeamsChefBotApplication(applicationOptions);
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
