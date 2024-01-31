using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI;
using TeamsChefBot;
using Microsoft.KernelMemory;

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
builder.Services.AddSingleton<TeamsAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<TeamsAdapter>()!);
builder.Services.AddSingleton<BotAdapter>(sp => sp.GetService<TeamsAdapter>()!);

builder.Services.AddSingleton<IStorage, MemoryStorage>();

// Create AI Model
if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
{
    // Create OpenAI Model
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-3.5-turbo")
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));

    // Create Kernel Memory Serverless instance using OpenAI embeddings API
    builder.Services.AddSingleton<IKernelMemory>((sp) =>
    {
        return new KernelMemoryBuilder()
            .WithOpenAIDefaults(config.OpenAI.ApiKey)
            .WithSimpleFileStorage()
            .Build<MemoryServerless>();
    });
}
else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    // Create Azure OpenAI Model
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new AzureOpenAIModelOptions(
            config.Azure.OpenAIApiKey,
            "gpt-35-turbo",
            config.Azure.OpenAIEndpoint
        )
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));

    // Create Kernel Memory Serverless instance using AzureOpenAI embeddings API
    builder.Services.AddSingleton<IKernelMemory>((sp) =>
    {
        AzureOpenAIConfig azureConfig = new()
        {
            Auth = AzureOpenAIConfig.AuthTypes.APIKey,
            APIKey = config.Azure.OpenAIApiKey,
            Endpoint = config.Azure.OpenAIEndpoint,
            APIType = AzureOpenAIConfig.APITypes.EmbeddingGeneration,
            Deployment = "text-embedding-ada-002" // Update this to the deployment you want to use
        };

        return new KernelMemoryBuilder()
            .WithAzureOpenAITextEmbeddingGeneration(azureConfig)
            .WithAzureOpenAITextGeneration(azureConfig)
            .WithSimpleFileStorage()
            .Build<MemoryServerless>();
    });
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

    KernelMemoryDataSource dataSource = new("teams-ai", sp.GetService<IKernelMemory>()!);
    prompts.AddDataSource("teams-ai", dataSource);

    // Create ActionPlanner
    ActionPlanner<TurnState> planner = new(
        options: new(
            model: sp.GetService<OpenAIModel>()!,
            prompts: prompts,
            defaultPrompt: async (context, state, planner) =>
            {
                PromptTemplate template = prompts.GetPrompt("Chat");
                return await Task.FromResult(template);
            }
        )
        { LogRepairs = true },
        loggerFactory: loggerFactory
    );

    Application<TurnState> app = new ApplicationBuilder<TurnState>()
        .WithAIOptions(new(planner))
        .WithStorage(sp.GetService<IStorage>()!)
        .Build();

    app.AI.ImportActions(new ActionHandlers());

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
