// import { A2APlugin, schema } from "@microsoft/teams.a2a";
// import { App } from "@microsoft/teams.apps";
const agentCard: schema.AgentCard = {
    name: "Weather Agent",
    description: "An agent that can tell you the weather",
    url: `http://localhost:${PORT}/a2a`,
    provider: {
        organization: "Weather Co.",
    },
    version: "0.0.1",
    capabilities: {},
    skills: [
        {
            // Expose various skills that this agent can perform
            id: "get_weather",
            name: "Get Weather",
            description: "Get the weather for a given location",
            tags: ["weather", "get", "location"],
            examples: [
                // Give concrete examples on how to contact the agent
                "Get the weather for London",
                "What is the weather",
                "What's the weather in Tokyo?",
                "How is the current temperature in San Francisco?",
            ],
        },
    ],
};

const app = new App({
    logger,
    plugins: [new A2APlugin({
        agentCard
    })],
});
