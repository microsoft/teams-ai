import { CardFactory, MemoryStorage, TurnContext } from 'botbuilder';
import {
    AI,
    ActionPlanner,
    ApplicationBuilder,
    DefaultConversationState,
    OpenAIModel,
    PromptManager,
    TurnState
} from '@microsoft/teams-ai';
import { configureUserAuthentication } from './userAuth';
import { GraphClient } from './utils/graphClient';
import { createUserPersonalInformationCard } from './utils/cards';
import { adapter } from '.';
import * as path from 'path';

if (!process.env.OPENAI_KEY && !process.env.AZURE_OPENAI_KEY) {
    throw new Error('Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set.');
}

export const run = (context: TurnContext) => app.run(context);

// Create AI components
const model = new OpenAIModel({
    // OpenAI Support
    apiKey: process.env.OPENAI_KEY!,
    defaultModel: 'gpt-3.5-turbo',

    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-3.5-turbo',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2023-03-15-preview',

    // Request logging
    logRequests: true
});

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: 'chat'
});

export type ApplicationTurnState = TurnState<DefaultConversationState>;

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder<ApplicationTurnState>()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                connectionName: process.env.OAUTH_CONNECTION_NAME ?? '',
                title: 'Sign in',
                text: 'Please sign in to use the bot.',
                endOnInvalidMessage: true
            }
        },
        autoSignIn: false
    })
    .withAIOptions({
        planner
    })
    .build();

// Register authentication handlers
configureUserAuthentication(app);

// Register AI actions
app.ai.action('user_personal_information', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const profile = await graphClient.getMyProfile();

    const card = createUserPersonalInformationCard(
        profile.displayName,
        profile.givenName,
        profile.surname,
        profile.jobTitle,
        profile.officeLocation,
        profile.mail
    );

    await context.sendActivity("Here's your personal's information:");

    await context.sendActivity({
        attachments: [card]
    });

    return AI.StopCommandName;
});

app.ai.action('user_profile_picture', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const photo = await graphClient.getProfilePhoto();

    const profileCard = CardFactory.thumbnailCard(context.activity.from.name, CardFactory.images([photo]));

    await context.sendActivity({
        attachments: [profileCard]
    });

    return AI.StopCommandName;
});

app.ai.action('user_manager', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const profile = await graphClient.getMyManager();

    const card = createUserPersonalInformationCard(
        profile.displayName,
        profile.givenName,
        profile.surname,
        profile.jobTitle,
        profile.officeLocation,
        profile.mail
    );

    await context.sendActivity("Here's your manager's information:");

    await context.sendActivity({
        attachments: [card]
    });

    return AI.StopCommandName;
});
