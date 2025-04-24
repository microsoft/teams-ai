# Functions

Now lets add GIF support via function calling...

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

interface PokemonSearch {
  pokemonName: string;
}

const prompt = new ChatPrompt({
  instructions: ['You are a helpful assistant that can look up Pokemon for the user.'].join('\n'),
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
  }),
}).function(
  'pokemonSearch',
  'search for pokemon',
  {
    type: 'object',
    properties: {
      pokemonName: {
        type: 'string',
        description: 'the name of the pokemon',
      },
    },
    required: ['text'],
  },
  async ({ pokemonName }: PokemonSearch) => {
    console.log('Searching for pokemon', pokemonName);
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!response.ok) {
      throw new Error('Pokemon not found');
    }
    const data = await response.json();
    return {
      name: data.name,
      height: data.height,
      weight: data.weight,
      types: data.types.map((type: { type: { name: string } }) => type.type.name),
    };
  }
);
```

Somewhere else in your app:

```typescript
app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const result = await prompt.send(activity.text);
  await send(result.content ?? 'Sorry I could not find that pokemon');
});
```
