// Example with custom message builders and response processors
export const advancedPrompt = new ChatPrompt(
  {
    logger,
    model: new OpenAIChatModel({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      model: process.env.AZURE_OPENAI_MODEL!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION
    }),
  },
  [new A2AClientPlugin({
    // Custom function metadata builder
    buildFunctionMetadata: (card) => ({
      name: `ask${card.name.replace(/\s+/g, '')}`,
      description: `Ask ${card.name} about ${card.description || 'anything'}`,
    }),
    // Custom message builder - can return either Message or string
    buildMessageForAgent: (card, input) => {
      // Return a string - will be automatically wrapped in a Message
      return `[To ${card.name}]: ${input}`;

      // Or return a full Message object for more control:
      // return {
      //   messageId: uuidv4(),
      //   role: 'user',
      //   parts: [{ kind: 'text', text: `[To ${card.name}]: ${input}` }],
      //   kind: 'message',
      //   metadata: { source: 'chat-prompt', ...metadata },
      // };
    },
    // Custom response processor
    buildMessageFromAgentResponse: (card, response) => {
      if (response.kind === 'message') {
        const textParts = response.parts
          .filter(part => part.kind === 'text')
          .map(part => part.text);
        return `${card.name} says: ${textParts.join(' ')}`;
      }
      return `${card.name} sent a non-text response.`;
    },
  })]
)
  .usePlugin('a2a', {
    key: 'weather-agent',
    cardUrl: 'http://localhost:4000/a2a/.well-known/agent-card.json',
  });
