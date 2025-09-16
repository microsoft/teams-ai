---
sidebar_position: 2
summary: Guide to implementing interactive elements in Adaptive Cards using C#, covering action types (Execute, Submit, OpenUrl), input validation, data association, and server-side handling of card actions.
---

# Executing Actions

Adaptive Cards support interactive elements through **actions**—buttons, links, and input submission triggers that respond to user interaction.  
You can use these to collect form input, trigger workflows, show task modules, open URLs, and more.

---

## Action Types

The Teams AI Library supports several action types for different interaction patterns:

| Action Type               | Purpose                | Description                                                                  |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `Action.Execute`          | Server‑side processing | Send data to your bot for processing. Best for forms & multi‑step workflows. |
| `Action.Submit`           | Simple data submission | Legacy action type. Prefer `Execute` for new projects.                       |
| `Action.OpenUrl`          | External navigation    | Open a URL in the user's browser.                                            |
| `Action.ShowCard`         | Progressive disclosure | Display a nested card when clicked.                                          |
| `Action.ToggleVisibility` | UI state management    | Show/hide card elements dynamically.                                         |

> For complete reference, see the [official documentation](https://adaptivecards.microsoft.com/?topic=Action.Execute).

---

## Creating Actions with the SDK

### Single Actions

The SDK provides builder helpers that abstract the underlying JSON. For example:

```csharp
using Microsoft.Teams.Cards;

var action = new ExecuteAction
{
    Title = "Submit Feedback",
    Data = new Union<string, SubmitActionData>(new SubmitActionData 
    { 
        NonSchemaProperties = new Dictionary<string, object?> 
        { 
            { "action", "submit_feedback" } 
        } 
    }),
    AssociatedInputs = AssociatedInputs.Auto
};
```

### Action Sets

Group actions together by adding them to the card's Actions collection:

```csharp
using Microsoft.Teams.Cards;

var card = new AdaptiveCard
{
    Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
    Actions = new List<Microsoft.Teams.Cards.Action>
    {
        new ExecuteAction
        {
            Title = "Submit Feedback",
            Data = new Union<string, SubmitActionData>(new SubmitActionData 
            { 
                NonSchemaProperties = new Dictionary<string, object?> 
                { 
                    { "action", "submit_feedback" } 
                } 
            })
        },
        new OpenUrlAction("https://adaptivecards.microsoft.com")
        {
            Title = "Learn More"
        }
    }
};
```

### Raw JSON Alternative

Just like when building cards, if you prefer to work with raw JSON, you can do just that. You get type safety for free in C#.

```csharp
var actionJson = """
{
  "type": "Action.OpenUrl",
  "url": "https://adaptivecards.microsoft.com",
  "title": "Learn More"
}
""";
```

---

## Working with Input Values

### Associating data with the cards

Sometimes you want to send a card and have it be associated with some data. Set the `data` value to be sent back to the client so you can associate it with a particular entity.

```csharp
private static AdaptiveCard CreateProfileCard()
{
    return new AdaptiveCard
    {
        Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
        Body = new List<CardElement>
        {
            new TextBlock("User Profile")
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Large
            },
            new TextInput
            {
                Id = "name",
                Label = "Name",
                Value = "John Doe"
            },
            new TextInput
            {
                Id = "email",
                Label = "Email",
                Value = "john@contoso.com"
            },
            new ToggleInput("Subscribe to newsletter")
            {
                Id = "subscribe",
                Value = "false"
            }
        },
        Actions = new List<Microsoft.Teams.Cards.Action>
        {
            new ExecuteAction
            {
                Title = "Save",
                // entity_id will come back after the user submits
                Data = new Union<string, SubmitActionData>(new SubmitActionData 
                { 
                    NonSchemaProperties = new Dictionary<string, object?> 
                    { 
                        { "action", "save_profile" }, 
                        { "entity_id", "12345" } 
                    } 
                }),
                AssociatedInputs = AssociatedInputs.Auto
            },
            new OpenUrlAction("https://adaptivecards.microsoft.com")
            {
                Title = "Learn More"
            }
        }
    };
}
```

### Input Validation

Input Controls provide ways for you to validate. More details can be found on the Adaptive Cards [documentation](https://adaptivecards.microsoft.com/?topic=input-validation).

```csharp
private static AdaptiveCard CreateProfileCardWithValidation()
{
    return new AdaptiveCard
    {
        Schema = "http://adaptivecards.io/schemas/adaptive-card.json",
        Body = new List<CardElement>
        {
            new TextBlock("Profile with Validation")
            {
                Weight = TextWeight.Bolder,
                Size = TextSize.Large
            },
            new NumberInput
            {
                Id = "age",
                Label = "Age",
                IsRequired = true,
                Min = 0,
                Max = 120
            },
            // Can configure custom error messages
            new TextInput
            {
                Id = "name",
                Label = "Name",
                IsRequired = true,
                ErrorMessage = "Name is required"
            },
            new TextInput
            {
                Id = "location",
                Label = "Location"
            }
        },
        Actions = new List<Microsoft.Teams.Cards.Action>
        {
            new ExecuteAction
            {
                Title = "Save",
                // All inputs should be validated
                Data = new Union<string, SubmitActionData>(new SubmitActionData 
                { 
                    NonSchemaProperties = new Dictionary<string, object?> 
                    { 
                        { "action", "save_profile" } 
                    } 
                }),
                AssociatedInputs = AssociatedInputs.Auto
            }
        }
    };
}
```

## Server Handlers

### Basic Structure

Card actions arrive as `AdaptiveCard.Action` activities in your app. These give you access to the validated input values plus any `data` values you had configured to be sent back to you.

```csharp
[Microsoft.Teams.Apps.Activities.Invokes.AdaptiveCard.Action]
public async Task<ActionResponse> OnCardAction([Context] AdaptiveCards.ActionActivity activity, [Context] IContext.Client client, [Context] Microsoft.Teams.Common.Logging.ILogger log)
{
    log.Info("[CARD_ACTION] Card action received");

    var data = activity.Value?.Action?.Data;

    if (data == null)
    {
        log.Error("[CARD_ACTION] No data in card action");
        return new ActionResponse.Message("No data specified") { StatusCode = 400 };
    }

    // Extract action from the Value property
    string? action = data.TryGetValue("action", out var actionObj) ? actionObj?.ToString() : null;

    if (string.IsNullOrEmpty(action))
    {
        log.Error("[CARD_ACTION] No action specified in card data");
        return new ActionResponse.Message("No action specified") { StatusCode = 400 };
    }

    log.Info($"[CARD_ACTION] Processing action: {action}");

    // Helper method to extract form field values
    string? GetFormValue(string key)
    {
        if (data.TryGetValue(key, out var val))
        {
            if (val is System.Text.Json.JsonElement element)
                return element.GetString();
            return val?.ToString();
        }
        return null;
    }

    switch (action)
    {
        case "submit_feedback":
            var feedbackText = GetFormValue("feedback") ?? "No feedback provided";
            await client.Send($"Feedback received: {feedbackText}");
            break;

        case "save_profile":
            var name = GetFormValue("name") ?? "Unknown";
            var email = GetFormValue("email") ?? "No email";
            var subscribe = GetFormValue("subscribe") ?? "false";
            var age = GetFormValue("age");
            var location = GetFormValue("location") ?? "Not specified";

            var response = $"Profile saved!\nName: {name}\nEmail: {email}\nSubscribed: {subscribe}";
            if (!string.IsNullOrEmpty(age))
                response += $"\nAge: {age}";
            if (location != "Not specified")
                response += $"\nLocation: {location}";

            await client.Send(response);
            break;

        case "create_task":
            var title = GetFormValue("title") ?? "Untitled";
            var priority = GetFormValue("priority") ?? "medium";
            var dueDate = GetFormValue("due_date") ?? "No date";
            await client.Send($"Task created!\nTitle: {title}\nPriority: {priority}\nDue: {dueDate}");
            break;

        default:
            log.Error($"[CARD_ACTION] Unknown action: {action}");
            return new ActionResponse.Message("Unknown action") { StatusCode = 400 };
    }

    return new ActionResponse.Message("Action processed successfully") { StatusCode = 200 };
}
```