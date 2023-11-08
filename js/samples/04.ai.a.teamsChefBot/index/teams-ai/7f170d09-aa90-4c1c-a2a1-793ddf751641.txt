/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    TurnContext,
    Storage,
    ActivityTypes,
    BotAdapter,
    ConversationReference,
    Activity,
    ResourceResponse
} from 'botbuilder';
import { TurnState, TurnStateManager } from './TurnState';
import { DefaultTurnState, DefaultTurnStateManager } from './DefaultTurnStateManager';
import { AdaptiveCards, AdaptiveCardsOptions } from './AdaptiveCards';
import { MessageExtensions } from './MessageExtensions';
import { AI, AIOptions } from './AI';
import { TaskModules, TaskModulesOptions } from './TaskModules';

/**
 * @private
 */
const TYPING_TIMER_DELAY = 1000;

/**
 * Query arguments for a search-based message extension.
 * @template TParams Type of the query parameters.
 */
export interface Query<TParams extends Record<string, any>> {
    /**
     * Number of items to return in the result set.
     */
    count: number;

    /**
     * Number of items to skip in the result set.
     */
    skip: number;

    /**
     * Query parameters.
     */
    parameters: TParams;
}

/**
 * Options for the Application class.
 * @template TState Type of the turn state.
 */
export interface ApplicationOptions<TState extends TurnState> {
    /**
     * Optional. Bot adapter being used.
     * @summary
     * If using the `longRunningMessages` option or calling the continueConversationAsync() method,
     * this property is required.
     */
    adapter?: BotAdapter;

    /**
     * Optional. Application ID of the bot.
     * @summary
     * If using the `longRunningMessages` option or calling the continueConversationAsync() method,
     * this property is required.
     */
    botAppId?: string;

    /**
     * Optional. Storage provider to use for the application.
     */
    storage?: Storage;

    /**
     * Optional. AI options to use. When provided, a new instance of the AI system will be created.
     */
    ai?: AIOptions<TState>;

    /**
     * Optional. Turn state manager to use. If omitted, an instance of DefaultTurnStateManager will
     * be created.
     */
    turnStateManager: TurnStateManager<TState>;

    /**
     * Optional. Options used to customize the processing of Adaptive Card requests.
     */
    adaptiveCards?: AdaptiveCardsOptions;

    /**
     * Optional. Options used to customize the processing of task module requests.
     */
    taskModules?: TaskModulesOptions;

    /**
     * Optional. If true, the bot will automatically remove mentions of the bot's name from incoming
     * messages. Defaults to true.
     */
    removeRecipientMention: boolean;

    /**
     * Optional. If true, the bot will automatically start a typing timer when messages are received.
     * This allows the bot to automatically indicate that it's received the message and is processing
     * the request. Defaults to true.
     */
    startTypingTimer: boolean;

    /**
     * Optional. If true, the bot supports long running messages that can take longer then the 10 - 15
     * second timeout imposed by most channels. Defaults to false.
     * @summary
     * This works by immediately converting the incoming request to a proactive conversation. Care should
     * be used for bots that operate in a shared hosting environment. The incoming request is immediately
     * completed and many shared hosting environments will mark the bot's process as idle and shut it down.
     */
    longRunningMessages: boolean;
}

/**
 * Conversation update events.
 */
export type ConversationUpdateEvents =
    | 'channelCreated'
    | 'channelRenamed'
    | 'channelDeleted'
    | 'channelRestored'
    | 'membersAdded'
    | 'membersRemoved'
    | 'teamRenamed'
    | 'teamDeleted'
    | 'teamArchived'
    | 'teamUnarchived'
    | 'teamRestored';

/**
 * Function for handling an incoming request.
 * @template TState Type of the turn state.
 * @param context Context for the current turn of conversation with the user.
 * @param state Current turn state.
 * @returns A promise that resolves when the handler completes its processing.
 */
export type RouteHandler<TState extends TurnState> = (context: TurnContext, state: TState) => Promise<void>;

/**
 * Function for selecting whether a route handler should be triggered.
 * @param context Context for the current turn of conversation with the user.
 * @returns A promise that resolves with a boolean indicating whether the route handler should be triggered.
 */
export type RouteSelector = (context: TurnContext) => Promise<boolean>;

/**
 * Message reaction event types.
 */
export type MessageReactionEvents = 'reactionsAdded' | 'reactionsRemoved';

/**
 * Turn event types.
 * @summary
 * The `beforeTurn` event is triggered before the turn is processed. This allows for the turn state to be
 * modified before the turn is processed. Returning false from the event handler will prevent the turn from
 * being processed.
 *
 * The `afterTurn` event is triggered after the turn is processed. This allows for the turn state to be
 * modified or inspected after the turn is processed. Returning false from the event handler will prevent
 * the turn state from being saved.
 */
export type TurnEvents = 'beforeTurn' | 'afterTurn';

/**
 * Application class for routing and processing incoming requests.
 * @summary
 * The Application object replaces the traditional ActivityHandler that a bot would use. It supports
 * a simpler fluent style of authoring bots versus the inheritance based approach used by the
 * ActivityHandler class.
 *
 * Additionally, it has built-in support for calling into the SDK's AI system and can be used to create
 * bots that leverage Large Language Models (LLM) and other AI capabilities.
 * @template TState Optional. Type of the turn state. This allows for strongly typed access to the turn state.
 */
export class Application<TState extends TurnState = DefaultTurnState> {
    private readonly _options: ApplicationOptions<TState>;
    private readonly _routes: AppRoute<TState>[] = [];
    private readonly _invokeRoutes: AppRoute<TState>[] = [];
    private readonly _adaptiveCards: AdaptiveCards<TState>;
    private readonly _messageExtensions: MessageExtensions<TState>;
    private readonly _taskModules: TaskModules<TState>;
    private readonly _ai?: AI<TState>;
    private readonly _beforeTurn: ApplicationEventHandler<TState>[] = [];
    private readonly _afterTurn: ApplicationEventHandler<TState>[] = [];
    private _typingTimer: any;

    /**
     * Creates a new Application instance.
     * @param {ApplicationOptions<TState>} options Optional. Options used to configure the application.
     */
    public constructor(options?: Partial<ApplicationOptions<TState>>) {
        this._options = Object.assign(
            {
                removeRecipientMention: true,
                startTypingTimer: true,
                longRunningMessages: false
            } as ApplicationOptions<TState>,
            options
        ) as ApplicationOptions<TState>;

        // Create default turn state manager if needed
        if (!this._options.turnStateManager) {
            this._options.turnStateManager = new DefaultTurnStateManager() as any;
        }

        // Create AI component if configured with a planner
        if (this._options.ai) {
            this._ai = new AI(this._options.ai);
        }

        this._adaptiveCards = new AdaptiveCards<TState>(this);
        this._messageExtensions = new MessageExtensions<TState>(this);
        this._taskModules = new TaskModules<TState>(this);

        // Validate long running messages configuration
        if (this._options.longRunningMessages && (!this._options.adapter || !this._options.botAppId)) {
            throw new Error(
                `The Application.longRunningMessages property is unavailable because no adapter or botAppId was configured.`
            );
        }
    }

    /**
     * Fluent interface for accessing Adaptive Card specific features.
     * @returns {AdaptiveCards<TState>} The AdaptiveCards instance.
     */
    public get adaptiveCards(): AdaptiveCards<TState> {
        return this._adaptiveCards;
    }

    /**
     * Fluent interface for accessing AI specific features.
     * @summary
     * This property is only available if the Application was configured with `ai` options. An
     * exception will be thrown if you attempt to access it otherwise.
     * @returns {AI<TState>} The AI instance.
     */
    public get ai(): AI<TState> {
        if (!this._ai) {
            throw new Error(`The Application.ai property is unavailable because no AI options were configured.`);
        }

        return this._ai;
    }

    /**
     * Fluent interface for accessing Message Extensions' specific features.
     * @returns {MessageExtensions<TState>} The MessageExtensions instance.
     */
    public get messageExtensions(): MessageExtensions<TState> {
        return this._messageExtensions;
    }

    /**
     * The application's configured options.
     * @returns {ApplicationOptions<TState>} The application's configured options.
     */
    public get options(): ApplicationOptions<TState> {
        return this._options;
    }

    /**
     * Fluent interface for accessing Task Module specific features.
     * @returns {TaskModules<TState>} The TaskModules instance.
     */
    public get taskModules(): TaskModules<TState> {
        return this._taskModules;
    }

    /**
     * Adds a new route to the application.
     * @summary
     * Developers won't typically need to call this method directly as it's used internally by all
     * of the fluent interfaces to register routes for their specific activity types.
     *
     * Routes will be matched in the order they're added to the application. The first selector to
     * return `true` when an activity is received will have its handler called.
     *
     * Invoke-based activities receive special treatment and are matched separately as they typically
     * have shorter execution timeouts.
     * @param {RouteSelector} selector Function thats used to select a route. The function should return true to trigger the route.
     * @param {RouteHandler<TState>} handler Function to call when the route is triggered.
     * @param {boolean} isInvokeRoute Optional. Boolean indicating if the RouteSelector is for an activity that uses "invoke" which require special handling. Defaults to `false`.
     * @returns {this} The application instance for chaining purposes.
     */
    public addRoute(selector: RouteSelector, handler: RouteHandler<TState>, isInvokeRoute = false): this {
        if (isInvokeRoute) {
            this._invokeRoutes.push({ selector, handler });
        } else {
            this._routes.push({ selector, handler });
        }
        return this;
    }

    /**
     * Handles incoming activities of a given type.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} type Name of the activity type to match or a regular expression to match against the incoming activity type. An array of type names or expression can also be passed in.
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler Function to call when the route is triggered.
     * @param {TurnContext} handler.context The context object for the turn.
     * @param {TState} handler.state The state object for the turn.
     * @returns {this} The application instance for chaining purposes.
     */
    public activity(
        type: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState) => Promise<void>
    ): this {
        (Array.isArray(type) ? type : [type]).forEach((t) => {
            const selector = createActivitySelector(t);
            this.addRoute(selector, handler);
        });
        return this;
    }

    /**
     * Handles conversation update events.
     * @param {ConversationUpdateEvents | ConversationUpdateEvents[]} event Name of the conversation update event(s) to handle.
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler Function to call when the route is triggered.
     * @param {TurnContext} handler.context The context object for the turn.
     * @param {TState} handler.state The state object for the turn.
     * @returns {this} The application instance for chaining purposes.
     */
    public conversationUpdate(
        event: ConversationUpdateEvents | ConversationUpdateEvents[],
        handler: (context: TurnContext, state: TState) => Promise<void>
    ): this {
        (Array.isArray(event) ? event : [event]).forEach((e) => {
            const selector = createConversationUpdateSelector(e);
            this.addRoute(selector, handler);
        });
        return this;
    }

    /**
     * Starts a new "proactive" session with a conversation the bot is already a member of.
     * @summary
     * Use of the method requires configuration of the Application with the `adapter` and `botAppId`
     * options. An exception will be thrown if either is missing.
     * @param context Context of the conversation to proactively message. This can be derived from either a TurnContext, ConversationReference, or Activity.
     * @param logic The bot's logic that should be run using the new proactive turn context.
     */
    public continueConversationAsync(
        context: TurnContext,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;
    public continueConversationAsync(
        conversationReference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;
    public continueConversationAsync(
        activity: Partial<Activity>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;
    public async continueConversationAsync(
        context: TurnContext | Partial<ConversationReference> | Partial<Activity>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        if (!this._options.adapter) {
            throw new Error(
                `You must configure the Application with an 'adapter' before calling Application.continueConversationAsync()`
            );
        }

        if (!this._options.botAppId) {
            console.warn(
                `Calling Application.continueConversationAsync() without a configured 'botAppId'. In production environments a 'botAppId' is required.`
            );
        }

        // Identify conversation reference
        let reference: Partial<ConversationReference>;
        if (typeof (context as TurnContext).activity == 'object') {
            reference = TurnContext.getConversationReference((context as TurnContext).activity);
        } else if (typeof (context as Partial<Activity>).type == 'string') {
            reference = TurnContext.getConversationReference(context as Partial<Activity>);
        } else {
            reference = context as Partial<ConversationReference>;
        }

        await this._options.adapter.continueConversationAsync(this._options.botAppId ?? '', reference, logic);
    }

    /**
     * Handles incoming messages with a given keyword.
     * @summary
     * This method provides a simple way to have a bot respond anytime a user sends your bot a
     * message with a specific word or phrase.
     *
     * For example, you can easily clear the current conversation anytime a user sends "/reset":
     *
     * ```JavaScript
     * bot.message('/reset', async (context, state) => {
     *     await state.conversation.delete();
     *     await context.sendActivity(`I have reset your state.`);
     * });
     * ```
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} keyword Substring of text or a regular expression to match against the text of an incoming message. An array of keywords or expression can also be passed in.
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler Function to call when the route is triggered.
     * @returns {this} The application instance for chaining purposes.
     */
    public message(
        keyword: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState) => Promise<void>
    ): this {
        (Array.isArray(keyword) ? keyword : [keyword]).forEach((k) => {
            const selector = createMessageSelector(k);
            this.addRoute(selector, handler);
        });
        return this;
    }

    /**
     * Handles message reaction events.
     * @param {MessageReactionEvents | MessageReactionEvents[]} event Name of the message reaction event(s) to handle.
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler Function to call when the route is triggered.
     * @returns {this} The application instance for chaining purposes.
     */
    public messageReactions(
        event: MessageReactionEvents | MessageReactionEvents[],
        handler: (context: TurnContext, state: TState) => Promise<void>
    ): this {
        (Array.isArray(event) ? event : [event]).forEach((e) => {
            const selector = createMessageReactionSelector(e);
            this.addRoute(selector, handler);
        });
        return this;
    }

    /**
     * Dispatches an incoming activity to a handler registered with the application.
     * @summary
     * This method should be called from your bot's "turn handler" (its primary message handler)
     *
     * ```JavaScript
     * server.post('/api/messages', async (req, res) => {
     *    await adapter.processActivity(req, res, async (context) => {
     *      await bot.run(context);
     *   });
     * });
     * ```
     * @param {TurnContext} turnContext Context class for the current turn of conversation with the user.
     * @returns {Promise<boolean>} True if the activity was successfully dispatched to a handler. False if no matching handlers could be found.
     */
    public async run(turnContext: TurnContext): Promise<boolean> {
        return await this.startLongRunningCall(turnContext, async (context) => {
            // Start typing indicator timer
            this.startTypingTimer(context);
            try {
                // Remove @mentions
                if (this._options.removeRecipientMention && context.activity.type == ActivityTypes.Message) {
                    context.activity.text = TurnContext.removeRecipientMention(context.activity);
                }

                // Load turn state
                const { storage, turnStateManager } = this._options;
                const state = await turnStateManager!.loadState(storage, context);

                // Call beforeTurn event handlers
                if (!(await this.callEventHandlers(context, state, this._beforeTurn))) {
                    // Save turn state
                    // - This lets the bot keep track of why it ended the previous turn. It also
                    //   allows the dialog system to be used before the AI system is called.
                    await turnStateManager!.saveState(storage, context, state);
                    return false;
                }

                // Run any RouteSelectors in this._invokeRoutes first if the incoming Teams activity.type is "Invoke".
                // Invoke Activities from Teams need to be responded to in less than 5 seconds.
                if (context.activity.type === ActivityTypes.Invoke) {
                    for (let i = 0; i < this._invokeRoutes.length; i++) {
                        // TODO: fix security/detect-object-injection
                        // eslint-disable-next-line security/detect-object-injection
                        const route = this._invokeRoutes[i];
                        if (await route.selector(context)) {
                            // Execute route handler
                            await route.handler(context, state);

                            // Call afterTurn event handlers
                            if (await this.callEventHandlers(context, state, this._afterTurn)) {
                                // Save turn state
                                await turnStateManager!.saveState(storage, context, state);
                            }

                            // End dispatch
                            return true;
                        }
                    }
                }

                // All other ActivityTypes and any unhandled Invokes are run through the remaining routes.
                for (let i = 0; i < this._routes.length; i++) {
                    // TODO:
                    // eslint-disable-next-line security/detect-object-injection
                    const route = this._routes[i];
                    if (await route.selector(context)) {
                        // Execute route handler
                        await route.handler(context, state);

                        // Call afterTurn event handlers
                        if (await this.callEventHandlers(context, state, this._afterTurn)) {
                            // Save turn state
                            await turnStateManager!.saveState(storage, context, state);
                        }

                        // End dispatch
                        return true;
                    }
                }

                // Call AI module if configured
                if (this._ai && context.activity.type == ActivityTypes.Message && context.activity.text) {
                    // Begin a new chain of AI calls
                    await this._ai.chain(context, state);

                    // Call afterTurn event handlers
                    if (await this.callEventHandlers(context, state, this._afterTurn)) {
                        // Save turn state
                        await turnStateManager!.saveState(storage, context, state);
                    }

                    // End dispatch
                    return true;
                }

                // activity wasn't handled
                return false;
            } finally {
                this.stopTypingTimer();
            }
        });
    }

    /**
     * Sends a proactive activity to an existing conversation the bot is a member of.
     * @summary
     * This method provides a simple way to send a proactive message to a conversation the bot is a member of.
     *
     * Use of the method requires you configure the Application with the `adapter` and `botAppId`
     * options. An exception will be thrown if either is missing.
     * @param context Context of the conversation to proactively message. This can be derived from either a TurnContext, ConversationReference, or Activity.
     * @param activityOrText Activity or message to send to the conversation.
     * @param speak Optional. Text to speak for channels that support voice.
     * @param inputHint Optional. Input hint for channels that support voice.
     * @returns A Resource response containing the ID of the activity that was sent.
     */
    public sendProactiveActivity(
        context: TurnContext,
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined>;
    public sendProactiveActivity(
        conversationReference: Partial<ConversationReference>,
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined>;
    public sendProactiveActivity(
        activity: Partial<Activity>,
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined>;
    public async sendProactiveActivity(
        context: TurnContext | Partial<ConversationReference> | Partial<Activity>,
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined> {
        let response: ResourceResponse | undefined;
        await this.continueConversationAsync(context, async (ctx) => {
            response = await ctx.sendActivity(activityOrText, speak, inputHint);
        });

        return response;
    }

    /**
     * Manually start a timer to periodically send "typing" activities.
     * @summary
     * The timer waits 1000ms to send its initial "typing" activity and then send an additional
     * "typing" activity every 1000ms. The timer will automatically end once an outgoing activity
     * has been sent. If the timer is already running or the current activity, is not a "message"
     * the call is ignored.
     * @param {TurnContext} context The context for the current turn with the user.
     */
    public startTypingTimer(context: TurnContext): void {
        if (context.activity.type == ActivityTypes.Message && !this._typingTimer) {
            // Listen for outgoing activities
            context.onSendActivities((context, activities, next) => {
                // Listen for any messages to be sent from the bot
                if (timerRunning) {
                    for (let i = 0; i < activities.length; i++) {
                        // TODO:
                        // eslint-disable-next-line security/detect-object-injection
                        if (activities[i].type == ActivityTypes.Message) {
                            // Stop the timer
                            this.stopTypingTimer();
                            timerRunning = false;
                            break;
                        }
                    }
                }

                return next();
            });

            let timerRunning = true;
            const onTimeout = async () => {
                try {
                    // Send typing activity
                    await context.sendActivity({ type: ActivityTypes.Typing });
                } catch (err) {
                    // Seeing a random proxy violation error from the context object. This is because
                    // we're in the middle of sending an activity on a background thread when the turn ends.
                    // The context object throws when we try to update "this.responded = true". We can just
                    // eat the error but lets make sure our states cleaned up a bit.
                    this._typingTimer = undefined;
                    timerRunning = false;
                }

                // Restart timer
                if (timerRunning) {
                    this._typingTimer = setTimeout(onTimeout, TYPING_TIMER_DELAY);
                }
            };
            this._typingTimer = setTimeout(onTimeout, TYPING_TIMER_DELAY);
        }
    }

    /**
     * Manually stop the typing timer.
     * @summary
     * If the timer isn't running nothing happens.
     */
    public stopTypingTimer(): void {
        if (this._typingTimer) {
            clearTimeout(this._typingTimer);
            this._typingTimer = undefined;
        }
    }

    /**
     * Registers a turn event handler.
     * @summary
     * Turn events let you do something before or after a turn is run. Returning false from
     * `beforeTurn` lets you prevent the turn from running and returning false from `afterTurn`
     * lets you prevent the bots state from being saved.
     *
     * Returning false from `beforeTurn` does result in the bots state being saved which lets you
     * track the reason why the turn was not processed. It also means you can use `beforeTurn` as
     * a way to call into the dialog system. For example, you could use the OAuthPrompt to sign the
     * user in before allowing the AI system to run.
     * @param {TurnEvents | TurnEvents[]} event - Name of the turn event to handle.
     * @param {(context: TurnContext, state: TState) => Promise<boolean>} handler - Function to call when the event is triggered.
     * @returns {this} The application instance for chaining purposes.
     */
    public turn(
        event: TurnEvents | TurnEvents[],
        handler: (context: TurnContext, state: TState) => Promise<boolean>
    ): this {
        (Array.isArray(event) ? event : [event]).forEach((e) => {
            switch (event) {
                case 'beforeTurn':
                default:
                    this._beforeTurn.push(handler);
                    break;
                case 'afterTurn':
                    this._afterTurn.push(handler);
                    break;
            }
        });
        return this;
    }

    /**
     * Calls the given event handlers with the given context and state.
     * @param {TurnContext} context - The context for the current turn with the user.
     * @param {TState} state - The current state of the conversation.
     * @param {ApplicationEventHandler<TState>[]} handlers - The event handlers to call.
     * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether the event handlers completed successfully.
     * @private
     */
    private async callEventHandlers(
        context: TurnContext,
        state: TState,
        handlers: ApplicationEventHandler<TState>[]
    ): Promise<boolean> {
        for (let i = 0; i < handlers.length; i++) {
            // TODO:
            // eslint-disable-next-line security/detect-object-injection
            const continueExecution = await handlers[i](context, state);
            if (!continueExecution) {
                return false;
            }
        }

        // Continue execution
        return true;
    }

    /**
     * Calls the given handler with the given context, either directly or by continuing the conversation
     * if the message is a long-running message.
     * @param {TurnContext} context - The context for the current turn with the user.
     * @param {(context: TurnContext) => Promise<boolean>} handler - The handler function to call.
     * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether the handler completed successfully.
     * @private
     */
    private startLongRunningCall(
        context: TurnContext,
        handler: (context: TurnContext) => Promise<boolean>
    ): Promise<boolean> {
        /**
         * If the message is a long-running message, continue the conversation
         * and call the handler with the new context.
         */
        if (context.activity.type == ActivityTypes.Message && this._options.longRunningMessages) {
            return new Promise<boolean>((resolve, reject) => {
                this.continueConversationAsync(context, async (ctx) => {
                    try {
                        // Copy original activity to new context
                        for (const key in context.activity) {
                            // eslint-disable-next-line security/detect-object-injection
                            (ctx.activity as any)[key] = (context.activity as any)[key];
                        }

                        // Call handler
                        const result = await handler(ctx);
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        } else {
            // Call handler directly
            return handler(context);
        }
    }
}

/**
 * A builder class for simplifying the creation of an Application instance.
 * @template TState Optional. Type of the turn state. This allows for strongly typed access to the turn state.
 */
export class ApplicationBuilder<TState extends TurnState = DefaultTurnState> {
    private _options: Partial<ApplicationOptions<TState>> = {};

    /**
     * Configures the application to use long running messages.
     * Default state for longRunningMessages is false
     * @param {BotAdapter} adapter The adapter to use for routing incoming requests.
     * @param {string} botAppId The Microsoft App ID for the bot.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withLongRunningMessages(adapter: BotAdapter, botAppId: string): this {
        if (!botAppId) {
            throw new Error(
                `The Application.longRunningMessages property is unavailable because botAppId cannot be null or undefined.`
            );
        }

        this._options.longRunningMessages = true;
        this._options.adapter = adapter;
        this._options.botAppId = botAppId;
        return this;
    }

    /**
     * Configures the storage system to use for storing the bot's state.
     * @param {Storage} storage The storage system to use.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withStorage(storage: Storage): this {
        this._options.storage = storage;
        return this;
    }

    /**
     * Configures the AI system to use for processing incoming messages.
     * @param {AIOptions<TState>} aiOptions The options for the AI system.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withAIOptions(aiOptions: AIOptions<TState>): this {
        this._options.ai = aiOptions;
        return this;
    }

    /**
     * Configures the turn state manager to use for managing the bot's turn state.
     * @param {TurnStateManager<TState>} turnStateManager The turn state manager to use.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withTurnStateManager(turnStateManager: TurnStateManager<TState>): this {
        this._options.turnStateManager = turnStateManager;
        return this;
    }

    /**
     * Configures the processing of Adaptive Card requests.
     * @param {AdaptiveCardsOptions} adaptiveCardOptions The options for the Adaptive Cards.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withAdaptiveCardOptions(adaptiveCardOptions: AdaptiveCardsOptions): this {
        this._options.adaptiveCards = adaptiveCardOptions;
        return this;
    }

    /**
     * Configures the processing of Task Module requests.
     * @param {TaskModulesOptions} taskModuleOptions The options for the Task Modules.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withTaskModuleOptions(taskModuleOptions: TaskModulesOptions): this {
        this._options.taskModules = taskModuleOptions;
        return this;
    }

    /**
     * Configures the removing of mentions of the bot's name from incoming messages.
     * Default state for removeRecipientMention is true
     * @param {boolean} removeRecipientMention The boolean for removing reciepient mentions.
     * @returns {this} The ApplicationBuilder instance.
     */
    public setRemoveRecipientMention(removeRecipientMention: boolean): this {
        this._options.removeRecipientMention = removeRecipientMention;
        return this;
    }

    /**
     * Configures the typing timer when messages are received.
     * Default state for startTypingTimer is true
     * @param {boolean} startTypingTimer The boolean for starting the typing timer.
     * @returns {this} The ApplicationBuilder instance.
     */
    public setStartTypingTimer(startTypingTimer: boolean): this {
        this._options.startTypingTimer = startTypingTimer;
        return this;
    }

    /**
     * Builds and returns a new Application instance.
     * @returns {Application<TState>} The Application instance.
     */
    public build(): Application<TState> {
        return new Application(this._options);
    }
}

/**
 * @private
 */
interface AppRoute<TState extends TurnState> {
    selector: RouteSelector;
    handler: RouteHandler<TState>;
}

/**
 * @param {string | RegExp | RouteSelector} type The type of activity to match. Can be a string, RegExp, or RouteSelector function.
 * @returns {RouteSelector} A RouteSelector function that matches the given activity type.
 * @private
 */
function createActivitySelector(type: string | RegExp | RouteSelector): RouteSelector {
    if (typeof type == 'function') {
        // Return the passed in selector function
        return type;
    } else if (type instanceof RegExp) {
        // Return a function that matches the activities type using a RegExp
        return (context: TurnContext) => {
            return Promise.resolve(context?.activity?.type ? type.test(context.activity.type) : false);
        };
    } else {
        // Return a function that attempts to match type name
        const typeName = type.toString().toLocaleLowerCase();
        return (context: TurnContext) => {
            return Promise.resolve(
                context?.activity?.type ? context.activity.type.toLocaleLowerCase() === typeName : false
            );
        };
    }
}

/**
 * Creates a route selector function that matches a conversation update event.
 * @param {ConversationUpdateEvents} event The conversation update event to match against.
 * @returns {RouteSelector} A route selector function that returns true if the activity is a conversation update event and matches the specified event type.
 * @private
 */
function createConversationUpdateSelector(event: ConversationUpdateEvents): RouteSelector {
    switch (event) {
        case 'membersAdded':
            /**
             * @param {TurnContext} context The context object for the current turn of conversation.
             * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether the activity is a conversation update event with members added.
             */
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        Array.isArray(context?.activity?.membersAdded) &&
                        context.activity.membersAdded.length > 0
                );
            };
        case 'membersRemoved':
            /**
             * @param {TurnContext} context The context object for the current turn of conversation.
             * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether the activity is a conversation update event with members removed.
             */
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        Array.isArray(context?.activity?.membersRemoved) &&
                        context.activity.membersRemoved.length > 0
                );
            };
        default:
            /**
             * @param {TurnContext} context The context object for the current turn of conversation.
             * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether the activity is a conversation update event with the specified event type.
             */
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        context?.activity?.channelData?.eventType == event
                );
            };
    }
}

/**
 * Creates a route selector function that matches a message based on a keyword.
 * @param {string | RegExp | RouteSelector} keyword The keyword to match against the message text. Can be a string, regular expression, or a custom selector function.
 * @returns {RouteSelector} A route selector function that returns true if the message text matches the keyword.
 * @private
 */
function createMessageSelector(keyword: string | RegExp | RouteSelector): RouteSelector {
    if (typeof keyword == 'function') {
        // Return the passed in selector function
        return keyword;
    } else if (keyword instanceof RegExp) {
        // Return a function that matches a messages text using a RegExp
        return (context: TurnContext) => {
            if (context?.activity?.type === ActivityTypes.Message && context.activity.text) {
                return Promise.resolve(keyword.test(context.activity.text));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match a messages text using a substring
        const k = keyword.toString().toLocaleLowerCase();
        return (context: TurnContext) => {
            if (context?.activity?.type === ActivityTypes.Message && context.activity.text) {
                return Promise.resolve(context.activity.text.toLocaleLowerCase().indexOf(k) >= 0);
            } else {
                return Promise.resolve(false);
            }
        };
    }
}

/**
 * @param {MessageReactionEvents} event The type of message reaction event to create a selector for.
 * @returns {RouteSelector} A selector function that matches the specified message reaction event.
 * @private
 */
function createMessageReactionSelector(event: MessageReactionEvents): RouteSelector {
    switch (event) {
        case 'reactionsAdded':
        default:
            /**
             * @param {TurnContext} context The context object for the current turn of the conversation.
             * @returns {Promise<boolean>} A promise that resolves to true if the context object represents a message reaction event with reactions added, or false otherwise.
             */
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.MessageReaction &&
                        Array.isArray(context?.activity?.reactionsAdded) &&
                        context.activity.reactionsAdded.length > 0
                );
            };
        case 'reactionsRemoved':
            /**
             * @param {TurnContext} context The context object for the current turn of the conversation.
             * @returns {Promise<boolean>} A promise that resolves to true if the context object represents a message reaction event with reactions removed, or false otherwise.
             */
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.MessageReaction &&
                        Array.isArray(context?.activity?.reactionsRemoved) &&
                        context.activity.reactionsRemoved.length > 0
                );
            };
    }
}

/**
 * @private
 */
type ApplicationEventHandler<TState extends TurnState> = (context: TurnContext, state: TState) => Promise<boolean>;
