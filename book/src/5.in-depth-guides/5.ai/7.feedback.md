# Feedback

If enabled, feedback buttons will be present in messages that allow the user to provide
an indication of whether the message was useful/correct or not. This feature can be used
with LLM's for training.

## Enable Message Feedback

```typescript
app.on('message', async ({ send }) => {
  await send(MessageSendActivity('hi!').addFeedback());
});
```

![Feedback Message](https://github.com/microsoft/teams.ts/blob/main/assets/screenshots/feedback_message.png?raw=true)

## Handling Message Feedback

Return a status: 200 upon receiving `message.submit.feedback`.

```typescript
app.on('message.submit.feedback', ({ log, activity }) => {
  // Your storage logic here...
  log.debug(activity);
  return { status: 200 };
});
```

![Feedback Dialog](https://github.com/microsoft/teams.ts/blob/main/screenshots/feedback_dialog.png?raw=true)
