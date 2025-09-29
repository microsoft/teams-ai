import { App } from '@microsoft/teams.apps';
import { ConsoleLogger } from '@microsoft/teams.common/logging';
import { ChatPrompt } from '@microsoft/teams.ai';
import { OpenAIChatModel } from '@microsoft/teams.openai';
import { McpClientPlugin } from '@microsoft/teams.mcpclient';

const logger = new ConsoleLogger('mcp-client', { level: 'debug' });
const prompt = new ChatPrompt(
  {
    instructions:
      'You are a helpful assistant. You MUST use tool calls to do all your work.',
    model: new OpenAIChatModel({
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    })
  },
  [new McpClientPlugin({ logger })],
).usePlugin('mcpClient', {
    url: 'https://learn.microsoft.com/api/mcp',
  });

const app = new App();

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const result = await prompt.send(activity.text);
  if (result.content) {
    await send(result.content);
  }
});
app.start().catch(console.error);
