import {
    Application,
    AssistantsPlanner,
    AI
} from '@microsoft/teams-ai';
import { CardFactory, MemoryStorage, MessageFactory, TurnContext } from 'botbuilder';
import { Order } from './foodOrderViewSchema';
import { generateCardForOrder } from './foodOrderCard';

if (!process.env.OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY.');
}

// Create Assistant if no ID is provided
if (!process.env.ASSISTANT_ID) {
    (async () => {
        const assistant = await AssistantsPlanner.createAssistant(process.env.OPENAI_KEY!, {
            name: "Order Bot",
            instructions: [
                `You are a food ordering bot for a restaurant named The Pub.`,
                `The customer can order pizza, beer, or salad.`,
                `If the customer doesn't specify the type of pizza, beer, or salad they want ask them.`,
                `Verify the order is complete and accurate before placing it with the place_order function.`
            ].join('\n'),
            tools: [
                {
                    type: "function",
                    function: {
                        name: "place_order",
                        description: "Creates or updates a food order.",
                        parameters: require('../src/foodOrderViewSchema.json')
                    }
                }
            ],
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

app.ai.action<Order>('place_order', async (context, state, order) => {
    const card = generateCardForOrder(order);
    await context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(card)));
    return `order placed`;
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed. Please try again later.');
    return AI.StopCommandName;
});
