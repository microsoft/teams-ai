using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners.Experimental;
using Microsoft.Teams.AI.AI.Planners;
using OrderBot;
using OrderBot.Models;
using OpenAI.Assistants;
using Azure.Core;
using Azure.Identity;
using System.Runtime.CompilerServices;
using Microsoft.Teams.AI.Application;
using OpenAI.Files;
using OpenAI.VectorStores;
using OpenAI;
using Azure.AI.OpenAI;
using System.ClientModel;

#pragma warning disable OPENAI001
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
    } else
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
    VectorStore store = null!;
    try
    {
        OpenAIClient client;
        if (endpoint != null)
        {
            if (apiKey != null)
            {
                client = new AzureOpenAIClient(new Uri(endpoint), new ApiKeyCredential(apiKey));
            }
            else
            {
                client = new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential());
            }
        }
        else
        {
            client = new OpenAIClient(apiKey!);
        }

        // Create Vector Store
        var storeClient = client.GetVectorStoreClient();
        store = storeClient.CreateVectorStore(new VectorStoreCreationOptions());

        // Upload file.
        var fileClient = client.GetFileClient();
        var uploadedFile = fileClient.UploadFile("./assets/menu.pdf", FileUploadPurpose.Assistants);

        // Attach file to vector store
        var fileAssociation = storeClient.AddFileToVectorStore(store, uploadedFile);

        // Poll vector store until file is uploaded
        var maxPollCount = 5;
        var pollCount = 1;
        while (store.FileCounts.Completed == 0 && pollCount <= maxPollCount)
        {
            // Wait a second
            await Task.Delay(1000);
            store = storeClient.GetVectorStore(store.Id);
            pollCount += 1;
        }

        if (store.FileCounts.Completed == 0)
        {
            throw new Exception("Unable to attach file to vector store. Timed out");
        }
    }
    catch (Exception e)
    {
        throw new Exception("Failed to upload file to vector store.", e.InnerException);
    }
    

    AssistantCreationOptions assistantCreationOptions = new()
    {
        Name = "Order Bot",
        Instructions = string.Join("\n", new[]
        {
            "You are a food ordering bot for a restaurant named The Pub.",
            "The customer can order pizza, beer, or salad.",
            "If the customer doesn't specify the type of pizza, beer, or salad they want ask them.",
            "Verify the order is complete and accurate before placing it with the place_order function."
        }),
        ToolResources = new ToolResources()
        {
            FileSearch = new FileSearchToolResources() { VectorStoreIds = new List<string>() { store.Id } }
        }
    };

    assistantCreationOptions.Tools.Add(new FunctionToolDefinition("place_order", "Creates or updates a food order.", new BinaryData(OrderParameters.GetSchema())));
    assistantCreationOptions.Tools.Add(new FileSearchToolDefinition());

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
builder.Services.AddSingleton(_ => {
    if (apiKey != null)
    {
        return new AssistantsPlannerOptions(apiKey, assistantId, endpoint);
    } else if (tokenCredential != null)
    {
        return new AssistantsPlannerOptions(tokenCredential, assistantId, endpoint);
    } else
    {
        throw new ArgumentException("The `apiKey` or `tokenCredential` needs to be set");
    }
});

// Create the Application.
builder.Services.AddTransient<IBot>(sp =>
{
    ILoggerFactory loggerFactory = sp.GetService<ILoggerFactory>()!;
    IPlanner<AssistantsState> planner = new AssistantsPlanner<AssistantsState>(sp.GetService<AssistantsPlannerOptions>()!, loggerFactory);

    TeamsAdapter adapter = sp.GetService<TeamsAdapter>()!;
    TeamsAttachmentDownloaderOptions fileDownloaderOptions = new(config.BOT_ID!, adapter);

    IInputFileDownloader<AssistantsState> teamsAttachmentDownloader = new TeamsAttachmentDownloader<AssistantsState>(fileDownloaderOptions);

    ApplicationOptions<AssistantsState> applicationOptions = new()
    {
        AI = new AIOptions<AssistantsState>(planner) { AllowLooping = true },
        Storage = sp.GetService<IStorage>(),
        LoggerFactory = loggerFactory,
        FileDownloaders = new List<IInputFileDownloader<AssistantsState>>() { teamsAttachmentDownloader },
        LongRunningMessages = true,
        Adapter = sp.GetService<TeamsAdapter>(),
        BotAppId = config.BOT_ID
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
#pragma warning restore OPENAI001
