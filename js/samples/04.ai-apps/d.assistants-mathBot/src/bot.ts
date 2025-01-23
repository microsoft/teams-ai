import { Application, preview, AI } from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';

if (!(process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT) && !process.env.OPENAI_KEY) {
    throw new Error(
        'Missing environment variables - please check that (AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT) or OPENAI_KEY is set.'
    );
}

let apiKey = '';
let endpoint;
if (process.env.AZURE_OPENAI_KEY) {
    apiKey = process.env.AZURE_OPENAI_KEY;
    endpoint = process.env.AZURE_OPENAI_ENDPOINT;
} else if (process.env.OPENAI_KEY) {
    apiKey = process.env.OPENAI_KEY;
}
const { AssistantsPlanner } = preview;

// Create Assistant if no ID is provided, this will require you to restart the program and fill in the process.env.ASSISTANT_ID afterwards.
if (!process.env.ASSISTANT_ID) {
    (async () => {
        const assistant = await AssistantsPlanner.createAssistant(
            apiKey,
            {
                name: 'Math Tutor',
                instructions: 'You are a personal math tutor. Write and run code to answer math questions.',
                tools: [{ type: 'code_interpreter' }],
                model: 'gpt-4'
            },
            endpoint ?? undefined,
            endpoint ? { apiVersion: process.env.OPENAI_API_VERSION } : undefined
        );

        console.log(`Created a new assistant with an ID of: ${assistant.id}`);
        process.exit();
    })();
}

// Create Assistant Planner
const planner = new AssistantsPlanner({
    apiKey: apiKey,
    endpoint: endpoint,
    assistant_id: process.env.ASSISTANT_ID!,
    apiVersion: process.env.OPENAI_API_VERSION
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
