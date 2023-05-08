// Import required packages
import * as restify from "restify";

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
  Attachment, 
  MemoryStorage, 
  MessageFactory, 
  MessagingExtensionResult, 
  TaskModuleTaskInfo
} from "botbuilder";

import config from "./config";
import * as path from 'path';
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.botId,
  MicrosoftAppPassword: config.botPassword,
  MicrosoftAppType: "MultiTenant",
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  await context.sendActivity(`The bot encountered unhandled error:\n ${error.message}`);
  await context.sendActivity("To continue to run this bot, please fix the bot source code.");
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

import {
  Application,
  DefaultConversationState,
  DefaultPromptManager,
  DefaultTempState,
  DefaultTurnState,
  DefaultUserState,
  OpenAIPlanner
} from '@microsoft/botbuilder-m365';
import { createInitialView, createEditView, createPostCard } from './cards';


// This Message Extension can either drop the created card into the compose window (default.)
// Or use Teams botMessagePreview feature to post the activity directly to the feed onBehalf of the user.
// Set PREVIEW_MODE to true to enable this feature and update your manifest accordingly.
const PREVIEW_MODE = false;

if (!config.openAIKey) {
  throw new Error('Missing environment OpenAIKey');
}

interface TempState extends DefaultTempState {
  post: string | undefined;
  prompt: string | undefined;
}

type ApplicationTurnState = DefaultTurnState<DefaultConversationState, DefaultUserState, TempState>;

// Create AI components
const planner = new OpenAIPlanner<ApplicationTurnState>({
  apiKey: config.openAIKey,
  defaultModel: 'text-davinci-003',
  logRequests: true
});
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, './prompts'));

// Define storage and application
// - Note that we're not passing a prompt for our AI options as we won't be chatting with the app.
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
  storage,
  adapter,
  botAppId: config.botId,
  ai: {
      planner,
      promptManager
  }
});

app.messageExtensions.fetchTask('CreatePost', async (context: TurnContext, state: ApplicationTurnState) => {
  // Return card as a TaskInfo object
  const card = createInitialView();
  return createTaskInfo(card);
});

interface SubmitData {
  verb: 'generate' | 'update' | 'preview' | 'post';
  prompt?: string;
  post?: string;
}

app.messageExtensions.submitAction<SubmitData>(
  'CreatePost',
  async (context: TurnContext, state: ApplicationTurnState, data) => {
      try {
          switch (data.verb) {
              case 'generate':
                  // Call GPT and return response view
                  return await updatePost(context, state, 'generate', data);
              case 'update':
                  // Call GPT and return an updated response view
                  return await updatePost(context, state, 'update', data);
              case 'preview': {
                  // Preview the post as an adaptive card
                  const card = createPostCard(data.post!);
                  const activity = MessageFactory.attachment(card);
                  return {
                      type: 'botMessagePreview',
                      activityPreview: activity
                  } as MessagingExtensionResult;
              }
              case 'post': {
                  const attachments = [createPostCard(data.post!)] || undefined;
                  // Drop the card into compose window
                  return {
                      type: 'result',
                      attachmentLayout: 'list',
                      attachments
                  } as MessagingExtensionResult;
                  break;
              }
          }
      } catch (err: any) {
          return `Something went wrong: ${err.toString()}`;
      }
  }
);

app.messageExtensions.botMessagePreviewEdit(
  'CreatePost',
  async (context: TurnContext, state: DefaultTurnState, previewActivity) => {
      // Get post text from previewed card
      const post: string = previewActivity?.attachments?.[0]?.content?.body[0]?.text ?? '';
      const card = createEditView(post, PREVIEW_MODE);
      return createTaskInfo(card);
  }
);

app.messageExtensions.botMessagePreviewSend(
  'CreatePost',
  async (context: TurnContext, state: DefaultTurnState, previewActivity) => {
      // Create a new activity using the card in the preview activity
      const card = previewActivity?.attachments?.[0];
      const activity = card && MessageFactory.attachment(card);
      if (!activity) {
          throw new Error('No card found in preview activity');
      }
      activity.channelData = {
          onBehalfOf: [
              {
                  itemId: 0,
                  mentionType: 'person',
                  mri: context.activity.from.id,
                  displayname: context.activity.from.name
              }
          ]
      };

      // Send new activity to chat
      await context.sendActivity(activity);
  }
);

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
  // Route received a request to adapter for processing
  await adapter.process(req, res as any, async (context) => {
      // Dispatch to application for routing
      await app.run(context);
  });
});

/**
* @param card
*/
function createTaskInfo(card: Attachment): TaskModuleTaskInfo {
  return {
      title: `Create Post`,
      width: 'medium',
      height: 'medium',
      card
  };
}

/**
* @param context
* @param state
* @param prompt
* @param data
*/
async function updatePost(
  context: TurnContext,
  state: ApplicationTurnState,
  prompt: string,
  data: SubmitData
): Promise<TaskModuleTaskInfo> {
  // Create new or updated post
  state.temp.value['post'] = data.post;
  state.temp.value['prompt'] = data.prompt;
  const post = await app.ai.completePrompt(context, state, prompt);
  if (!post) {
      throw new Error(`The request to OpenAI was rate limited. Please try again later.`);
  }

  // Return card
  const card = createEditView(post, PREVIEW_MODE);
  return createTaskInfo(card);
}

