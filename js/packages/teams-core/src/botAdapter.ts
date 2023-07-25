/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClaimsIdentity } from '@microsoft/teams-connector';
import { Activity, ConversationParameters, ConversationReference, ResourceResponse } from '@microsoft/teams-connector/src/schema';
import { makeRevocable } from './internal';
import { Middleware, MiddlewareHandler, MiddlewareSet } from './middlewareSet';
import { TurnContext } from './turnContext';

/**
 * Defines the core behavior of a bot adapter that can connect a bot to a service endpoint.
 *
 * @remarks
 * The bot adapter encapsulates authentication processes and sends activities to and receives
 * activities from the Bot Connector Service. When your bot receives an activity, the adapter
 * creates a turn context object, passes it to your bot application logic, and sends responses
 * back to the user's channel.
 *
 * The adapter processes and directs incoming activities in through the bot middleware pipeline to
 * your bot logic and then back out again. As each activity flows in and out of the bot, each
 * piece of middleware can inspect or act upon the activity, both before and after the bot logic runs.
 * Use the [use](xref:botbuilder-core.BotAdapter.use) method to add [Middleware](xref:botbuilder-core.Middleware)
 * objects to your adapter's middleware collection.
 *
 * For more information, see the articles on
 * [How bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
 * [Middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware).
 */
export abstract class BotAdapter {
    protected middleware: MiddlewareSet = new MiddlewareSet();

    private turnError: (context: TurnContext, error: Error) => Promise<void> = (context, error) => Promise.resolve();

    readonly BotIdentityKey = Symbol('BotIdentity');
    readonly ConnectorClientKey = Symbol('ConnectorClient');
    readonly OAuthScopeKey = Symbol('OAuthScope');

    /**
     * Asynchronously sends a set of outgoing activities to a channel server.
     *
     * This method supports the framework and is not intended to be called directly for your code.
     * Use the turn context's [sendActivity](xref:botbuilder-core.TurnContext.sendActivity) or
     * [sendActivities](xref:botbuilder-core.TurnContext.sendActivities) method from your bot code.
     *
     * @param context The context object for the turn.
     * @param activities The activities to send.
     *
     * @returns An array of [ResourceResponse](xref:)
     *
     * @remarks
     * The activities will be sent one after another in the order in which they're received. A
     * response object will be returned for each sent activity. For `message` activities this will
     * contain the ID of the delivered message.
     */
    abstract sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]>;

    /**
     * Asynchronously replaces a previous activity with an updated version.
     *
     * This interface supports the framework and is not intended to be called directly for your code.
     * Use [TurnContext.updateActivity](xref:botbuilder-core.TurnContext.updateActivity) to update
     * an activity from your bot code.
     *
     * @param context The context object for the turn.
     * @param activity The updated version of the activity to replace.
     *
     * @remarks
     * Not all channels support this operation. For channels that don't, this call may throw an exception.
     */
    abstract updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<ResourceResponse | void>;

    /**
     * Asynchronously deletes an existing activity.
     *
     * This interface supports the framework and is not intended to be called directly for your code.
     * Use [TurnContext.deleteActivity](xref:botbuilder-core.TurnContext.deleteActivity) to delete
     * an activity from your bot code.
     *
     * @param context The context object for the turn.
     * @param reference Conversation reference information for the activity to delete.
     *
     * @remarks
     * Not all channels support this operation. For channels that don't, this call may throw an exception.
     */
    abstract deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void>;

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param reference A reference to the conversation to continue.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     *
     * @remarks
     * This is often referred to as a _proactive notification_, the bot can proactively
     * send a message to a conversation or user without waiting for an incoming message.
     * For example, a bot can use this method to send notifications or coupons to a user.
     */
    abstract continueConversation(
        reference: Partial<ConversationReference>,
        logic: (revocableContext: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param botAppId The application ID of the bot. This parameter is ignored in single tenant the Adapters (Console,Test, etc) but is critical to the BotFrameworkAdapter which is multi-tenant aware.
     * @param reference A partial [ConversationReference](xref:botframework-schema.ConversationReference) to the conversation to continue.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     * @returns a promise representing the async operation
     */
    continueConversationAsync(
        botAppId: string,
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param claimsIdentity A [ClaimsIdentity](xref:botframework-connector) for the conversation.
     * @param reference A partial [ConversationReference](xref:botframework-schema.ConversationReference) to the conversation to continue.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     * @returns a promise representing the async operation
     */
    continueConversationAsync(
        claimsIdentity: ClaimsIdentity,
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param claimsIdentity A [ClaimsIdentity](xref:botframework-connector) for the conversation.
     * @param reference A partial [ConversationReference](xref:botframework-schema.ConversationReference) to the conversation to continue.
     * @param audience A value signifying the recipient of the proactive message.</param>
     * @param logic The asynchronous method to call after the adapter middleware runs.
     * @returns a promise representing the async operation
     */
    continueConversationAsync(
        claimsIdentity: ClaimsIdentity,
        reference: Partial<ConversationReference>,
        audience: string,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * @internal
     */
    async continueConversationAsync(
        _botAppIdOrClaimsIdentity: string | ClaimsIdentity,
        _reference: Partial<ConversationReference>,
        _logicOrAudience: ((context: TurnContext) => Promise<void>) | string,
        _maybeLogic?: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Creates a conversation on the specified channel.
     *
     * @param _botAppId The application ID of the bot.
     * @param _channelId The ID for the channel.
     * @param _serviceUrl The ID for the channel.
     * @param _audience The audience for the connector.
     * <param name="conversationParameters">
     * @param _conversationParameters The conversation information to use to create the conversation
     * @param _logic The method to call for the resulting bot turn.
     * @returns A promise that represents the asynchronous operation
     *
     * @remarks
     * To start a conversation, your bot must know its account information and the user's account information on that
     * channel.  Most _channels only support initiating a direct message (non-group) conversation.
     *
     * The adapter attempts to create a new conversation on the channel, and then sends a `conversationUpdate` activity
     * through its middleware pipeline to the logic method.
     *
     * If the conversation is established with the specified users, the ID of the activity's converstion will contain
     * the ID of the new conversation.
     */
    async createConversationAsync(
        _botAppId: string,
        _channelId: string,
        _serviceUrl: string,
        _audience: string,
        _conversationParameters: ConversationParameters,
        _logic: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Gets or sets an error handler that can catch exceptions in the middleware or application.
     *
     * @remarks
     * The error handler is called with these parameters:
     *
     * | Name | Type | Description |
     * | :--- | :--- | :--- |
     * | `context` | [TurnContext](xref:botbuilder-core.TurnContext) | The context object for the turn. |
     * | `error` | `Error` | The Node.js error thrown. |
     * @returns {Promise<void>} A promise representing the async operation.
     */
    get onTurnError(): (context: TurnContext, error: Error) => Promise<void> {
        return this.turnError;
    }

    /**
     * Sets an error handler that can catch exceptions in the middleware or application.
     *
     * @remarks
     * The error handler is called with these parameters:
     *
     * | Name | Type | Description |
     * | :--- | :--- | :--- |
     * | `context` | [TurnContext](xref:botbuilder-core.TurnContext) | The context object for the turn. |
     * | `error` | `Error` | The Node.js error thrown. |
     */
    set onTurnError(value: (context: TurnContext, error: Error) => Promise<void>) {
        this.turnError = value;
    }

    /**
     * Adds middleware to the adapter's pipeline.
     *
     * @param {...any} middlewares The middleware or middleware handlers to add.
     * @returns The updated adapter object.
     * @remarks Middleware is added to the adapter at initialization time.
     * Each turn, the adapter calls its middleware in the order in which you added it.
     */
    use(...middlewares: (MiddlewareHandler | Middleware)[]): this {
        this.middleware.use(...middlewares);

        return this;
    }

    /**
     * Starts activity processing for the current bot turn.
     *
     * @param context The context object for the turn.
     * @param next A callback method to run at the end of the pipeline.
     * @returns A promise that resolves when the middleware chain is finished
     *
     * @remarks
     * The adapter creates a revokable proxy for the turn context and then calls its middleware in
     * the order in which you added it. If the middleware chain completes without short circuiting,
     * the adapter calls the callback method. If any middleware short circuits, the adapter does not
     * call any of the subsequent middleware or the callback method, and the pipeline short circuits.
     *
     * The adapter calls middleware with a `next` parameter, which represents the next step in the
     * pipeline. Middleware should call the `next` method to continue processing without short circuiting.
     *
     * When the turn is initiated by a user activity (reactive messaging), the callback method will
     * be a reference to the bot's turn handler. When the turn is initiated by a call to
     * [continueConversation](xref:botbuilder-core.BotAdapter.continueConversation) (proactive messaging),
     * the callback method is the callback method that was provided in the call.
     */
    protected async runMiddleware(
        context: TurnContext,
        next: (revocableContext: TurnContext) => Promise<void>
    ): Promise<void> {
        if (context && context.activity && context.activity.locale) {
            context.locale = context.activity.locale;
        }

        // Wrap context with revocable proxy
        const pContext = makeRevocable(context);

        try {
            await this.middleware.run(pContext.proxy, () => next(pContext.proxy));
        } catch (err: unknown) {
            if (this.onTurnError) {
                await this.onTurnError(pContext.proxy, err as Error);
            } else {
                throw err;
            }
        } finally {
            pContext.revoke();
        }
    }
}
