---
sidebar_position: 1
summary: Guide to using middleware in C# Teams AI for logging, validation, and extending app functionality.
---

# Middleware

Middleware is a useful tool for logging, validation, and more.
You can easily register your own middleware using the `app.Use` method.

Below is an example of a middleware that will capture exceptions and log the elapse time of all handlers that come after it.


```csharp
app.Use(async context =>
{
    var start = DateTime.UtcNow;
    try
    {
        await context.Next();
    } catch
    {
        context.Log.Error("error occurred during activity processing");
    }
    context.Log.Debug($"request took {(DateTime.UtcNow - start).TotalMilliseconds}ms");
});
```

