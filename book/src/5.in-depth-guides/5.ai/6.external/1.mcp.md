# MCP (Model Context Protocol)

Teams AI Library supports [MCP](https://modelcontextprotocol.io/introduction) as an optional add-on both as a service or as a client.

## MCP Server

It is possible to co-opt a Teams AI Library service to be also used as an MCP server. Doing so will allow other MCP clients to connect to this service and use it to accomplish tasks. Check out the [MCP server sample](https://github.com/microsoft/teams.ts/tree/main/samples/mcp) for a working example.

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { McpPlugin } from '@microsoft/teams.mcp';
import { OpenAIChatModel } from '@microsoft/teams.openai';

// Create a normal ChatPrompt.
// This isn't going to serve AI requests, but rather serve MCP tool calls
const prompt = new ChatPrompt({
  model: new OpenAIChatModel({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

// Expose the functions for your MCP server
prompt.function(
  'echo',
  'echos back whatever you said',
  {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'the text to echo back',
      },
    },
    required: ['input'],
  } as const,
  async ({ input }: { input: string }) => {
    return `You said "${input}" :)`;
  }
);

const app = new App({
  logger: new ConsoleLogger('@samples/echo', { level: 'debug' }),
  plugins: [
    new DevtoolsPlugin(),
    // Include it as an McpPlugin for your App.
    new McpPlugin({
      name: 'echo',
      // Can observe requsts to your MCP server via Devtools if this is passed in.
      inspector: 'http://localhost:5173?proxyPort=9000',
    }).use(prompt),
  ],
});
```

## MCP Client

On the other hand, if you want your application to use an MCP server, you can do so by using the `McpClient` plugin. This plugin is a plugin for your `ChatPrompt` and will allow your prompt to use remote MCP servers to serve tool calls.

```typescript
import { ChatPrompt } from '@microsoft/teams.ai';
import { McpClientPlugin } from '@microsoft/teams.mcpclient';
import { OpenAIChatModel } from '@microsoft/teams.openai';
const prompt = new ChatPrompt(
  {
    instructions: 'You are a helpful assistant. You MUST use tool calls to do all your work.',
    model: new OpenAIChatModel({
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
  [new McpClientPlugin()]
  // Here we point to the MCP server we want to use.
  // In this case it happens to be the one we created
  // in a different Teams AI Library application above
).usePlugin('mcpClient', { url: 'http://localhost:3000/mcp' });
```

Somewhere else in the app:

```typescript
app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  // Use the prompt as usual. It will now be able to use the
  // definitions exposed by the MCP server it pointed to
  // and if the model decides it needs to use its tool,
  // the plugin will do the work of calling the server for you
  const result = await prompt.send(activity.text);
  if (result.content) {
    await send(result.content);
  }
});
```
