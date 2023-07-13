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
var config = builder.Configuration.Get<ConfigOptions>();
builder.Configuration["MicrosoftAppType"] = "MultiTenant";
builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

// Create the Bot Framework Authentication to be used with the Bot Adapter.
builder.Services.AddSingleton<BotFrameworkAuthentication, ConfigurationBotFrameworkAuthentication>();

// Create the Cloud Adapter with error handling enabled.
// Note: some classes expect a BotAdapter and some expect a BotFrameworkHttpAdapter, so
// register the same adapter instance for all types.
builder.Services.AddSingleton<CloudAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<CloudAdapter>());
builder.Services.AddSingleton<BotAdapter>(sp => sp.GetService<CloudAdapter>());

builder.Services.AddSingleton<IStorage, MemoryStorage>();
//builder.Services.AddSingleton<OpenAIPlannerOptions>(_ => new OpenAIPlannerOptions(config.OPENAI_API_KEY, "text-davinci-003"));
builder.Services.AddSingleton<AzureOpenAIPlannerOptions>(_ => new AzureOpenAIPlannerOptions(config.AZURE_OPENAI_API_KEY, "gpt-4-32k", config.AZURE_OPENAI_ENDPOINT));
//builder.Services.AddSingleton<OpenAIModeratorOptions>(_ => new OpenAIModeratorOptions(config.OPENAI_API_KEY, ModerationType.Both));
builder.Services.AddSingleton<AzureContentSafetyModeratorOptions>(_ => new AzureContentSafetyModeratorOptions(config.AZURE_CONTENT_SAFETY_API_KEY, config.AZURE_CONTENT_SAFETY_ENDPOINT, ModerationType.Both));

// Create the Application.
builder.Services.AddTransient<IBot, TeamsChefBotApplication>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>();

    //IPlanner<TurnState> planner = new OpenAIPlanner<TurnState>(sp.GetService<OpenAIPlannerOptions>(), loggerFactory.CreateLogger<OpenAIPlanner<TurnState>>());
    IPlanner<TurnState> planner = new AzureOpenAIPlanner<TurnState>(sp.GetService<AzureOpenAIPlannerOptions>(), loggerFactory.CreateLogger<AzureOpenAIPlanner<TurnState>>());

    IPromptManager<TurnState> promptManager = new PromptManager<TurnState>("./Prompts");

    //IModerator<TurnState> moderator = new OpenAIModerator<TurnState>(sp.GetService<OpenAIModeratorOptions>(), loggerFactory.CreateLogger<OpenAIModerator<TurnState>>());
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
        Storage = sp.GetService<IStorage>()
    };

    return new TeamsChefBotApplication(applicationOptions);
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
