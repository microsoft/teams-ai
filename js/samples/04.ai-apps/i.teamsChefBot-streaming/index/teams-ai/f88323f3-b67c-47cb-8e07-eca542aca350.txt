# Getting Started

1. [Prompts](./00.PROMPTS.md)
2. [Prompt Template](./01.PROMPT-TEMPLATES.md)
3. [Planner](./02.PLANNER.md)
4. [Actions](./03.ACTIONS.md)
5. [Chain](./04.CHAIN.md)
6. [Turns](./05.TURNS.md)
7. [Other](./OTHER/README.md)

## Migration Documentation

Welcome to the migration docs! Please note that we currently have two sections:

1. [`js` guidance](./js/)
1. [`dotnet` guidance](./dotnet/)

### Migration

If you are migrating your existing bot, we recommend starting with the respective 00.MIGRATION in the programming language of your bot. Please note that while the content of both sections will be extremely similar, our goal is to provide code examples in the corresponding language.

- [js](./js/00.MIGRATION.md)
- [dotnet](./dotnet/00.MIGRATION.md)

### Using samples with Azure Open AI or OpenAI

To use the samples with Azure Open AI, update OpenAIPlanner to AzureOpenAIPlanner
AzureOpenAIPlanner expects an endpoint property, which can be found in the Azure portal

```typescript
const planner = new AzureOpenAIPlanner({
  apiKey: process.env.AZURE_OPENAI_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT, // Note: Azure OpenAI requires the endpoint property, but is not required for OpenAI.
  defaultModel: "gpt-35-turbo", // Note that the developer chooses the name of the deployment, so this may be different for you
  logRequests: true
});
```

To use the samples with OpenAI, you will need to update the OpenAIPlanner to use the OpenAI API key

```typescript
const planner = new OpenAIPlanner({
  apiKey: process.env.OPENAI_KEY,
  defaultModel: "gpt-3.5-turbo",
  logRequests: true
});
```
