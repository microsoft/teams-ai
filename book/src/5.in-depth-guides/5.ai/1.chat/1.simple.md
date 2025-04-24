# Simple

A simple prompt for finding the right emojis.

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

const prompt = new ChatPrompt({
  instructions: [
    'you are an assistant that helps find the perfect emoji to use for a given situation.',
    'you will only respond with emojis.',
  ].join('\n'),
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.OPENAI_API_KEY,
    // Optional: pass in azure open ai values
    // if you want to use azure open ai instead of open ai
  }),
});

const generateEmojis = async (message: string) => {
  const res = await prompt.send(message);
  return res?.content ?? 'Unknown'; // 😄🌞🎉
};
```

Somewhere else in the app:

```ts
app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  const emoji = await generateEmojis(activity.text);
  await send(emoji);
});
```
