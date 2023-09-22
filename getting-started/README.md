# Getting Started

1. [Prompts](./00.PROMPTS.md)
2. [Prompt Template](./01.PROMPT-TEMPLATES.md)
3. [Planner](./02.PLANNER.md)
4. [Actions](./03.ACTIONS.md)
5. [Chain](./04.CHAIN.md)
6. [Turns](./05.TURNS.md)

## Migration Documentation

Welcome to the migration docs! Please note that we currently have two sections:

1. [`js` guidance](./js/)
1. [`dotnet` guidance](./dotnet/)

### Migration

If you are migrating your existing bot, we recommend starting with the respective 00.MIGRATION in the programming language of your bot. Please note that while the content of both sections will be extremely similar, our goal is to provide code examples in the corresponding language.

- [js](./js/00.MIGRATION.md)
- [dotnet](./dotnet/00.MIGRATION.md)

### Using this sample with Azure Open AI

To use this sample with Azure Open AI, update OpenAIPlanner to AzureOpenAIPlanner
AzureOpenAIPlanner expects an endpoint property, which can be found in the Azure portal

```typescript
const planner = new AzureOpenAIPlanner({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'text-davinci-003',
    logRequests: true
});
```
