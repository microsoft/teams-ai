using System.Security.Cryptography.X509Certificates;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using EchoBot;
using EchoBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient("WebClient", client => client.Timeout = TimeSpan.FromSeconds(600));
builder.Services.AddHttpContextAccessor();
builder.Logging.AddConsole();

// Prepare Configuration for ConfigurationBotFrameworkAuthentication
var config = builder.Configuration.Get<ConfigOptions>();
//builder.Configuration["MicrosoftAppType"] = "MultiTenant";
//builder.Configuration["MicrosoftAppId"] = config.BOT_ID;
//builder.Configuration["MicrosoftAppTenantId"] = config.BOT_TENANT;
//builder.Configuration["MicrosoftAppPassword"] = config.BOT_PASSWORD;

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
// register the same adapter instance for both types.
builder.Services.AddSingleton<TeamsAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<TeamsAdapter>());

// Create the storage to persist turn state
builder.Services.AddSingleton<IStorage, MemoryStorage>();

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    IStorage storage = sp.GetService<IStorage>();
    ApplicationOptions<AppState> applicationOptions = new()
    {
        Storage = storage,
        TurnStateFactory = () =>
        {
            return new AppState();
        }
    };

    Application<AppState> app = new(applicationOptions);

    // Listen for user to say "/reset" and then delete conversation state
    app.OnMessage("/reset", ActivityHandlers.ResetMessageHandler);

    // Listen for ANY message to be received. MUST BE AFTER ANY OTHER MESSAGE HANDLERS
    app.OnActivity(ActivityTypes.Message, ActivityHandlers.MessageHandler);

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
