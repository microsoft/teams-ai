# Streaming

> [!NOTE]
> Currently, streaming in Teams is only supported in the personal scope, not group chats or channels.

Now lets add streaming support...

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

const prompt = new ChatPrompt({
  instructions: 'You are a helpful assistant who talks like a pirate.',
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
  }),
});
```

Somewhere else in your app:

```typescript
app.on('message', async ({ send, stream, activity }) => {
  await prompt.send(activity.text, {
    // Passing in an onChunk handler automatically enables streaming
    onChunk: (chunk) => {
      stream.emit(chunk);
    },
  });
});
```
