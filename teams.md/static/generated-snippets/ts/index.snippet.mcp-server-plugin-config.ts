const mcpServerPlugin = new McpPlugin({
  // Describe the MCP server with a helpful name and description
  // for MCP clients to discover and use it.
  name: 'test-mcp',
  description: 'Allows you to test the mcp server',
  // Optionally, you can provide a URL to the mcp dev-tools
  // during development
  inspector: 'http://localhost:5173?proxyPort=9000',
}).tool(
  // Describe the tools with helpful names and descriptions
  'echo',
  'echos back whatever you said',
  {
    input: z.string().describe('the text to echo back'),
  },
  async ({ input }) => {
    return {
      content: [
        {
          type: 'text',
          text: `you said "${input}"`,
        },
      ],
    };
  }
);
