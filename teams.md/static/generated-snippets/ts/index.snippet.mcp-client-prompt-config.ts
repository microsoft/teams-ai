const logger = new ConsoleLogger('mcp-client', { level: 'debug' });
const prompt = new ChatPrompt(
  {
    instructions:
      "You are a helpful assistant. You MUST use tool calls to do all your work.",
    model: new OpenAIChatModel({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    }),
    logger
  },
  // Tell the prompt that the plugin needs to be used
  // Here you may also pass in additional configurations such as
  // a tool-cache, which can be used to limit the tools that are used
  // or improve performance
  [new McpClientPlugin({ logger })],
)
  // Here we are saying you can use any tool from localhost:3000/mcp
  // (that is the URL for the server we built using the mcp plugin)
  .usePlugin("mcpClient", { url: "http://localhost:3000/mcp" })
  // Alternatively, you can use a different server hosted somewhere else
  // Here we are using the mcp server hosted on an Azure Function
  .usePlugin("mcpClient", {
    url: "https://aiacceleratormcp.azurewebsites.net/runtime/webhooks/mcp/sse",
    params: {
      headers: {
        // If your server requires authentication, you can pass in Bearer or other
        // authentication headers here
        "x-functions-key": process.env.AZURE_FUNCTION_KEY!,
      },
    },
  });

app.on("message", async ({ send, activity }) => {
  await send({ type: "typing" });

  const result = await prompt.send(activity.text);
  if (result.content) {
    await send(result.content);
  }
});
