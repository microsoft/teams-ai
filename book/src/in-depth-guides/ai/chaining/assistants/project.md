# Project

The assistant that specializes in project operations like reading/writing
a file/directory or running a build.

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

## `/src/prompts/project.ts`

<!-- langtabs-start -->
```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';

export const project = new ChatPrompt({
  instructions: [
    'you are an expert Typescript project manager.',
    'you help other developers perform various development tasks including:',
    '- reading source files/directories',
    '- writing source files/directories',
    '- running builds',
  ].join('\n'),
  model: new OpenAIChatModel({
    model: 'gpt-4o',
    apiKey: process.OPENAI_API_KEY,
  }),
})
  .function(
    'read-file',
    'read a source file',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'the path to the file',
        },
      },
      required: ['path'],
    },
    async ({ path }: { path: string }) => {
      // read the file and return the string content
    }
  )
  .function(
    'read-directory',
    'read the contents of a directory',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'the path to the directory',
        },
      },
      required: ['path'],
    },
    async ({ path }: { path: string }) => {
      // read the directory and return the list of files
    }
  )
  .function(
    'write-file',
    'write to a source file',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'the path to the file',
        },
        content: {
          type: 'string',
          description: 'the content to write',
        },
      },
      required: ['path', 'content'],
    },
    async ({ text, content }: { text: string; content: string }) => {
      // write to the file recursively
    }
  )
  .function('build', 'run a project build', async () => {
    // run build
  });
```
<!-- langtabs-end -->
