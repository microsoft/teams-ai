import { OpenAIModel, PromptManager, ActionPlanner, Application, TurnState, TeamsAdapter } from '@microsoft/teams-ai';
import {
    ActivityTypes,
    CardFactory,
    ConfigurationServiceClientCredentialFactory,
    MemoryStorage,
    MessageFactory,
    TurnContext
} from 'botbuilder';
import path from 'path';
import debug from 'debug';
import { createResponseCard } from './card';

const error = debug('azureopenai:app:error');
error.log = console.log.bind(console);

interface ConversationState {}
type ApplicationTurnState = TurnState<ConversationState>;

if (
    !process.env.AZURE_OPENAI_KEY ||
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_SEARCH_ENDPOINT ||
    !process.env.AZURE_SEARCH_KEY
) {
    throw new Error(
        'Missing environment variables - please check that AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_ENDPOINT are all set.'
    );
}

// Create AI components
const model = new OpenAIModel({
    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-35-turbo',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2024-02-15-preview',

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

// Define storage and application
const storage = new MemoryStorage();
export const app = new Application<ApplicationTurnState>({
    storage: storage,
    adapter: new TeamsAdapter(
        {},
        new ConfigurationServiceClientCredentialFactory({
            MicrosoftAppId: process.env.BOT_ID, // Set to "" if using the Teams Test Tool
            MicrosoftAppPassword: process.env.BOT_PASSWORD, // Set to "" if using the Teams Test Tool
            MicrosoftAppType: 'MultiTenant'
        })
    )
});

app.error(async (context: TurnContext, err: any) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    error(`[onTurnError] unhandled error: ${err}`);
    error(err);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${err}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
});
/**
 * Convert citation tags `[docn]` to `[n]` where n is a number.
 * @param {string} text The text to format.
 * @returns {string} The formatted text.
 */
function formatResponse(text: string): string {
    return text.replace(/\[doc(\d)+\]/g, '[$1]');
}

// HARDCODED TEST CITATION
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.message('test', async (context: TurnContext, _state: ApplicationTurnState) => {
    await context.sendActivity({
        type: ActivityTypes.Message,
        text: `${context.activity.text}[1]`,
        channelData: {
            feedbackLoopEnabled: true
        },
        entities: [
            {
                type: 'https://schema.org/Message',
                '@type': 'Message',
                '@context': 'https://schema.org',
                '@id': '',
                additionalType: ['AIGeneratedContent'],
                citation: [
                    {
                        '@type': 'Claim',
                        position: 1, // required
                        appearance: {
                            '@type': 'DigitalDocument',
                            name: `Name ${context.activity.text}`, // required
                            text: 'Text 1', // optional, ignored in teams
                            // "url": "https://developer.microsoft.com/en-us/fluentui",
                            abstract: `Abstract ${context.activity.text}`,
                            encodingFormat: 'text/html', // for now ignored, later used for icon
                            image: 'https://botapiint.blob.core.windows.net/tests/Bender_Rodriguez.png',
                            keywords: [
                                `Metadata 1 ${context.activity.text}`,
                                `Metadata 2 ${context.activity.text}`,
                                `Metadata 3 ${context.activity.text}`
                            ],
                            usageInfo: {
                                '@type': 'CreativeWork',
                                '@id': 'usage-info-1',
                                description: 'UsageInfo 1 description',
                                name: 'UsageInfo 1',
                                position: 5, // optional, ignored in teams
                                pattern: {
                                    // optional, ignored in teams
                                    '@type': 'DefinedTerm',
                                    inDefinedTermSet: 'https://www.w3.org/TR/css-values-4/',
                                    name: 'color',
                                    termCode: '#454545'
                                }
                            }
                        },
                        claimInterpreter: {
                            // optional, ignored in teams
                            '@type': 'Project',
                            name: 'Claim Interpreter name',
                            slogan: 'Claim Interpreter slogan',
                            url: 'https://www.example.com/claim-interpreter'
                        }
                    }
                ]
            }
        ]
    });
});
interface AzureOpenAICitationResponse {
    content: string;
    title: string;
    url: string;
    filePath: string;
    chunk_id: string;
}

interface SensitivityUsageInfo {
    type: string; // type: "https://schema.org/Message"
    '@type': string; // CreativeWork;
    description?: string;
    name: string; // Sensitivity title
    position?: number; // optional, ignored in teams
    pattern?: {
        '@type': string; // DefinedTerm
        inDefinedTermSet: string; // https://www.w3.org/TR/css-values-4/
        name: string; // color
        termCode: string; // #454545
    };
}
interface ClientCitation {
    '@type': string; // required
    position: string; // required
    appearance: {
        '@type': string; // Required; Must be 'DigitalDocument'
        name: string; // required
        text?: string; // optional, ignored in teams
        url: string;
        abstract?: string; // CHECK IS OPTIONAL
        encodingFormat?: 'text/html'; // for now ignored, later used for icon
        image?: string; // For now Ignored
        keywords?: string[]; // Optional; set by developer
        usageInfo?: SensitivityUsageInfo; // Optional;
    };
}

function removeLinksAndNewlines(content: string): string {
    // Remove all links
    let cleanedContent = content.replace(/https?:\/\/[^\s<]+/g, '');

    // Remove all literal \n strings
    cleanedContent = cleanedContent.replace(/\\n/g, '');

    return cleanedContent;
}

function snippet(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    let snippet = text.slice(0, maxLength);
    snippet = snippet.slice(0, Math.min(snippet.length, snippet.lastIndexOf(' ')));
    snippet += '...';
    return snippet;
}

app.activity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
    const response = await planner.completePrompt(context, state, 'chat');

    if (response.status == 'error') {
        // If completion response was unsuccessful `response.error` will have the error object.
        throw response.error;
    }

    // Send citations within an Adaptive Card if the bot is not running in Teams
    if (context.activity.channelId !== 'msteams') {
        const attachment = CardFactory.adaptiveCard(createResponseCard(response));
        const activity = MessageFactory.attachment(attachment);
        await context.sendActivity(activity);
    } else {
        const citations: ClientCitation[] = [];
        response.message!.context!.citations.forEach((citation, i) => {
            citations.push({
                '@type': 'Claim',
                position: `${i + 1}`, // required
                appearance: {
                    '@type': 'DigitalDocument',
                    name: citation.title,
                    url: citation.url,
                    abstract: snippet(removeLinksAndNewlines(citation.content), 500),
                    encodingFormat: 'text/html',
                    image: '',
                    keywords: []
                }
            });
        });

        console.log(citations);

        await context.sendActivity({
            type: ActivityTypes.Message,
            text: formatResponse(response!.message!.content!),
            channelData: {
                feedbackLoopEnabled: true
            },
            entities: [
                {
                    type: 'https://schema.org/Message',
                    '@type': 'Message',
                    '@context': 'https://schema.org',
                    '@id': '',
                    additionalType: ['AIGeneratedContent'],
                    citation: citations
                }
            ]
        });
    }
});
