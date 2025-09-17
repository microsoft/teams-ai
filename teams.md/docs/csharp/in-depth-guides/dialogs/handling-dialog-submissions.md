---
sidebar_position: 2
summary: Guide to processing dialog submissions in Teams applications, showing how to handle form data from both Adaptive Cards and web pages using the dialog.submit event handler with examples for different submission types.
---

# Handling Dialog Submissions

Dialogs have a specific `TaskSubmit` event to handle submissions. When a user submits a form inside a dialog, the app is notified via this event, which is then handled to process the submission values, and can either send a response or proceed to more steps in the dialogs (see [Multi-step Dialogs](./handling-multi-step-forms)).

In this example, we show how to handle dialog submissions from an Adaptive Card form:

```csharp
[TaskSubmit]
public async Task<Microsoft.Teams.Api.TaskModules.Response> OnTaskSubmit([Context] Tasks.SubmitActivity activity, [Context] IContext.Client client, [Context] ILogger log)
{
    var data = activity.Value?.Data as JsonElement?;
    if (data == null)
    {
        log.Info("[TASK_SUBMIT] No data found in the activity value");
        return new Response(new MessageTask("No data found in the activity value"));
    }

    var submissionType = data.Value.TryGetProperty("submissiondialogtype", out var submissionTypeObj) && submissionTypeObj.ValueKind == JsonValueKind.String
        ? submissionTypeObj.ToString()
        : null;


    string? GetFormValue(string key)
    {
        if (data.Value.TryGetProperty(key, out var val))
        {
            if (val is JsonElement element)
                return element.GetString();
            return val.ToString();
        }
        return null;
    }

    switch (submissionType)
    {
        case "simple_form":
            var name = GetFormValue("name") ?? "Unknown";
            await client.Send($"Hi {name}, thanks for submitting the form!");
            return new Response(new MessageTask("Form was submitted"));
        // More examples below        
        default:
            return new Response(new MessageTask("Unknown submission type"));
    }
}
```

Similarly, handling dialog submissions from rendered webpages is also possible:

```csharp
// Add this case to the switch statement in OnTaskSubmit method
case "webpage_dialog":
    var webName = GetFormValue("name") ?? "Unknown";
    var email = GetFormValue("email") ?? "No email";
    await client.Send($"Hi {webName}, thanks for submitting the form! We got that your email is {email}");
    return new Response(new MessageTask("Form submitted successfully"));
```

### Complete TaskSubmit Handler Example

Here's the complete example showing how to handle multiple submission types:

```csharp
[TaskSubmit]
public async Task<Microsoft.Teams.Api.TaskModules.Response> OnTaskSubmit([Context] Tasks.SubmitActivity activity, [Context] IContext.Client client, [Context] ILogger log)
{
    var data = activity.Value?.Data as JsonElement?;
    if (data == null)
    {
        log.Info("[TASK_SUBMIT] No data found in the activity value");
        return new Response(new MessageTask("No data found in the activity value"));
    }

    var submissionType = data.Value.TryGetProperty("submissiondialogtype", out var submissionTypeObj) && submissionTypeObj.ValueKind == JsonValueKind.String
        ? submissionTypeObj.ToString()
        : null;

    string? GetFormValue(string key)
    {
        if (data.Value.TryGetProperty(key, out var val))
        {
            if (val is JsonElement element)
                return element.GetString();
            return val.ToString();
        }
        return null;
    }

    switch (submissionType)
    {
        case "simple_form":
            var name = GetFormValue("name") ?? "Unknown";
            await client.Send($"Hi {name}, thanks for submitting the form!");
            return new Response(new MessageTask("Form was submitted"));

        case "webpage_dialog":
            var webName = GetFormValue("name") ?? "Unknown";
            var email = GetFormValue("email") ?? "No email";
            await client.Send($"Hi {webName}, thanks for submitting the form! We got that your email is {email}");
            return new Response(new MessageTask("Form submitted successfully"));

        default:
            return new Response(new MessageTask("Unknown submission type"));
    }
}
```
