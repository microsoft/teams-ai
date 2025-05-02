# Developer

The top level assistant that is responsible for orchestrating the
other assistants.

```bash
src
├── prompts
│   ├── project.ts
│   ├── documentation.ts
│   └── typescript.ts
└── developer.ts
```

## `/src/developer.ts`

```typescript
import { ChatPrompt, ObjectSchema } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

import { project } from './prompts/project';
import { documentation } from './prompts/documentation';
import { typescript } from './prompts/typescript';

const schema: ObjectSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description: 'what you want to ask or say to the assistant',
    },
  },
  required: ['text'],
};

const developer = new ChatPrompt({
  instructions: [
    'you are an expert Typescript developer.',
    'you help other developers perform various development tasks including:',
    '- searching documentation',
    '- writing/reading/building the project source code',
    '- searching/resolving typescript related errors.',
  ].join('\n'),
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.OPENAI_API_KEY,
    stream: true,
  }),
})
  .function(
    'project-assistant',
    'ask the project assistant to read or write a file/directory from the source code, or run a build',
    schema,
    async ({ text }: { text: string }) => {
      return project.chat(text);
    }
  )
  .function(
    'documentation-assistant',
    'ask the documentation assistant to search for how to use internal packages',
    schema,
    async ({ text }: { text: string }) => {
      return documentation.chat(text);
    }
  )
  .function(
    'typescript-assistant',
    'ask the typescript assistant search the web for typescript errors and offer possible solutions',
    schema,
    async ({ text }: { text: string }) => {
      return typescript.chat(text);
    }
  );

(async () => {
  await developer.chat('run a build and fix any errors', (chunk) => {
    process.stdout.write(chunk);
  });

  process.stdout.write('\n');
})();
```
