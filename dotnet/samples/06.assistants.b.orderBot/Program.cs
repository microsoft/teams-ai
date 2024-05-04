﻿using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners.Experimental;
using Microsoft.Teams.AI.AI.Planners;
using OrderBot;
using OrderBot.Models;
using Azure.AI.OpenAI.Assistants;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Load configuration
var config = builder.Configuration.Get<ConfigOptions>()!;
var isAzureCredentialsSet = config.Azure != null && !string.IsNullOrEmpty(config.Azure.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint);
var isOpenAICredentialsSet = config.OpenAI != null && !string.IsNullOrEmpty(config.OpenAI.ApiKey);

string apiKey = "";
string? endpoint = null;
string? assistantId = "";

// If both credentials are set then the Azure credentials will be used.
if (isAzureCredentialsSet)
{
    apiKey = config.Azure!.OpenAIApiKey!;
    endpoint = config.Azure.OpenAIEndpoint;
    assistantId = config.Azure.OpenAIAssistantId;
}
else if (isOpenAICredentialsSet)
{
    apiKey = config.OpenAI!.ApiKey!;
    assistantId = config.OpenAI.AssistantId;
}
else
{
    throw new Exception("Missing configurations. Set either Azure or OpenAI configurations");

}

// Missing Assistant ID, create new Assistant
if (string.IsNullOrEmpty(assistantId))
{
    AssistantCreationOptions assistantCreationOptions = new("gpt-4")
    {
        Name = "Order Bot",
        Instructions = string.Join("\n", new[]
        {
            "You are a food ordering bot for a restaurant named The Pub.",
            "The customer can order pizza, beer, or salad.",
            "If the customer doesn't specify the type of pizza, beer, or salad they want ask them.",
            "Verify the order is complete and accurate before placing it with the place_order function."
        }),
    };

    assistantCreationOptions.Tools.Add(new FunctionToolDefinition("place_order", "Creates or updates a food order.", new BinaryData(OrderParameters.GetSchema())));

    string newAssistantId = AssistantsPlanner<AssistantsState>.CreateAssistantAsync(apiKey, assistantCreationOptions, endpoint).Result.Id;

    Console.WriteLine($"Created a new assistant with an ID of: {newAssistantId}");
    Console.WriteLine("Copy and save above ID, and set `OpenAI:AssistantId` in appsettings.Development.json.");
    Console.WriteLine("Press any key to exit.");
    Console.ReadLine();
    Environment.Exit(0);
}

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
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
builder.Services.AddSingleton(_ => new AssistantsPlannerOptions(apiKey, assistantId, endpoint));

// Create the Application.
builder.Services.AddTransient<IBot>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;
    IPlanner<AssistantsState> planner = new AssistantsPlanner<AssistantsState>(sp.GetService<AssistantsPlannerOptions>()!, loggerFactory);
    ApplicationOptions<AssistantsState> applicationOptions = new()
    {
        AI = new AIOptions<AssistantsState>(planner),
        Storage = sp.GetService<IStorage>(),
        LoggerFactory = loggerFactory
    };

    Application<AssistantsState> app = new(applicationOptions);

    // Register AI actions
    app.AI.ImportActions(new ActionHandlers());

    // Listen for user to say "/reset".
    app.OnMessage("/reset", ActivityHandlers.ResetMessageHandler);

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
