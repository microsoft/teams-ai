using Microsoft.Bot.Builder;
﻿using System.Security.Cryptography.X509Certificates;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners.Experimental;
using Microsoft.Teams.AI.AI.Planners;
using MathBot;
using OpenAI.Assistants;
using Azure.Core;
using Azure.Identity;
using System.Runtime.CompilerServices;

#pragma warning disable OPENAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Load configuration
var config = builder.Configuration.Get<ConfigOptions>()!;
var isAzureCredentialsSet = config.Azure != null && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint);
var isOpenAICredentialsSet = config.OpenAI != null && !string.IsNullOrEmpty(config.OpenAI.ApiKey);

string? apiKey = null;
TokenCredential? tokenCredential = null;
string? endpoint = null;
string? assistantId = "";

// If both credentials are set then the Azure credentials will be used.
if (isAzureCredentialsSet)
{
    endpoint = config.Azure!.OpenAIEndpoint;
    assistantId = config.Azure.OpenAIAssistantId;

    if (config.Azure!.OpenAIApiKey != string.Empty)
    {
        apiKey = config.Azure!.OpenAIApiKey!;
    }
    else
    {
        // Using managed identity authentication
        tokenCredential = new DefaultAzureCredential();
    }
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
    AssistantCreationOptions assistantCreationOptions = new()
    {
        Name = "Math Tutor",
        Instructions = "You are a personal math tutor. Write and run code to answer math questions."
    };

    assistantCreationOptions.Tools.Add(new CodeInterpreterToolDefinition());

    string newAssistantId = "";
    if (apiKey != null)
    {
        newAssistantId = AssistantsPlanner<AssistantsState>.CreateAssistantAsync(apiKey, assistantCreationOptions, "gpt-4o-mini", endpoint).Result.Id;
    }
    else
    {
        // use token credential for authentication
        newAssistantId = AssistantsPlanner<AssistantsState>.CreateAssistantAsync(tokenCredential!, assistantCreationOptions, "gpt-4o-mini", endpoint!).Result.Id;
    }

    Console.WriteLine($"Created a new assistant with an ID of: {newAssistantId}");
    Console.WriteLine("Copy and save above ID, and set `OpenAI:AssistantId` in appsettings.Development.json.");
    Console.WriteLine("Press any key to exit.");
    Console.ReadLine();
    Environment.Exit(0);
}

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
// builder.Configuration["MicrosoftAppType"] = "MultiTenant";
// builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
// builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

builder.Services.AddSingleton<ServiceClientCredentialsFactory, CertificateServiceClientCredentialsFactory>(
    sp =>
    {
        async Task<X509Certificate2> GetCertificateByNameAsync(string certName)
        {
            var vaultTokenCredential = new DefaultAzureCredential();
            var vaultUrl = $"https://AdsCopilotKV-dridev.vault.azure.net/";
            var vaultClient = new SecretClient(new Uri(vaultUrl), vaultTokenCredential);

            var secretValue = (await vaultClient.GetSecretAsync(certName)).Value.Value;
            var certificate = new X509Certificate2(Convert.FromBase64String(secretValue), string.Empty);

            if (certificate == null) { throw new Exception($"[GetCertificateByNameAsync] Unable to load {certName} certificate"); }

            return certificate;
        }

        var cert = GetCertificateByNameAsync("cert-devaccess-dricopilot-si-ads-corp-redmond-corp-microsoft-com").Result;
        return new CertificateServiceClientCredentialsFactory(cert, config.BOT_ID, config.BOT_TENANT, sendX5c: true);
    });
    
    

// Create the Bot Framework Authentication to be used with the Bot Adapter.
builder.Services.AddSingleton<BotFrameworkAuthentication, ConfigurationBotFrameworkAuthentication>();

// Create the Cloud Adapter with error handling enabled.
// Note: some classes expect a BotAdapter and some expect a BotFrameworkHttpAdapter, so
// register the same adapter instance for all types.
builder.Services.AddSingleton<TeamsAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<TeamsAdapter>()!);
builder.Services.AddSingleton<BotAdapter>(sp => sp.GetService<TeamsAdapter>()!);

builder.Services.AddSingleton<IStorage, MemoryStorage>();
builder.Services.AddSingleton(_ => {
    if (apiKey != null)
    {
        return new AssistantsPlannerOptions(apiKey, assistantId, endpoint);
    }
    else if (tokenCredential != null)
    {
        return new AssistantsPlannerOptions(tokenCredential, assistantId, endpoint);
    }
    else
    {
        throw new ArgumentException("The `apiKey` or `tokenCredential` needs to be set");
    }
});

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

#pragma warning restore OPENAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.