using Microsoft.Bot.Builder;
﻿using System.Security.Cryptography.X509Certificates;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI;
using ChatModeration;
using Microsoft.Teams.AI.AI.Moderator;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
var config = builder.Configuration.Get<ConfigOptions>()!;
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

// Create AI Model
if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
{
    // Create OpenAI Model
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-4o")
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));

    builder.Services.AddSingleton<IModerator<TurnState>>(sp => new OpenAIModerator<TurnState>(new(apiKey: config.OpenAI.ApiKey, ModerationType.Both)));
}
else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
    // Create Azure OpenAI Model
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new AzureOpenAIModelOptions(
            config.Azure.OpenAIApiKey,
            "gpt-4o",
            config.Azure.OpenAIEndpoint
        )
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));

    builder.Services.AddSingleton<IModerator<TurnState>>(sp => 
        new AzureContentSafetyModerator<TurnState>(new(config.Azure.OpenAIApiKey, config.Azure.OpenAIEndpoint, ModerationType.Both))
    );
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
        .WithAIOptions(new(planner) { Moderator = sp.GetService<IModerator<TurnState>>() })
        .WithStorage(sp.GetService<IStorage>()!)
        .Build();

    app.AI.ImportActions(new ActionHandlers());

    app.OnConversationUpdate("membersAdded", async (context, state, token) =>
    {
        await context.SendActivityAsync("Hello and welcome! With this sample you can see the functionality of the Azure AI Content Safety Moderator " +
            "or OpenAI's Moderator based on the setup configurations.");
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
app.MapControllers();

app.Run();
