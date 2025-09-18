---
sidebar_position: 1
summary: Learn how to create action commands for message extensions that present modal dialogs to collect or display information in Teams.
---

# Action commands

Action commands allow you to present your users with a modal pop-up called a dialog in Teams. The dialog collects or displays information, processes the interaction, and sends the information back to Teams compose box.

## Action command invocation locations

There are three different areas action commands can be invoked from:

1. Compose Area
2. Compose Box
3. Message

### Compose Area and Box

![compose area and box](/screenshots/compose-area.png)

### Message action command

![message action command](/screenshots/message.png)

:::tip
See the [Invoke Locations](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/action-commands/define-action-command?tabs=Teams-toolkit%2Cdotnet#select-action-command-invoke-locations) guide to learn more about the different entry points for action commands.
:::

## Setting up your Teams app manifest

To use action commands you have define them in the Teams app manifest. Here is an example:


```json
"composeExtensions": [
    {
        "botId": "${{BOT_ID}}",
        "commands": [
            {
            "id": "createCard",
            "type": "action",
            "context": [
                "compose",
                "commandBox"
            ],
            "description": "Command to run action to create a card from the compose box.",
            "title": "Create Card",
            "parameters": [
                {
                    "name": "title",
                    "title": "Card title",
                    "description": "Title for the card",
                    "inputType": "text"
                },
                {
                    "name": "subTitle",
                    "title": "Subtitle",
                    "description": "Subtitle for the card",
                    "inputType": "text"
                },
                {
                    "name": "text",
                    "title": "Text",
                    "description": "Text for the card",
                    "inputType": "textarea"
                }
            ]
            },
            {
                "id": "getMessageDetails",
                "type": "action",
                "context": [
                    "message"
                ],
                "description": "Command to run action on message context.",
                "title": "Get Message Details"
            },
            {
                "id": "fetchConversationMembers",
                "description": "Fetch the conversation members",
                "title": "Fetch Conversation Members",
                "type": "action",
                "fetchTask": true,
                "context": [
                    "compose"
                ]
            },
        ]
    }
]
```


Here we are defining three different commands:

1. `createCard` - that can be invoked from either the `compose` or `commandBox` areas. Upon invocation a dialog will popup asking the user to fill the `title`, `subTitle`, and `text`.

![Parameters](/screenshots/parameters.png)

2. `getMessageDetails` - It is invoked from the `message` overflow menu. Upon invocation the message payload will be sent to the app which will then return the details like `createdDate`...etc.

![Get Message Details Command](/screenshots/message-command.png)

3. `fetchConversationMembers` - It is invoked from the `compose` area. Upon invocation the app will return an adaptive card in the form of a dialog with the conversation roster.

![Fetch conversation members](/screenshots/fetch-conversation-members.png)

## Handle submission

Handle submission when the `createCard` or `getMessageDetails` actions commands are invoked.

```csharp
using System.Text.Json;
using Microsoft.Teams.Api.Cards;
using Microsoft.Teams.Cards;

[MessageExtension.SubmitAction]
public Microsoft.Teams.Api.MessageExtensions.Response OnMessageExtensionSubmit(
    [Context] Microsoft.Teams.Api.Activities.Invokes.MessageExtensions.SubmitActionActivity activity,
    [Context] IContext.Client client,
    [Context] Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info("[MESSAGE_EXT_SUBMIT] Action submit received");

    var commandId = activity.Value?.CommandId;
    var data = activity.Value?.Data as JsonElement?;

    log.Info($"[MESSAGE_EXT_SUBMIT] Command: {commandId}");
    log.Info($"[MESSAGE_EXT_SUBMIT] Data: {JsonSerializer.Serialize(data)}");

    switch (commandId)
    {
        case "createCard":
            return HandleCreateCard(data, log);

        case "getMessageDetails":
            return HandleGetMessageDetails(activity, log);

        default:
            log.Error($"[MESSAGE_EXT_SUBMIT] Unknown command: {commandId}");
            return CreateErrorActionResponse("Unknown command");
    }
}
```

`HandleCreateCard()` method

```csharp
private static Microsoft.Teams.Api.MessageExtensions.Response HandleCreateCard(JsonElement? data, Microsoft.Teams.Common.Logging.ILogger log)
{
    var title = GetJsonValue(data, "title") ?? "Default Title";
    var description = GetJsonValue(data, "description") ?? "Default Description";

    log.Info($"[CREATE_CARD] Title: {title}, Description: {description}");

    var card = new Microsoft.Teams.Cards.AdaptiveCard
    {
        Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
        Body = new List<CardElement>
        {
            new TextBlock("Custom Card Created")
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Large,
                Color = TextColor.Good
            },
            new TextBlock(title)
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Medium
            },
            new TextBlock(description)
            {
                Wrap = true,
                IsSubtle = true
            }
        }
    };

    var attachment = new Microsoft.Teams.Api.MessageExtensions.Attachment
    {
        ContentType = Microsoft.Teams.Api.ContentType.AdaptiveCard,
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

`HandleGetMessageDetails()` method

```csharp
private static Microsoft.Teams.Api.MessageExtensions.Response HandleGetMessageDetails(Microsoft.Teams.Api.Activities.Invokes.MessageExtensions.SubmitActionActivity activity, Microsoft.Teams.Common.Logging.ILogger log)
{
    var messageText = activity.Value?.MessagePayload?.Body?.Content ?? "No message content";
    var messageId = activity.Value?.MessagePayload?.Id ?? "Unknown";

    log.Info($"[GET_MESSAGE_DETAILS] Message ID: {messageId}");

    var card = new Microsoft.Teams.Cards.AdaptiveCard
    {
        Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
        Body = new List<CardElement>
        {
            new TextBlock("Message Details")
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Large,
                Color = TextColor.Accent
            },
            new TextBlock($"Message ID: {messageId}")
            {
                Wrap = true
            },
            new TextBlock($"Content: {messageText}")
            {
                Wrap = true
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


## Handle opening adaptive card dialog

Handle opening adaptive card dialog when the `fetchConversationMembers` command is invoked.

```csharp
[MessageExtension.FetchTask]
public async Task<Microsoft.Teams.Api.MessageExtensions.ActionResponse> OnMessageExtensionFetchTask(
    [Context] Microsoft.Teams.Api.Activities.Invokes.MessageExtensions.FetchTaskActivity activity,
    [Context] Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info("[MESSAGE_EXT_FETCH_TASK] Fetch task received");

    var commandId = activity.Value?.CommandId;
    log.Info($"[MESSAGE_EXT_FETCH_TASK] Command: {commandId}");

    return CreateFetchTaskResponse(commandId, log);
}
```

`CreateFetchTaskResponse()` method

```csharp
private static Microsoft.Teams.Api.MessageExtensions.ActionResponse CreateFetchTaskResponse(string? commandId, Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info($"[CREATE_FETCH_TASK] Creating task for command: {commandId}");

    // Create an adaptive card for the task module
    var card = new Microsoft.Teams.Cards.AdaptiveCard
    {
        Body = new List<CardElement>
        {
            new TextBlock("Conversation Members is not implemented in C# yet :(")
            {
                Weight = TextWeight.Bolder,
                Color = TextColor.Accent
            },
        }
    };

    return new Microsoft.Teams.Api.MessageExtensions.ActionResponse
    {
        Task = new Microsoft.Teams.Api.TaskModules.ContinueTask(new Microsoft.Teams.Api.TaskModules.TaskInfo
        {
            Title = "Fetch Task Dialog",
            Height = new Microsoft.Teams.Common.Union<int, Microsoft.Teams.Api.TaskModules.Size>(Microsoft.Teams.Api.TaskModules.Size.Small),
            Width = new Microsoft.Teams.Common.Union<int, Microsoft.Teams.Api.TaskModules.Size>(Microsoft.Teams.Api.TaskModules.Size.Small),
            Card = new Microsoft.Teams.Api.Attachment(card)
        })
    };
}

// Helper method to extract JSON values
private static string? GetJsonValue(JsonElement? data, string key)
{
    if (data?.ValueKind == JsonValueKind.Object && data.Value.TryGetProperty(key, out var value))
    {
        return value.GetString();
    }
    return null;
}

// Helper method to create error responses
private static Microsoft.Teams.Api.MessageExtensions.Response CreateErrorActionResponse(string message)
{
    return new Microsoft.Teams.Api.MessageExtensions.Response
    {
        ComposeExtension = new Microsoft.Teams.Api.MessageExtensions.Result
        {
            Type = Microsoft.Teams.Api.MessageExtensions.ResultType.Message,
            Text = message
        }
    };
}
```

## Resources

- [Action commands](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/action-commands/define-action-command?tabs=Teams-toolkit%2Cdotnet)
- [Returning Adaptive Card Previews in Task Modules](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/action-commands/respond-to-task-module-submit?tabs=dotnet%2Cdotnet-1#bot-response-with-adaptive-card)