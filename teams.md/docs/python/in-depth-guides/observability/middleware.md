---
sidebar_position: 1
summary: Guide to using middleware in Python Teams AI for logging, validation, and extending app functionality.
---

# Middleware

Middleware is a useful tool for logging, validation, and more.
You can easily register your own middleware using the `app.use` method.

Below is an example of a middleware that will log the elapse time of all handers that come after it.


```python
@app.use
async def log_activity(ctx: ActivityContext[MessageActivity]):
    started_at = datetime.now()
    await ctx.next()
    ctx.logger.debug(f"{datetime.now() - started_at}")
```

