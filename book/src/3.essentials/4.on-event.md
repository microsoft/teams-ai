# 👂 Listening To Events

To listen/subscribe to different event types, you can use the `event()` method.
Handlers will be called in the order they are added.

> Example: We subscribe to errors that occur in the app.

```typescript
app.event('error', ({ err, log }) => {
  log.error(err);
});
```

> Example: When a user signs in using `OAuth` or `SSO`, use the graph api to
> fetch their profile and say hello.

```typescript
app.event('signin', async ({ activity, send, api }) => {
  const me = await api.user.me.get();
  await send(`👋 Hello ${me.name}`);
});
```
