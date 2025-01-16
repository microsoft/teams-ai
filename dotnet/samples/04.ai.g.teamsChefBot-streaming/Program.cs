using Microsoft.Bot.Builder;
using System.Security.Cryptography.X509Certificates;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI;
using TeamsChefBot;
using Microsoft.KernelMemory;
using Microsoft.Teams.AI.AI.DataSources;
using static Microsoft.Teams.AI.AI.Models.IPromptCompletionModelEvents;
using AdaptiveCards;
using System.IO;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Application;

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
        X509Certificate2 GetCertificateByName(string certName)
        {
            var vaultTokenCredential = new DefaultAzureCredential();
            var vaultUrl = $"https://AdsCopilotKV-dridev.vault.azure.net/";
            var vaultClient = new SecretClient(new Uri(vaultUrl), vaultTokenCredential);

            var secretValue = vaultClient.GetSecret(certName).Value.Value;
            var certificate = new X509Certificate2(Convert.FromBase64String(secretValue), string.Empty);

            if (certificate == null) { throw new Exception($"[GetCertificateByNameAsync] Unable to load {certName} certificate"); }

            return certificate;
        }

        var cert = GetCertificateByName("cert-devaccess-dricopilot-si-ads-corp-redmond-corp-microsoft-com");
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

var tokenCredential = new DefaultAzureCredential();

// Create AI Model
//if (!string.IsNullOrEmpty(config.OpenAI?.ApiKey))
//{
//    // Create OpenAI Model
//    builder.Services.AddSingleton<OpenAIModel > (sp => new(
//        new OpenAIModelOptions(config.OpenAI.ApiKey, "gpt-4o")
//        {
//            LogRequests = true,
//            Stream = true,
//        },
//        sp.GetService<ILoggerFactory>()
//    ));

//    // Create Kernel Memory Serverless instance using OpenAI embeddings API
//    builder.Services.AddSingleton<IKernelMemory>((sp) =>
//    {
//        return new KernelMemoryBuilder()
//            .WithOpenAIDefaults(config.OpenAI.ApiKey)
//            .WithSimpleFileStorage()
//            .Build<MemoryServerless>();
//    });
//}
//else if (!string.IsNullOrEmpty(config.Azure?.OpenAIApiKey) && !string.IsNullOrEmpty(config.Azure.OpenAIEndpoint))

var endpoint = config.Azure.OpenAIEndpoint;

{

    // Create Azure OpenAI Model
    builder.Services.AddSingleton<OpenAIModel>(sp => new(
        new AzureOpenAIModelOptions(
            tokenCredential,
            "gpt-4o",
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
            Auth = AzureOpenAIConfig.AuthTypes.ManualTokenCredential,
            //APIKey = config.Azure.OpenAIApiKey,
            Endpoint = config.Azure.OpenAIEndpoint,
            APIType = AzureOpenAIConfig.APITypes.EmbeddingGeneration,
            Deployment = "text-embedding-ada-002" // Update this to the deployment you want to use
        };
        azureConfig.SetCredential(tokenCredential);

        return new KernelMemoryBuilder()
            .WithAzureOpenAITextEmbeddingGeneration(azureConfig)
            .WithAzureOpenAITextGeneration(azureConfig)
            .WithSimpleFileStorage()
            .Build<MemoryServerless>();
    });
}
//else
//{
//    throw new Exception("please configure settings for either OpenAI or Azure");
//}

builder.Services.AddSingleton<IDataSource>((sp) =>
{
    return new KernelMemoryDataSource("teams-ai", sp.GetService<IKernelMemory>()!);
});

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

    prompts.AddDataSource("teams-ai", sp.GetService<IDataSource>()!);

    ResponseReceivedHandler endStreamHandler = new((object sender, ResponseReceivedEventArgs args) =>
    {
        StreamingResponse? streamer = args.Streamer;

        if (streamer == null)
        {
            return;
        }

        AdaptiveCard adaptiveCard = new("1.6")
        {
            Body = [new AdaptiveTextBlock(streamer.Message) { Wrap = true }]
        };

        var adaptiveCardAttachment = new Attachment()
        {
            ContentType = "application/vnd.microsoft.card.adaptive",
            Content = adaptiveCard,
        };


        streamer.Attachments = [adaptiveCardAttachment];

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
        {
            LogRepairs = true,
            StartStreamingMessage = "Loading stream results...",
            EndStreamHandler = endStreamHandler
        },
        loggerFactory: loggerFactory
    );

    Application<TurnState> app = new ApplicationBuilder<TurnState>()
        .WithAIOptions(new(planner) { EnableFeedbackLoop = true })
        .WithStorage(sp.GetService<IStorage>()!)
        .Build();

    app.AI.ImportActions(new ActionHandlers());

    app.OnFeedbackLoop((turnContext, turnState, feedbackLoopData, _) =>
    {
        Console.WriteLine("Feedback loop triggered");
        return Task.CompletedTask;
    });

    return app;
});

var app = builder.Build();

var _ = app.Services.GetRequiredService<ServiceClientCredentialsFactory>();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.Run();
