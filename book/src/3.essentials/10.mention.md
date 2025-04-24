# @Mention

Sending a message at `@mentions` a user is as simple as:

```typescript
app.on('message', async ({ send, activity }) => {
  await send(MessageSendActivity('hi!').mention(activity.from));
});
```
