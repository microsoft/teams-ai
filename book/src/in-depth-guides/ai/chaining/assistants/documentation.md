# Documentation

The assistant that specializes in documentation searching.

```bash
src
├── prompts
│   ├── project.ts
│   ├── documentation.ts
│   └── typescript.ts
└── developer.ts
```

## `/src/prompts/documentation.ts`

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

export const documentation = new ChatPrompt({
  instructions: [
    'you are an expert at searching documentation.',
    'you help other developers perform various searches to understand how to use internal packages.',
  ].join('\n'),
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.OPENAI_API_KEY,
  }),
}).function(
  'search',
  'search the documentation for relevant information',
  {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'the text to search',
      },
    },
    required: ['text'],
  },
  async ({ text }: { text: string }) => {
    // vector search and return nearest neighbors
  }
);
```
