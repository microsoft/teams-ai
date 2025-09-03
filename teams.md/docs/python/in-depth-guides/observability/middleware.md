---
sidebar_position: 1
summary: Guide to using middleware in C# Teams AI for logging, validation, and extending app functionality.
---

# Middleware

Middleware is a useful tool for logging, validation, and more.
You can easily register your own middleware using the `app.use` method.

Below is an example of a middleware that will log the elapse time of all handers
that come after it.


```typescript
app.use(async ({ log, next }) => {
  const startedAt = new Date();
  await next();
  log.debug(new Date().getTime() - startedAt.getTime());
});
```

