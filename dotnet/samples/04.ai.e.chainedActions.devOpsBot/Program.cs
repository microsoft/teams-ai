using DevOpsBot;
using DevOpsBot.Model;

using Microsoft.Bot.Builder;
using System.Security.Cryptography.X509Certificates;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
ConfigOptions config = builder.Configuration.Get<ConfigOptions>()!;
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

// Create singleton instances for bot application
builder.Services.AddSingleton<IStorage, MemoryStorage>();

// Create AI Model
if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
{
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-4o")
        {
            LogRequests = true
        },
        sp.GetService<ILoggerFactory>()
    ));
}
else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))
{
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
}
else
{
    throw new Exception("please configure settings for either OpenAI or Azure");
}

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    // Create loggers
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;

    PromptManager prompts = new(new() { PromptFolder = "./Prompts" });

    ActionPlanner<DevOpsState> planner = new(
        new(
            sp.GetService<OpenAIModel>()!,
            prompts,
            async (context, state, planner) =>
            {
                return await Task.FromResult(prompts.GetPrompt("Tools"));
            }
        ),
        loggerFactory
    );

    // Create Application
    ApplicationOptions<DevOpsState> ApplicationOptions = new()
    {
        AI = new(planner),
        Storage = sp.GetService<IStorage>(),
        LoggerFactory = loggerFactory,
        TurnStateFactory = () => new DevOpsState()
    };
    TeamsDevOpsBot app = new(ApplicationOptions);

    // register turn and activity handlers
    return app
        .OnConversationUpdate(ConversationUpdateEvents.MembersAdded, TeamsDevOpsBotHandlers.OnMembersAddedAsync)
        .OnMessage("/reset", TeamsDevOpsBotHandlers.OnResetMessageAsync);
});

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.Run();
