---
sidebar_position: 2
summary: Create search commands that allow users to search external systems and insert results as cards in Teams messages.
---

# 🔍 Search commands

Message extension search commands allow users to search external systems and insert the results of that search into a message in the form of a card.

## Search command invocation locations

There are three different areas search commands can be invoked from:

1. Compose Area
2. Compose Box

### Compose Area and Box

![compose area and box](/screenshots/compose-area.png)

## Setting up your Teams app manifest

To use search commands you have define them in the Teams app manifest. Here is an example:


```json
"composeExtensions": [
    {
        "botId": "${{BOT_ID}}",
        "commands": [
            {
                "id": "searchQuery",
                "context": [
                    "compose",
                    "commandBox"
                ],
                "description": "Test command to run query",
                "title": "Search query",
                "type": "query",
                "parameters": [
                    {
                        "name": "searchQuery",
                        "title": "Search Query",
                        "description": "Your search query",
                        "inputType": "text"
                    }
                ]
            }
        ]
    }
]
```


Here we are defining the `searchQuery` search (or query) command.

## Handle submission

Handle query submission when the `searchQuery` search command is invoked.

```csharp
using System.Text.Json;
using Microsoft.Teams.Api.Cards;
using Microsoft.Teams.Cards;

[MessageExtension.Query]
public Microsoft.Teams.Api.MessageExtensions.Response OnMessageExtensionQuery(
    [Context] Microsoft.Teams.Api.Activities.Invokes.MessageExtensions.QueryActivity activity,
    [Context] IContext.Client client,
    [Context] Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info("[MESSAGE_EXT_QUERY] Search query received");

    var commandId = activity.Value?.CommandId;
    var query = activity.Value?.Parameters?.FirstOrDefault(p => p.Name == "searchQuery")?.Value?.ToString() ?? "";

    log.Info($"[MESSAGE_EXT_QUERY] Command: {commandId}, Query: {query}");

    if (commandId == "searchQuery")
    {
        return CreateSearchResults(query, log);
    }

    return new Microsoft.Teams.Api.MessageExtensions.Response
    {
        ComposeExtension = new Microsoft.Teams.Api.MessageExtensions.Result
        {
            Type = Microsoft.Teams.Api.MessageExtensions.ResultType.Result,
            AttachmentLayout = Microsoft.Teams.Api.Attachment.Layout.List,
            Attachments = new List<Microsoft.Teams.Api.MessageExtensions.Attachment>()
        }
    };
}
```

`CreateSearchResults()` method

```csharp
private static Microsoft.Teams.Api.MessageExtensions.Response CreateSearchResults(string query, Microsoft.Teams.Common.Logging.ILogger log)
{
    var attachments = new List<Microsoft.Teams.Api.MessageExtensions.Attachment>();

    // Create simple search results
    for (int i = 1; i <= 5; i++)
    {
        var card = new Microsoft.Teams.Cards.AdaptiveCard
        {
            Body = new List<CardElement>
            {
                new TextBlock($"Search Result {i}")
                {
                    Weight = TextWeight.Bolder,
                    Size = TextSize.Large
                },
                new TextBlock($"Query: '{query}' - Result description for item {i}")
                {
                    Wrap = true,
                    IsSubtle = true
                }
            }
        };

        var previewCard = new ThumbnailCard()
        {
            Title = $"Result {i}",
            Text = $"This is a preview of result {i} for query '{query}'."
        };

        var attachment = new Microsoft.Teams.Api.MessageExtensions.Attachment
        {
            ContentType = Microsoft.Teams.Api.ContentType.AdaptiveCard,
            Content = card,
            Preview = new Microsoft.Teams.Api.MessageExtensions.Attachment
            {
                ContentType = Microsoft.Teams.Api.ContentType.ThumbnailCard,
                Content = previewCard
            }
        };

        attachments.Add(attachment);
    }

    return new Microsoft.Teams.Api.MessageExtensions.Response
    {
        ComposeExtension = new Microsoft.Teams.Api.MessageExtensions.Result
        {
            Type = Microsoft.Teams.Api.MessageExtensions.ResultType.Result,
            AttachmentLayout = Microsoft.Teams.Api.Attachment.Layout.List,
            Attachments = attachments
        }
    };
}
```

The search results include both a full adaptive card and a preview card. The preview card appears as a list item in the search command area:

![Search command preview card](/screenshots/preview-card.png)

When a user clicks on a list item the dummy adaptive card is added to the compose box:

![Card in compose box](/screenshots/card-in-compose.png)

To implement custom actions when a user clicks on a search result item, you can handle the select item event:

```csharp
[MessageExtension.SelectItem]
public Microsoft.Teams.Api.MessageExtensions.Response OnMessageExtensionSelectItem(
    [Context] Microsoft.Teams.Api.Activities.Invokes.MessageExtensions.SelectItemActivity activity,
    [Context] IContext.Client client,
    [Context] Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info("[MESSAGE_EXT_SELECT_ITEM] Item selection received");

    var selectedItem = activity.Value;
    log.Info($"[MESSAGE_EXT_SELECT_ITEM] Selected: {JsonSerializer.Serialize(selectedItem)}");

    return CreateItemSelectionResponse(selectedItem, log);
}

// Helper method to create item selection response
private static Microsoft.Teams.Api.MessageExtensions.Response CreateItemSelectionResponse(object? selectedItem, Microsoft.Teams.Common.Logging.ILogger log)
{
    var itemJson = JsonSerializer.Serialize(selectedItem);

    var card = new Microsoft.Teams.Cards.AdaptiveCard
    {
        Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
        Body = new List<CardElement>
        {
            new TextBlock("Item Selected")
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Large,
                Color = TextColor.Good
            },
            new TextBlock("You selected the following item:")
            {
                Wrap = true
            },
            new TextBlock(itemJson)
            {
                Wrap = true,
                FontType = FontType.Monospace,
                Separator = true
            }
        }
    };

    var attachment = new Microsoft.Teams.Api.MessageExtensions.Attachment
    {
        ContentType = new Microsoft.Teams.Api.ContentType("application/vnd.microsoft.card.adaptive"),
        Content = card
    };

    return new Microsoft.Teams.Api.MessageExtensions.Response
    {
        ComposeExtension = new Microsoft.Teams.Api.MessageExtensions.Result
        {
            Type = Microsoft.Teams.Api.MessageExtensions.ResultType.Result,
            AttachmentLayout = Microsoft.Teams.Api.Attachment.Layout.List,
            Attachments = new List<Microsoft.Teams.Api.MessageExtensions.Attachment> { attachment }
        }
    };
}
```

## Resources

- [Search command](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/search-commands/define-search-command?tabs=Teams-toolkit%2Cdotnet)
- [Just-In-Time Install](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/search-commands/universal-actions-for-search-based-message-extensions#just-in-time-install)