## Proactive Messaging

In [Sending Activities](./3.sending-activities.md), we show how we can respond to an event when it happens. However, there are times when you want to send a message to the user without them sending a message first. This is called proactive messaging. You can do this by using the `send` method in the `app` instance. This is useful for sending notifications or reminders to the user.

The main thing to note is that you need to have the `conversationId` of the chat or channel you want to send the message to. It's a good idea to store this value somewhere from an activity handler so you can use it for proactive messaging later.

```typescript
app.on('message', async ({ activity, send }) => {
  const conversationId = activity.conversation.id;

  // Store the conversation id somewhere
  await myStorage.save(conversationId);
});
```

Then, when you want to send a proactive message, you can retrieve the `conversationId` from storage and use it to send the message.

```typescript
const conversationId = await myStorage.getConversationId();
await app.send(conversationId, "Don't forget to eat your vegetables!");
```

> [!TIP]
> In this example, we show that we get the conversation id using a `message` event. However, there are many other types of events that can be used to get conversation ids, including `conversationUpdate`, `installUpdate`, and `invoke` events. You can also use the `conversationId` from the activity object in the `activity` event handler (`app.event('activity', ...)`)
