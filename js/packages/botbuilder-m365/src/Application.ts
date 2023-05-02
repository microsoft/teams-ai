/**
 * @module botbuilder-m365
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

const TYPING_TIMER_DELAY = 1000;

export interface Query<TParams extends Record<string, any>> {
    count: number;
    skip: number;
    parameters: TParams;
}

export interface ApplicationOptions<TState extends TurnState> {
    adapter?: BotAdapter;
    botAppId?: string;
    storage?: Storage;
    ai?: AIOptions<TState>;
    turnStateManager?: TurnStateManager<TState>;
    adaptiveCards?: AdaptiveCardsOptions;
    taskModules?: TaskModulesOptions;
    removeRecipientMention?: boolean;
    startTypingTimer?: boolean;
}

export type ApplicationEventHandler<TState extends TurnState> = (
    context: TurnContext,
    state: TState
) => Promise<boolean>;

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

export type RouteHandler<TState extends TurnState> = (context: TurnContext, state: TState) => Promise<void>;
export type RouteSelector = (context: TurnContext) => Promise<boolean>;

export type MessageReactionEvents = 'reactionsAdded' | 'reactionsRemoved';
/* Actions to be performed before or after a task */
export type TurnEvents = 'beforeTurn' | 'afterTurn';

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

    public constructor(options?: ApplicationOptions<TState>) {
        this._options = Object.assign(
            {
                removeRecipientMention: true,
                startTypingTimer: true
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
    }

    public get adaptiveCards(): AdaptiveCards<TState> {
        return this._adaptiveCards;
    }

    public get ai(): AI<TState> {
        if (!this._ai) {
            throw new Error(`The Application.ai property is unavailable because no AI options were configured.`);
        }

        return this._ai;
    }

    public get messageExtensions(): MessageExtensions<TState> {
        return this._messageExtensions;
    }

    public get options(): ApplicationOptions<TState> {
        return this._options;
    }

    public get taskModules(): TaskModules<TState> {
        return this._taskModules;
    }

    /**
     * Adds a new route to the application.
     *
     * Routes will be matched in the order they're added to the application. The first selector to
     * return `true` when an activity is received will have its handler called.
     *
     * @param {RouteSelector} selector Promise to determine if the route should be triggered.
     * @param {RouteHandler<TurnState>} handler Function to call when the route is triggered.
     * @param {boolean} isInvokeRoute boolean indicating if the RouteSelector is an invokable Teams activity as part of its routing logic. Defaults to `false`.
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
     *
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[] } type Name of the activity type to match or a regular expression to match against the incoming activity type. An array of type names or expression can also be passed in.
     * @param {Promise<void>} handler Function to call when the route is triggered.
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
     *
     * @param {ConversationUpdateEvents | ConversationUpdateEvents[]} event Name of the conversation update event(s) to handle.
     * @param {Promise<void>} handler Function to call when the route is triggered.
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
     *
     * @param {TurnContext} context Context of the conversation to proactively message. This can be derived from either a TurnContext, ConversationReference, or Activity.
     * @param {Promise<void>} logic The bot's logic that should be run using the new proactive turn context.
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
     *
     * @param {string | RegExp | RouteSelector | (string | RegExp | RouteSelector[])} keyword Substring of text or a regular expression to match against the text of an incoming message. An array of keywords or expression can also be passed in.
     * @param {Promise<void>} handler Function to call when the route is triggered.
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
     *
     * @param {MessageReactionEvents | MessageReactionEvents[]} event Name of the message reaction event to handle.
     * @param {Promise<void>} handler Function to call when the route is triggered.
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
     *
     * @param {TurnContext} context Context class for the current turn of conversation with the user.
     * @returns {boolean} True if the activity was successfully dispatched to a handler. False if no matching handlers could be found.
     */
    public async run(context: TurnContext): Promise<boolean> {
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
    }

    /**
     * Sends a proactive activity to an existing conversation the bot is a member of.
     *
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
     *
     *
     * The timer will automatically end once an outgoing activity has been sent. If the timer is
     * already running or the current activity, is not a "message" the call is ignored.
     *
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
     *
     *
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
     *
     * @param {TurnEvents | TurnEvents[]} event Name of the turn event to handle.
     * @param {Promise<void>} handler Function to call when the event is triggered.
     * @returns {this} The application instance for chaining purposes.
     */
    public turn(event: TurnEvents | TurnEvents[], handler: ApplicationEventHandler<TState>): this {
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
}

interface AppRoute<TState extends TurnState> {
    selector: RouteSelector;
    handler: RouteHandler<TState>;
}

/**
 *
 * @param {string | RegExp | RouteSelector} type The activity to match against.
 * @returns {RouteSelector} A Promise that resolves to true if the event matches the selector.
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
 *
 * @param {ConversationUpdateEvents} event The type of event to match against.
 * @returns {RouteSelector} A promise that resolves to true if the event matches the selector.
 */
function createConversationUpdateSelector(event: ConversationUpdateEvents): RouteSelector {
    switch (event) {
        case 'membersAdded':
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        Array.isArray(context?.activity?.membersAdded) &&
                        context.activity.membersAdded.length > 0
                );
            };
        case 'membersRemoved':
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        Array.isArray(context?.activity?.membersRemoved) &&
                        context.activity.membersRemoved.length > 0
                );
            };
        default:
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.ConversationUpdate &&
                        context?.activity?.channelData?.eventType == event
                );
            };
    }
}

/**
 *
 * @param {string | RegExp | RouteSelector} keyword The message keyword to match against.
 * @returns {RouteSelector} A promise that resolves to true if the event matches the selector.
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
 *
 * @param {MessageReactionEvents} event The type of reaction event to handle.
 * @returns {RouteSelector} A Promise that resolves to true if the event matches the selector.
 */
function createMessageReactionSelector(event: MessageReactionEvents): RouteSelector {
    switch (event) {
        case 'reactionsAdded':
        default:
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.MessageReaction &&
                        Array.isArray(context?.activity?.reactionsAdded) &&
                        context.activity.reactionsAdded.length > 0
                );
            };
        case 'reactionsRemoved':
            return (context: TurnContext) => {
                return Promise.resolve(
                    context?.activity?.type == ActivityTypes.MessageReaction &&
                        Array.isArray(context?.activity?.reactionsRemoved) &&
                        context.activity.reactionsRemoved.length > 0
                );
            };
    }
}
