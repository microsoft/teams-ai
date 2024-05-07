import { Application, preview, AI } from '@microsoft/teams-ai';
import { CardFactory, MemoryStorage, MessageFactory, TurnContext } from 'botbuilder';
import { Order } from './foodOrderViewSchema';
import { generateCardForOrder } from './foodOrderCard';

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
                name: 'Order Bot',
                instructions: [
                    `You are a food ordering bot for a restaurant named The Pub.`,
                    `The customer can order pizza, beer, or salad.`,
                    `If the customer doesn't specify the type of pizza, beer, or salad they want ask them.`,
                    `Verify the order is complete and accurate before placing it with the place_order function.`
                ].join('\n'),
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'place_order',
                            description: 'Creates or updates a food order.',
                            parameters: require('../src/foodOrderViewSchema.json')
                        }
                    }
                ],
                model: 'gpt-4'
            },
            endpoint
        );

        console.log(`Created a new assistant with an ID of: ${assistant.id}`);
        process.exit();
    })();
}

// Create Assistant Planner
const planner = new AssistantsPlanner({
    apiKey: apiKey,
    endpoint: endpoint,
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

app.ai.action<Order>('place_order', async (context, state, order) => {
    const card = generateCardForOrder(order);
    await context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(card)));
    return `order placed`;
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed. Please try again later.');
    return AI.StopCommandName;
});
