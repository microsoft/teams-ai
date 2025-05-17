// import { ChatPrompt } from "@microsoft/teams.ai";
// import { OpenAIChatModel } from "@microsoft/teams.openai";
// import { A2AClientPlugin } from "@microsoft/teams.a2a";
const prompt = new ChatPrompt(
  {
    logger,
    model: new OpenAIChatModel({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    }),
  },
  // Add the A2AClientPlugin to the prompt
  [new A2AClientPlugin()]
)
  // Provide the agent's server URL
  .usePlugin("a2a", {
    key: "my-weather-agent",
    url: "http://localhost:4000/a2a",
  });
