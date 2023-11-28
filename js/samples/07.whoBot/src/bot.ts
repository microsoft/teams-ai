import { ActivityTypes, Attachment, CardFactory, MemoryStorage, TurnContext } from 'botbuilder';
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
import { createCalendarEventCard, createUserEmailCard, createUserPersonalInformationCard } from './utils/cards';
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

// Register activity handlers
app.activity(ActivityTypes.InstallationUpdate, async (context: TurnContext) => {
    await context.sendActivity(
        "Hi! I'm WhoBot. I can help by providing you work-related information such as who your manager is, \
        who your colleagues are, and your recent emails. I can also show you your personal information and \
        profile picture. To get started, ask me anything."
    );
});

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
    let profile;
    try {
        profile = await graphClient.getMyManager();
    } catch (e) {
        await context.sendActivity(
            "Hmm...I wasn't able to get your manager details from Graph. You might not have a manager."
        );
        return AI.StopCommandName;
    }

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

app.ai.action('user_colleagues', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const colleagues = await graphClient.getMyColleagues();

    const colleaguesCards: Attachment[] = [];

    colleagues.value.forEach(async (profile: any) => {
        colleaguesCards.push(
            createUserPersonalInformationCard(
                profile.displayName,
                profile.givenName,
                profile.surname,
                profile.jobTitle,
                profile.officeLocation,
                profile.mail
            )
        );
    });

    if (colleagues.length == 0) {
        await context.sendActivity("You don't have any colleagues.");
        return AI.StopCommandName;
    }

    await context.sendActivity('Here are the people you work with:');

    await context.sendActivity({
        attachments: colleaguesCards
    });

    return AI.StopCommandName;
});

app.ai.action('user_mail', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const mails = await graphClient.getMyEmails();
    const mailsCard: Attachment[] = [];

    mails.value.forEach(async (mail: any) => {
        mailsCard.push(
            createUserEmailCard(
                mail.subject,
                mail.from.emailAddress.name,
                mail.sentDateTime,
                mail.bodyPreview,
                mail.webLink
            )
        );
    });

    await context.sendActivity('Here are your recent emails:');

    await context.sendActivity({
        attachments: mailsCard
    });

    return AI.StopCommandName;
});

app.ai.action('user_calendar_events', async (context: TurnContext, state: ApplicationTurnState) => {
    const token = await app.getTokenOrStartSignIn(context, state, 'graph');
    if (!token) {
        await context.sendActivity('You have to be signed in to fulfill this request. Starting sign in flow...');
        return AI.StopCommandName;
    }

    const graphClient = new GraphClient(state.temp.authTokens['graph']!);
    const events = await graphClient.getMyCalendarEvents();
    const eventsCard: Attachment[] = [];

    events.value.slice(0, 5).forEach(async (event: any) => {
        eventsCard.push(
            createCalendarEventCard(
                event.organizer.emailAddress.name,
                event.subject,
                event.start.dateTime,
                event.end.dateTime,
                event.bodyPreview,
                event.webLink
            )
        );
    });

    await context.sendActivity('Here are the upcoming five events in your calendar:');

    await context.sendActivity({
        attachments: eventsCard
    });

    return AI.StopCommandName;
});
