# Typescript

The assistant that specializes in Typescript syntax/error knowledge.

<!-- langtabs-start -->
```bash
src
├── prompts
│   ├── project.ts
│   ├── documentation.ts
│   └── typescript.ts
└── developer.ts
```
<!-- langtabs-end -->

## `/src/prompts/typescript.ts`

<!-- langtabs-start -->
```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

export const typescript = new ChatPrompt({
  instructions: [
    'you are an expert Typescript engineer.',
    'you are great at solving Typescript problems, searching for errors, and providing solutions.',
  ].join('\n'),
  model: new OpenAIChatModel({
    model: 'o1-preview', // we use o1 here for its advanced reasoning
    apiKey: process.OPENAI_API_KEY,
  }),
});
```
<!-- langtabs-end -->
