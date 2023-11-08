import {
    Application,
    AssistantsPlanner
} from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';

if (!process.env.OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY.');
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
export const run = (context: TurnContext) => app.run(context);

interface GetWeatherParams {
    location: string;
    units?: 'c' | 'f';
}

app.ai.action<GetWeatherParams>('get_weather', async (context, state, params) => {
    await context.sendActivity(`[getting weather for ${params.location}]`);
    return `76${params.units || 'f'} and sunny`;
});
