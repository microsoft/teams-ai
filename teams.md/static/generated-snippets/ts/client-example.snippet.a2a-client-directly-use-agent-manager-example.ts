// import { AgentManager } from "@microsoft/teams.a2a";
const directlyUserAgentManager = async (message: string) => {
  const agentManager = new AgentManager();
  agentManager.use("my-agent", "https://my-agent.com/a2a");

  const taskId = "my-task-id"; // Generated or reused from previous task
  await agentManager.sendTask("my-agent", {
    id: taskId,
    message: {
      role: 'user',
      parts: [{ type: 'text' as const, text: message }],
    },
  });
}
