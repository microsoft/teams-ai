using TeamsChefBot;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.State;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsFx.Conversation;
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

// Create the Conversation Bot.
builder.Services.AddSingleton(sp =>
{
    ConversationOptions options = new ConversationOptions()
    {
        Adapter = sp.GetService<CloudAdapter>(),
        Command = new CommandOptions()
        {
            Commands = new List<ITeamsCommandHandler>()
        }
    };
    return new ConversationBot(options);
});

// Create the Application.
builder.Services.AddSingleton<IBot, TeamsChefBotApplication>(sp =>
{
    OpenAIPlannerOptions openAIPlannerOptions = new OpenAIPlannerOptions(config.OPENAI_API_KEY, "text-davinci-003");
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>();
    ILogger<OpenAIPlanner<TurnState>> logger = loggerFactory.CreateLogger<OpenAIPlanner<TurnState>>();
    IPlanner<TurnState> planner = new OpenAIPlanner<TurnState>(openAIPlannerOptions, logger);
    IPromptManager<TurnState> promptManager = new PromptManager<TurnState>("./Prompts");
    OpenAIModeratorOptions openAIModeratorOptions = new OpenAIModeratorOptions(config.OPENAI_API_KEY, ModerationType.Both);
    IModerator<TurnState> moderator = new OpenAIModerator<TurnState>(openAIModeratorOptions, logger);
    AIHistoryOptions aiHistoryOptions = new AIHistoryOptions()
    {
        AssistantHistoryType = AssistantHistoryType.Text
    };
    AIOptions<TurnState> aiOptions = new AIOptions<TurnState>(planner, promptManager)
    {
        Moderator = moderator,
        Prompt = "Chat",
        History = aiHistoryOptions
    };
    IStorage storage = new MemoryStorage();
    ApplicationOptions<TurnState, TurnStateManager> applicationOptions = new ApplicationOptions<TurnState, TurnStateManager>()
    {
        AI = aiOptions,
        Storage = storage,
        StartTypingTimer = false
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
