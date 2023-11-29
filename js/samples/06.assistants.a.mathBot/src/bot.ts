import { Application, preview, AI } from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';

if (!process.env.OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY.');
}

const { AssistantsPlanner } = preview;

// Create Assistant if no ID is provided
if (!process.env.ASSISTANT_ID) {
    (async () => {
        const assistant = await AssistantsPlanner.createAssistant(process.env.OPENAI_KEY!, {
            name: "Math Tutor",
            instructions: "You are a personal math tutor. Write and run code to answer math questions.",
            tools: [{ type: "code_interpreter" }],
            model: "gpt-4-1106-preview"
        });

        console.log(`Created a new assistant with an ID of: ${assistant.id}`);
        process.exit();
    })();
}

// Create Assistant Planner
const planner = new AssistantsPlanner({
    apiKey: process.env.OPENAI_KEY!,
    assistant_id: process.env.ASSISTANT_ID!
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
    storage,
    ai: {
        planner
    }
});

// Export bots run() function
export const run = (context: TurnContext) => app.run(context);

app.message('/reset', async (context, state) => {
    state.deleteConversationState();
    await context.sendActivity(`Ok lets start this over.`);
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed. Please try again later.');
    return AI.StopCommandName;
});
