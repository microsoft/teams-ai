# 👂 Listening To Message Activities

You can listen/subscribe to messages using static text or `Regexp`. This is a shorthand for `app.on('message')` activity handler, where it will only trigger the handler if it matches the pattern you have provided. These types of handlers are common enough that we have provided a shorthand for them.

> Example: when the user sends a message to the bot with the text `/logout`
> we send a message back.

```typescript
app.message('/logout', async ({ activity, send, signout }) => {
  await send("ok, I'll sign you out!");
  await signout();
});
```
