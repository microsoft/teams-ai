/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActivityHandlerBase } from './activityHandlerBase';
import { InvokeException } from './invokeException';
import { InvokeResponse } from './invokeResponse';
import { TurnContext } from './turnContext';
import { verifyStateOperationName, tokenExchangeOperationName, tokenResponseEventName } from './signInConstants';

import {
    Activity,
    AdaptiveCardInvokeResponse,
    AdaptiveCardInvokeValue,
    Channels,
    SearchInvokeResponse,
    SearchInvokeValue,
    MessageReaction,
    StatusCodes,
} from '@microsoft/teams-connector/src/schema';

/**
 * Describes a bot activity event handler, for use with an [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
 *
 * @remarks
 * **Parameters**
 *
 * | Name | Type | Description |
 * | :--- | :--- | :--- |
 * | `context` | [TurnContext](xref:botbuilder-core.TurnContext) | The context object for the turn. |
 * | `next` | () => Promise<void> | A continuation function for handling the activity. |
 *
 * **Returns**
 *
 * `any`
 *
 * The incoming activity is contained in the `context` object's [activity](xref:botbuilder-core.TurnContext.activity) property.
 * Call the `next` function to continue the processing of activity events. Not doing so will stop propagation of events for this activity.
 *
 * A bot activity handler can return a value, to support _invoke_ activities.
 */
export type BotHandler = (context: TurnContext, next: () => Promise<void>) => Promise<any>;

/**
 * Event-emitting activity handler for bots. Extends [ActivityHandlerBase](xref:botbuilder-core.ActivityHandlerBase).
 *
 * @remarks
 * This provides an extensible class for handling incoming activities in an event-driven way.
 * You can register an arbitrary set of handlers for each event type.
 *
 * To register a handler for an event, use the corresponding _on event_ method. If multiple handlers are
 * registered for an event, they are run in the order in which they were registered.
 *
 * This object emits a series of _events_ as it processes an incoming activity.
 * A handler can stop the propagation of the event by not calling the continuation function.
 *
 * | Event type | Description |
 * | :--- | :--- |
 * | Turn | Emitted first for every activity. |
 * | Type-specific | Emitted for the specific activity type, before emitting an event for any sub-type. |
 * | Sub-type | Emitted for certain specialized events, based on activity content. |
 * | Dialog | Emitted as the final activity processing event. |
 *
 * For example:
 *
 * ```typescript
 * const bot = new ActivityHandler();
 *
 * server.post('/api/messages', (req, res) => {
 *     adapter.processActivity(req, res, async (context) => {
 *         // Route to bot's activity logic.
 *         await bot.run(context);
 *     });
 * });
 *
 * bot.onTurn(async (context, next) => {
 *         // Handle a "turn" event.
 *         await context.sendActivity(`${ context.activity.type } activity received.`);
 *         // Continue with further processing.
 *         await next();
 *     })
 *     .onMessage(async (context, next) => {
 *         // Handle a message activity.
 *         await context.sendActivity(`Echo: ${ context.activity.text }`);
 *         // Continue with further processing.
 *         await next();
 *     });
 * ```
 *
 * **See also**
 * - The [Bot Framework Activity schema](https://aka.ms/botSpecs-activitySchema)
 */
export class ActivityHandler extends ActivityHandlerBase {
    protected readonly handlers: { [type: string]: BotHandler[] } = {};

    /**
     * Registers an activity event handler for the _turn_ event, emitted for every incoming activity, regardless of type.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     */
    onTurn(handler: BotHandler): this {
        return this.on('Turn', handler);
    }

    /**
     * Registers an activity event handler for the _message_ event, emitted for every incoming message activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Message activities represent content intended to be shown within a conversational interface
     * and can contain text, speech, interactive cards, and binary or unknown attachments.
     * Not all message activities contain text, the activity's [text](xref:botframework-schema.Activity.text)
     * property can be `null` or `undefined`.
     */
    onMessage(handler: BotHandler): this {
        return this.on('Message', handler);
    }

    /**
     * Registers an activity event handler for the _message update_ event, emitted for every incoming message activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Message update activities represent an update of an existing message activity within a conversation.
     * The updated activity is referred to by the [id](xref:botbuilder-core.TurnContext.activity.id) and
     * [conversation](xref:botbuilder-core.TurnContext.activity.conversation) fields within the activity, and the
     * message update activity contains all fields in the revised message activity.
     * Message update activities are identified by a [type](xref:botbuilder-core.TurnContext.activity.type) value of
     * `messageUpdate`.
     */
    onMessageUpdate(handler: BotHandler): this {
        return this.on('MessageUpdate', handler);
    }

    /**
     * Registers an activity event handler for the _message delete_ event, emitted for every incoming message activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Message delete activities represent a deletion of an existing message activity within a conversation.
     * The deleted activity is referred to by the [id](xref:botbuilder-core.TurnContext.activity.id) and
     * [conversation](xref:botbuilder-core.TurnContext.activity.conversation) fields within the activity.
     * Message delete activities are identified by a [type](xref:botbuilder-core.TurnContext.activity.type) value of
     * `messageDelete`.
     */
    onMessageDelete(handler: BotHandler): this {
        return this.on('MessageDelete', handler);
    }

    /**
     * Registers an activity event handler for the _conversation update_ event, emitted for every incoming
     * conversation update activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Conversation update activities describe a changes to a conversation's metadata, such as title, participants,
     * or other channel-specific information.
     *
     * To handle when members are added to or removed from the conversation, use the
     * [onMembersAdded](xref:botbuilder-core.ActivityHandler.onMembersAdded) and
     * [onMembersRemoved](xref:botbuilder-core.ActivityHandler.onMembersRemoved) sub-type event handlers.
     */
    onConversationUpdate(handler: BotHandler): this {
        return this.on('ConversationUpdate', handler);
    }

    /**
     * Registers an activity event handler for the _members added_ event, emitted for any incoming
     * conversation update activity that includes members added to the conversation.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The activity's [membersAdded](xref:botframework-schema.Activity.membersAdded) property
     * contains the members added to the conversation, which can include the bot.
     *
     * To handle conversation update events in general, use the
     * [onConversationUpdate](xref:botbuilder-core.ActivityHandler.onConversationUpdate) type-specific event handler.
     */
    onMembersAdded(handler: BotHandler): this {
        return this.on('MembersAdded', handler);
    }

    /**
     * Registers an activity event handler for the _members removed_ event, emitted for any incoming
     * conversation update activity that includes members removed from the conversation.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The activity's [membersRemoved](xref:botframework-schema.Activity.membersRemoved) property
     * contains the members removed from the conversation, which can include the bot.
     *
     * To handle conversation update events in general, use the
     * [onConversationUpdate](xref:botbuilder-core.ActivityHandler.onConversationUpdate) type-specific event handler.
     */
    onMembersRemoved(handler: BotHandler): this {
        return this.on('MembersRemoved', handler);
    }

    /**
     * Registers an activity event handler for the _message reaction_ event, emitted for every incoming
     * message reaction activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Message reaction activities represent a social interaction on an existing message activity
     * within a conversation. The original activity is referred to by the message reaction activity's
     * [replyToId](xref:botframework-schema.Activity.replyToId) property. The
     * [from](xref:botframework-schema.Activity.from) property represents the source of the reaction,
     * such as the user that reacted to the message.
     *
     * To handle when reactions are added to or removed from messages in the conversation, use the
     * [onReactionsAdded](xref:botbuilder-core.ActivityHandler.onReactionsAdded) and
     * [onReactionsRemoved](xref:botbuilder-core.ActivityHandler.onReactionsRemoved) sub-type event handlers.
     */
    onMessageReaction(handler: BotHandler): this {
        return this.on('MessageReaction', handler);
    }

    /**
     * Registers an activity event handler for the _reactions added_ event, emitted for any incoming
     * message reaction activity that describes reactions added to a message.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The activity's [reactionsAdded](xref:botframework-schema.Activity.reactionsAdded) property
     * includes one or more reactions that were added.
     *
     * To handle message reaction events in general, use the
     * [onMessageReaction](xref:botbuilder-core.ActivityHandler.onMessageReaction) type-specific event handler.
     */
    onReactionsAdded(handler: BotHandler): this {
        return this.on('ReactionsAdded', handler);
    }

    /**
     * Registers an activity event handler for the _reactions removed_ event, emitted for any incoming
     * message reaction activity that describes reactions removed from a message.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The activity's [reactionsRemoved](xref:botframework-schema.Activity.reactionsRemoved) property
     * includes one or more reactions that were removed.
     *
     * To handle message reaction events in general, use the
     * [onMessageReaction](xref:botbuilder-core.ActivityHandler.onMessageReaction) type-specific event handler.
     */
    onReactionsRemoved(handler: BotHandler): this {
        return this.on('ReactionsRemoved', handler);
    }

    /**
     * Registers an activity event handler for the _event_ event, emitted for every incoming event activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * Event activities communicate programmatic information from a client or channel to a bot.
     * The meaning of an event activity is defined by the activity's
     * [name](xref:botframework-schema.Activity.name) property, which is meaningful within the scope
     * of a channel. Event activities are designed to carry both interactive information (such as
     * button clicks) and non-interactive information (such as a notification of a client
     * automatically updating an embedded speech model).
     *
     * To handle a `tokens/response` event event, use the
     * [onTokenResponseEvent](xref:botbuilder-core.ActivityHandler.onTokenResponseEvent) sub-type
     * event handler. To handle other named events, add logic to this handler.
     */
    onEvent(handler: BotHandler): this {
        return this.on('Event', handler);
    }

    /**
     * Registers an activity event handler for the _end of conversation_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * This activity is typically send from a Skill to a Skill caller indicating the end of that particular child conversation.
     *
     * To handle an End of Conversation, use the
     * [onEndOfConversation](xref:botbuilder-core.ActivityHandler.onEndOfConversation) type-specific event handler.
     */
    onEndOfConversation(handler: BotHandler): this {
        return this.on('EndOfConversation', handler);
    }

    /**
     * Registers an activity event handler for the _typing_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * To handle a Typing event, use the
     * [onTyping](xref:botbuilder-core.ActivityHandler.onTyping) type-specific event handler.
     */
    onTyping(handler: BotHandler): this {
        return this.on('Typing', handler);
    }

    /**
     * Registers an activity event handler for the _installationupdate_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * To handle a InstallationUpdate event, use the
     * [onInstallationUpdate](xref:botbuilder-core.ActivityHandler.onInstallationUpdate) type-specific event handler.
     */
    onInstallationUpdate(handler: BotHandler): this {
        return this.on('InstallationUpdate', handler);
    }

    /**
     * Registers an activity event handler for the _installationupdate add_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * To handle a InstallationUpdateAdd event, use the
     * [onInstallationUpdateAdd](xref:botbuilder-core.ActivityHandler.onInstallationUpdateAdd) type-specific event handler.
     */
    onInstallationUpdateAdd(handler: BotHandler): this {
        return this.on('InstallationUpdateAdd', handler);
    }

    /**
     * Registers an activity event handler for the _installationupdate remove_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * To handle a InstallationUpdateRemove event, use the
     * [onInstallationUpdateRemove](xref:botbuilder-core.ActivityHandler.onInstallationUpdateRemove) type-specific event handler.
     */
    onInstallationUpdateRemove(handler: BotHandler): this {
        return this.on('InstallationUpdateRemove', handler);
    }

    /**
     * Registers an activity event handler for the _tokens-response_ event, emitted for any incoming
     * `tokens/response` event activity. These are generated as part of the OAuth authentication flow.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The activity's [value](xref:botframework-schema.Activity.value) property contains the user token.
     *
     * If your bot handles authentication using an [OAuthPrompt](xref:botbuilder-dialogs.OAuthPrompt)
     * within a dialog, then the dialog will need to receive this activity to complete the authentication flow.
     *
     * To handle other named events and event events in general, use the
     * [onEvent](xref:botbuilder-core.ActivityHandler.onEvent) type-specific event handler.
     */
    onTokenResponseEvent(handler: BotHandler): this {
        return this.on('TokenResponseEvent', handler);
    }

    /**
     * Registers an activity event handler for the _command_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * To handle a Command event, use the
     * [onCommand](xref:botbuilder-core.ActivityHandler.onCommand) type-specific event handler.
     */
    onCommand(handler: BotHandler): this {
        return this.on('Command', handler);
    }

    /**
     * Registers an activity event handler for the _CommandResult_ activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * To handle a CommandResult event, use the
     * [onCommandResult](xref:botbuilder-core.ActivityHandler.onCommandResult) type-specific event handler.
     */
    onCommandResult(handler: BotHandler): this {
        return this.on('CommandResult', handler);
    }

    /**
     * Registers an activity event handler for the _unrecognized activity type_ event, emitted for an
     * incoming activity with a type for which the [ActivityHandler](xref:botbuilder-core.ActivityHandler)
     * doesn't provide an event handler.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     * @remarks
     * The `ActivityHandler` does not define events for all activity types defined in the
     * [Bot Framework Activity schema](http://aka.ms/botSpecs-activitySchema). In addition,
     * channels and custom adapters can create [Activities](xref:botframework-schema.Activity) with
     * types not in the schema. When the activity handler receives such an event, it emits an unrecognized activity type event.
     *
     * The activity's [type](xref:botframework-schema.Activity.type) property contains the activity type.
     */
    onUnrecognizedActivityType(handler: BotHandler): this {
        return this.on('UnrecognizedActivityType', handler);
    }

    /**
     * Registers an activity event handler for the _dialog_ event, emitted as the last event for an incoming activity.
     *
     * @param handler The event handler.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     */
    onDialog(handler: BotHandler): this {
        return this.on('Dialog', handler);
    }

    /**
     * Called to initiate the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Typically, you would provide this method as the function handler that the adapter calls
     * to perform the bot's logic after the received activity has been pre-processed by the adapter
     * and routed through any middleware.
     *
     * For example:
     * ```javascript
     *  server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async (context) => {
     *          // Route to bot's activity logic.
     *          await bot.run(context);
     *      });
     * });
     * ```
     *
     * **See also**
     * - [BotFrameworkAdapter.processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity)
     */
    async run(context: TurnContext): Promise<void> {
        await super.run(context);
    }

    /**
     * Called at the start of the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to use custom logic for emitting events.
     *
     * The default logic is to call any handlers registered via [onTurn](xref:botbuilder-core.ActivityHandler.onTurn),
     * and then continue by calling [ActivityHandlerBase.onTurnActivity](xref:botbuilder-core.ActivityHandlerBase.onTurnActivity).
     */
    protected async onTurnActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'Turn', async () => {
            await super.onTurnActivity(context);
        });
    }

    /**
     * Runs all registered _message_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onMessage](xref:botbuilder-core.ActivityHandler.onMessage),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onMessageActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'Message', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _message update_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onMessageUpdate](xref:botbuilder-core.ActivityHandler.onMessageUpdate),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onMessageUpdateActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'MessageUpdate', async () => {
            await this.dispatchMessageUpdateActivity(context);
        });
    }

    /**
     * Runs all registered _message delete_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onMessageDelete](xref:botbuilder-core.ActivityHandler.onMessageDelete),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onMessageDeleteActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'MessageDelete', async () => {
            await this.dispatchMessageDeleteActivity(context);
        });
    }

    /**
     * Provides default behavior for invoke activities.
     *
     * @param context The context object for the current turn.
     * @returns {Promise<InvokeResponse>} An Invoke Response for the activity.
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     * The default logic is to check for a signIn invoke and handle that
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onInvokeActivity(context: TurnContext): Promise<InvokeResponse> {
        try {
            switch (context.activity.name) {
                case 'application/search': {
                    const invokeValue = this.getSearchInvokeValue(context.activity);
                    const response = await this.onSearchInvoke(context, invokeValue);
                    return { status: response.statusCode, body: response };
                }

                case 'adaptiveCard/action': {
                    const invokeValue = this.getAdaptiveCardInvokeValue(context.activity);
                    const response = await this.onAdaptiveCardInvoke(context, invokeValue);
                    return { status: response.statusCode, body: response };
                }

                case verifyStateOperationName:
                case tokenExchangeOperationName:
                    await this.onSignInInvoke(context);
                    return { status: StatusCodes.OK };

                default:
                    throw new InvokeException(StatusCodes.NOT_IMPLEMENTED);
            }
        } catch (err: unknown) {
            if ((err as any).message === 'NotImplemented') {
                return { status: StatusCodes.NOT_IMPLEMENTED };
            }

            if (err instanceof InvokeException) {
                return err.createInvokeResponse();
            }

            throw err;
        } finally {
            this.defaultNextEvent(context)();
        }
    }

    /**
     * Handle _signin invoke activity type_.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     */
    protected async onSignInInvoke(_context: TurnContext): Promise<void> {
        throw new InvokeException(StatusCodes.NOT_IMPLEMENTED);
    }

    /**
     * Invoked when the bot is sent an Adaptive Card Action Execute.
     *
     * @param _context the context object for the current turn
     * @param _invokeValue incoming activity value
     * @returns {Promise<AdaptiveCardInvokeResponse>} An Adaptive Card Invoke Response for the activity.
     */
    protected onAdaptiveCardInvoke(
        _context: TurnContext,
        _invokeValue: AdaptiveCardInvokeValue
    ): Promise<AdaptiveCardInvokeResponse> {
        return Promise.reject(new InvokeException(StatusCodes.NOT_IMPLEMENTED));
    }

    /**
     * Invoked when the bot is sent an invoke activity with name of 'application/search'.
     *
     * @param _context the context object for the current turn.
     * @param _invokeValue incoming activity value.
     * @returns {Promise<SearchInvokeResponse>} A Search Invoke Response for the activity.
     */
    protected onSearchInvoke(_context: TurnContext, _invokeValue: SearchInvokeValue): Promise<SearchInvokeResponse> {
        return Promise.reject(new InvokeException(StatusCodes.NOT_IMPLEMENTED));
    }

    /**
     * Runs all registered _endOfConversation_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onEndOfConversationActivity](xref:botbuilder-core.ActivityHandler.onMessage),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onEndOfConversationActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'EndOfConversation', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _typing_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onTypingActivity](xref:botbuilder-core.ActivityHandler.onTypingActivity),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onTypingActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'Typing', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _instllationupdate_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onInstallationUpdateActivity](xref:botbuilder-core.ActivityHandler.onInstallationUpdateActivity),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onInstallationUpdateActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'InstallationUpdate', async () => {
            await this.dispatchInstallationUpdateActivity(context);
        });
    }

    /**
     * Runs all registered _command_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     */
    protected async onCommandActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'Command', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _commandresult_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     */
    protected async onCommandResultActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'CommandResult', this.defaultNextEvent(context));
    }

    /**
     * Runs the _installation update_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom conversation update sub-type events.
     *
     * The default logic is:
     * - If any members were added, call handlers registered via [onMembersAdded](xref:botbuilder-core.ActivityHandler.onMembersAdded).
     * - If any members were removed, call handlers registered via [onMembersRemoved](xref:botbuilder-core.ActivityHandler.onMembersRemoved).
     * - Continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchInstallationUpdateActivity(context: TurnContext): Promise<void> {
        switch (context.activity.action) {
            case 'add':
            case 'add-upgrade':
            case 'remove':
            case 'remove-upgrade':
                await super.onInstallationUpdateActivity(context);
                break;
            default:
                await this.defaultNextEvent(context)();
        }
    }

    /**
     * Runs all registered _installation update add_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onInstallationUpdateAdd](xref:botbuilder-core.ActivityHandler.onInstallationUpdateAdd),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onInstallationUpdateAddActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'InstallationUpdateAdd', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _installation update remove_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onInstallationUpdateRemove](xref:botbuilder-core.ActivityHandler.onInstallationUpdateRemove),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onInstallationUpdateRemoveActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'InstallationUpdateRemove', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _unrecognized activity type_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onUnrecognizedActivityType](xref:botbuilder-core.ActivityHandler.onUnrecognizedActivityType),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onUnrecognizedActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'UnrecognizedActivityType', this.defaultNextEvent(context));
    }

    private getSearchInvokeValue(activity: Activity): SearchInvokeValue {
        const { value }: { value?: SearchInvokeValue } = activity;
        if (!value) {
            const response = this.createAdaptiveCardInvokeErrorResponse(
                StatusCodes.BAD_REQUEST,
                'BadRequest',
                'Missing value property for search'
            );

            throw new InvokeException(StatusCodes.BAD_REQUEST, response);
        }

        if (!value.kind) {
            if (activity.channelId === Channels.Msteams) {
                value.kind = 'search';
            } else {
                const response = this.createAdaptiveCardInvokeErrorResponse(
                    StatusCodes.BAD_REQUEST,
                    'BadRequest',
                    'Missing kind property for search.'
                );

                throw new InvokeException(StatusCodes.BAD_REQUEST, response);
            }
        }

        if (!value.queryText) {
            const response = this.createAdaptiveCardInvokeErrorResponse(
                StatusCodes.BAD_REQUEST,
                'BadRequest',
                'Missing queryText for search.'
            );

            throw new InvokeException(StatusCodes.BAD_REQUEST, response);
        }

        return value;
    }

    private getAdaptiveCardInvokeValue(activity: Activity): AdaptiveCardInvokeValue {
        const { value }: { value?: AdaptiveCardInvokeValue } = activity;
        if (!value) {
            const response = this.createAdaptiveCardInvokeErrorResponse(
                StatusCodes.BAD_REQUEST,
                'BadRequest',
                'Missing value property'
            );

            throw new InvokeException(StatusCodes.BAD_REQUEST, response);
        }

        if (value.action.type !== 'Action.Execute') {
            const response = this.createAdaptiveCardInvokeErrorResponse(
                StatusCodes.BAD_REQUEST,
                'NotSupported',
                `The action '${value.action.type}' is not supported.`
            );

            throw new InvokeException(StatusCodes.BAD_REQUEST, response);
        }

        const { action, authentication, state } = value;
        const { data, id: actionId, type, verb } = action ?? {};
        const { connectionName, id: authenticationId, token } = authentication ?? {};

        return {
            action: {
                data,
                id: actionId,
                type,
                verb,
            },
            authentication: {
                connectionName,
                id: authenticationId,
                token,
            },
            state,
        };
    }

    private createAdaptiveCardInvokeErrorResponse(
        statusCode: StatusCodes,
        code: string,
        message: string
    ): AdaptiveCardInvokeResponse {
        return {
            statusCode,
            type: 'application/vnd.microsoft.error',
            value: { code, message },
        };
    }

    /**
     * Runs all registered _conversation update_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onConversationUpdate](xref:botbuilder-core.ActivityHandler.onConversationUpdate),
     * and then continue by calling
     * [dispatchConversationUpdateActivity](xref:botbuilder-core.ActivityHandler.dispatchConversationUpdateActivity).
     */
    protected async onConversationUpdateActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'ConversationUpdate', async () => {
            await this.dispatchConversationUpdateActivity(context);
        });
    }

    /**
     * Runs the _conversation update_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom conversation update sub-type events.
     *
     * The default logic is:
     * - If any members were added, call handlers registered via [onMembersAdded](xref:botbuilder-core.ActivityHandler.onMembersAdded).
     * - If any members were removed, call handlers registered via [onMembersRemoved](xref:botbuilder-core.ActivityHandler.onMembersRemoved).
     * - Continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchConversationUpdateActivity(context: TurnContext): Promise<void> {
        if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
            await this.handle(context, 'MembersAdded', this.defaultNextEvent(context));
        } else if (context.activity.membersRemoved && context.activity.membersRemoved.length > 0) {
            await this.handle(context, 'MembersRemoved', this.defaultNextEvent(context));
        } else {
            await this.defaultNextEvent(context)();
        }
    }

    /**
     * Runs the _message update_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom conversation update sub-type events.
     *
     * The default logic to simple call [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchMessageUpdateActivity(context: TurnContext): Promise<void> {
        await this.defaultNextEvent(context)();
    }

    /**
     * Runs the _message delete_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom conversation update sub-type events.
     *
     * The default logic to simple call [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchMessageDeleteActivity(context: TurnContext): Promise<void> {
        await this.defaultNextEvent(context)();
    }
    /**
     * Runs all registered _message reaction_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onMessageReaction](xref:botbuilder-core.ActivityHandler.onMessageReaction),
     * and then continue by calling
     * [dispatchMessageReactionActivity](xref:botbuilder-core.ActivityHandler.dispatchMessageReactionActivity).
     */
    protected async onMessageReactionActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'MessageReaction', async () => {
            await this.dispatchMessageReactionActivity(context);
        });
    }

    /**
     * Runs all registered _reactions added_ handlers and then continues the event emission process.
     *
     * @param reactionsAdded The list of reactions added.
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onReactionsAdded](xref:botbuilder-core.ActivityHandler.onReactionsAdded),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onReactionsAddedActivity(reactionsAdded: MessageReaction[], context: TurnContext): Promise<void> {
        await this.handle(context, 'ReactionsAdded', this.defaultNextEvent(context));
    }

    /**
     * Runs all registered _reactions removed_ handlers and then continues the event emission process.
     *
     * @param reactionsRemoved The list of reactions removed.
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onReactionsRemoved](xref:botbuilder-core.ActivityHandler.onReactionsRemoved),
     * and then continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async onReactionsRemovedActivity(
        reactionsRemoved: MessageReaction[],
        context: TurnContext
    ): Promise<void> {
        await this.handle(context, 'ReactionsRemoved', this.defaultNextEvent(context));
    }

    /**
     * Runs the _message reaction_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom message reaction sub-type events.
     *
     * The default logic is:
     * - If reactions were added, call handlers registered via [onReactionsAdded](xref:botbuilder-core.ActivityHandler.onReactionsAdded).
     * - If reactions were removed, call handlers registered via [onMembersRemoved](xref:botbuilder-core.ActivityHandler.onMembersRemoved).
     * - Continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchMessageReactionActivity(context: TurnContext): Promise<void> {
        if (context.activity.reactionsAdded || context.activity.reactionsRemoved) {
            await super.onMessageReactionActivity(context);
        } else {
            await this.defaultNextEvent(context)();
        }
    }

    /**
     * Runs all registered event_ handlers and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels.
     *
     * The default logic is to call any handlers registered via
     * [onEvent](xref:botbuilder-core.ActivityHandler.onEvent),
     * and then continue by calling
     * [dispatchEventActivity](xref:botbuilder-core.ActivityHandler.dispatchEventActivity).
     */
    protected async onEventActivity(context: TurnContext): Promise<void> {
        await this.handle(context, 'Event', async () => {
            await this.dispatchEventActivity(context);
        });
    }

    /**
     * Runs the _event_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add custom event sub-type events.
     * For certain channels, such as  Web Chat and custom Direct Line clients, developers can emit custom event activities from the client.
     *
     * The default logic is:
     * - If the activity is a 'tokens/response' event, call handlers registered via
     *   [onTokenResponseEvent](xref:botbuilder-core.ActivityHandler.onTokenResponseEvent).
     * - Continue by calling [defaultNextEvent](xref:botbuilder-core.ActivityHandler.defaultNextEvent).
     */
    protected async dispatchEventActivity(context: TurnContext): Promise<void> {
        if (context.activity.name === tokenResponseEventName) {
            await this.handle(context, 'TokenResponseEvent', this.defaultNextEvent(context));
        } else {
            await this.defaultNextEvent(context)();
        }
    }

    /**
     * Called at the end of the event emission process.
     *
     * @param context The context object for the current turn.
     * @returns {Promise<void>} A promise representing the async operation.
     * @remarks
     * Override this method to use custom logic for emitting events.
     *
     * The default logic is to call any handlers registered via [onDialog](xref:botbuilder-core.ActivityHandler.onDialog),
     * and then complete the event emission process.
     */
    protected defaultNextEvent(context: TurnContext): () => Promise<void> {
        const runDialogs = async (): Promise<void> => {
            await this.handle(context, 'Dialog', async () => {
                // noop
            });
        };
        return runDialogs;
    }

    /**
     * Registers a bot event handler to receive a specific event.
     *
     * @param type The identifier for the event type.
     * @param handler The event handler to register.
     * @returns A reference to the [ActivityHandler](xref:botbuilder-core.ActivityHandler) object.
     */
    protected on(type: string, handler: BotHandler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler];
        } else {
            this.handlers[type].push(handler);
        }
        return this;
    }

    /**
     * Emits an event and executes any registered handlers.
     *
     * @param context The context object for the current turn.
     * @param type The identifier for the event type.
     * @param onNext The continuation function to call after all registered handlers for this event complete.
     * @returns {Promise<any>} The handler's return value.
     * @remarks
     * Runs any registered handlers for this event type and then calls the continuation function.
     *
     * This optionally produces a return value, to support _invoke_ activities. If multiple handlers
     * produce a return value, the first one produced is returned.
     */
    protected async handle(context: TurnContext, type: string, onNext: () => Promise<void>): Promise<any> {
        let returnValue: any = null;

        async function runHandler(index: number): Promise<void> {
            if (index < handlers.length) {
                const val = await handlers[index](context, () => runHandler(index + 1));
                // if a value is returned, and we have not yet set the return value,
                // capture it.  This is used to allow InvokeResponses to be returned.
                if (typeof val !== 'undefined' && returnValue === null) {
                    returnValue = val;
                }
            } else {
                const val = await onNext();
                if (typeof val !== 'undefined') {
                    returnValue = val;
                }
            }
        }

        const handlers = this.handlers[type] || [];
        await runHandler(0);

        return returnValue;
    }

    /**
     * An [InvokeResponse](xref:botbuilder.InvokeResponse) factory that initializes the body to the parameter passed and status equal to OK.
     *
     * @param body JSON serialized content from a POST response.
     * @returns A new [InvokeResponse](xref:botbuilder.InvokeResponse) object.
     */
    protected static createInvokeResponse(body?: any): InvokeResponse {
        return { status: 200, body };
    }
}
