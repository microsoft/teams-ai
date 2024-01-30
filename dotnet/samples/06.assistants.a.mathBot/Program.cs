﻿using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.AI.Planners.Experimental;
using Microsoft.Teams.AI.AI.Planners;

using MathBot;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Load configuration
var config = builder.Configuration.Get<ConfigOptions>()!;
if (config.OpenAI == null || string.IsNullOrEmpty(config.OpenAI.ApiKey))
{
    throw new Exception("Missing OpenAI configuration.");
}

// Missing Assistant ID, create new Assistant
if (string.IsNullOrEmpty(config.OpenAI.AssistantId))
{
    Console.WriteLine("No Assistant ID configured, creating new Assistant...");
    string newAssistantId = AssistantsPlanner<AssistantsState>.CreateAssistantAsync(config.OpenAI.ApiKey, null, new()
    {
        Name = "Math Tutor",
        Instructions = "You are a personal math tutor. Write and run code to answer math questions.",
        Tools = new()
        {
            new()
            {
                Type = Tool.CODE_INTERPRETER_TYPE
            }
        },
        Model = "gpt-3.5-turbo"
    }).Result.Id;
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
builder.Services.AddSingleton(_ => new AssistantsPlannerOptions(config.OpenAI.ApiKey, config.OpenAI.AssistantId));

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
