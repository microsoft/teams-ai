using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.State;
using MessageExtensionAuth;
using MessageExtensionAuth.Model;
using Microsoft.Bot.Schema;
using AdaptiveCards.Templating;
using AdaptiveCards;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

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
builder.Services.AddSingleton<CloudAdapter, AdapterWithErrorHandler>();
builder.Services.AddSingleton<IBotFrameworkHttpAdapter>(sp => sp.GetService<CloudAdapter>()!);
builder.Services.AddSingleton<BotAdapter>(sp => sp.GetService<CloudAdapter>()!);

// Create singleton instances for bot application
builder.Services.AddSingleton<IStorage, MemoryStorage>();

builder.Services.AddSingleton<Utilities>();

// Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
builder.Services.AddTransient<IBot>(sp =>
{
    IStorage storage = sp.GetService<IStorage>()!;
    ApplicationOptions<TurnState> applicationOptions = new()
    {
        Storage = storage,
        Authentication = new AuthenticationOptions<TurnState>(
            new Dictionary<string, IAuthentication<TurnState>>()
            {
                { "graph", new OAuthAuthentication<TurnState>(new OAuthSettings()
                    {
                        ConnectionName = config.OAUTH_CONNECTION_NAME
                    }
                )}
            }
        )
    };

    Application<TurnState> app = new(applicationOptions);

    Utilities utilities = sp.GetService<Utilities>()!;

    string packageCardFilePath = Path.Combine(".", "Resources", "PackageCard.json");

    // Listen for search actions
    app.MessageExtensions.OnQuery("searchCmd", async (ITurnContext turnContext, TurnState turnState, Query<Dictionary<string, object>> query, CancellationToken cancellationToken) =>
    {
        string text = (string)query.Parameters["queryText"];
        int count = query.Count;

        if (text == "profile")
        {
            string token = turnState.Temp.AuthTokens["graph"];
            if (string.IsNullOrEmpty(token))
            {
                throw new Exception("No auth token found in state. Authentication failed.");
            }

            SimpleGraphClient client = new SimpleGraphClient(token);

            var profile = await client.GetMyProfile();
            var photoUri = await client.GetMyPhoto();

            ThumbnailCard heroCard = new ThumbnailCard
            {
                Text = $"{profile.DisplayName}",
                Images = new List<CardImage> { new CardImage(photoUri) },
            };

            MessagingExtensionAttachment attachment = new MessagingExtensionAttachment(HeroCard.ContentType, null, heroCard);
            MessagingExtensionResult result = new MessagingExtensionResult("list", "result", new[] { attachment });

            return result;
        }

        Package[] packages = await utilities.SearchPackages(text, count, cancellationToken);

        // Format search results
        List<MessagingExtensionAttachment> attachments = packages.Select(package => new MessagingExtensionAttachment
        {
            ContentType = HeroCard.ContentType,
            Content = new HeroCard
            {
                Title = package.Id,
                Text = package.Description
            },
            Preview = new HeroCard
            {
                Title = package.Id,
                Text = package.Description,
                Tap = new CardAction
                {
                    Type = "invoke",
                    Value = package
                }
            }.ToAttachment()
        }).ToList();

        return new MessagingExtensionResult
        {
            Type = "result",
            AttachmentLayout = "list",
            Attachments = attachments
        };
    });

    // Listen for item tap
    app.MessageExtensions.OnSelectItem(async (ITurnContext turnContext, TurnState turnState, object item, CancellationToken cancellationToken) =>
    {
        JObject? obj = item as JObject;
        CardPackage package = CardPackage.Create(obj!.ToObject<Package>()!);
        string cardTemplate = await File.ReadAllTextAsync(packageCardFilePath, cancellationToken)!;
        string cardContent = new AdaptiveCardTemplate(cardTemplate).Expand(package);
        MessagingExtensionAttachment attachment = new()
        {
            ContentType = AdaptiveCard.ContentType,
            Content = JsonConvert.DeserializeObject(cardContent)
        };

        return new MessagingExtensionResult
        {
            Type = "result",
            AttachmentLayout = "list",
            Attachments = new List<MessagingExtensionAttachment> { attachment }
        };
    });

    // Handles when the user clicks the Messaging Extension "Sign Out" command.
    app.MessageExtensions.OnFetchTask("signOutCommand", async (context, state, cancellationToken) =>
    {
        if (app.Authentication != null)
        {
            await app.Authentication.SignOutUserAsync(context, state, cancellationToken: cancellationToken);
        }

        return new TaskModuleResponse
        {
            Task = new TaskModuleContinueResponse
            {
                Value = new TaskModuleTaskInfo
                {
                    Card = new Attachment
                    {
                        Content = new AdaptiveCard(new AdaptiveSchemaVersion("1.0"))
                        {
                            Body = new List<AdaptiveElement>() { new AdaptiveTextBlock() { Text = "You have been signed out." } },
                            Actions = new List<AdaptiveAction>() { new AdaptiveSubmitAction() { Title = "Close" } },
                        },
                        ContentType = AdaptiveCard.ContentType,
                    },
                    Height = 200,
                    Width = 400,
                    Title = "Adaptive Card: Inputs",
                },
            }
        };
    });

    // Handles the 'Close' button on the confirmation Task Module after the user signs out.
    app.MessageExtensions.OnSubmitAction("signOutCommand", (context, state, data, cancellationToken) =>
    {
        return Task.FromResult(new MessagingExtensionActionResponse());
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
