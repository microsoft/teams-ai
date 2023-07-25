/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ActivityTypes, ChannelAccount, MessageReaction, TurnContext } from '.';
import { InvokeResponse } from './invokeResponse';
import { StatusCodes } from '@microsoft/teams-connector/src/schema';

// This key is exported internally so that subclassed ActivityHandlers and BotAdapters will not override any already set InvokeResponses.
export const INVOKE_RESPONSE_KEY = Symbol('invokeResponse');

/**
 * Defines the core behavior for event-emitting activity handlers for bots.
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
 * | Type-specific | Emitted for the specific activity type, before emitting an event for any sub-type. |
 * | Sub-type | Emitted for certain specialized events, based on activity content. |
 *
 * **See also**
 * - The [Bot Framework Activity schema](https://aka.ms/botSpecs-activitySchema)
 */
export class ActivityHandlerBase {
    /**
     * Called at the start of the event emission process.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to use custom logic for emitting events.
     *
     * The default logic is to call any type-specific and sub-type handlers registered via
     * the various _on event_ methods. Type-specific events are defined for:
     * - Message activities
     * - Conversation update activities
     * - Message reaction activities
     * - Event activities
     * - Invoke activities
     * - _Unrecognized_ activities, ones that this class has not otherwise defined an _on event_ method for.
     */
    protected async onTurnActivity(context: TurnContext): Promise<void> {
        switch (context.activity.type) {
            case ActivityTypes.Message:
                await this.onMessageActivity(context);
                break;
            case ActivityTypes.MessageUpdate:
                await this.onMessageUpdateActivity(context);
                break;
            case ActivityTypes.MessageDelete:
                await this.onMessageDeleteActivity(context);
                break;
            case ActivityTypes.ConversationUpdate:
                await this.onConversationUpdateActivity(context);
                break;
            case ActivityTypes.MessageReaction:
                await this.onMessageReactionActivity(context);
                break;
            case ActivityTypes.Event:
                await this.onEventActivity(context);
                break;
            case ActivityTypes.Invoke: {
                const invokeResponse = await this.onInvokeActivity(context);
                // If onInvokeActivity has already sent an InvokeResponse, do not send another one.
                if (invokeResponse && !context.turnState.get(INVOKE_RESPONSE_KEY)) {
                    await context.sendActivity({ value: invokeResponse, type: 'invokeResponse' });
                }
                break;
            }
            case ActivityTypes.EndOfConversation:
                await this.onEndOfConversationActivity(context);
                break;
            case ActivityTypes.Typing:
                await this.onTypingActivity(context);
                break;
            case ActivityTypes.InstallationUpdate:
                await this.onInstallationUpdateActivity(context);
                break;
            case ActivityTypes.Command:
                await this.onCommandActivity(context);
                break;
            case ActivityTypes.CommandResult:
                await this.onCommandResultActivity(context);
                break;
            default:
                // handler for unknown or unhandled types
                await this.onUnrecognizedActivity(context);
                break;
        }
    }

    /**
     * Provides a hook for emitting the _message_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _message_ handlers and then continue the event
     * emission process.
     */
    protected async onMessageActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _message update_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _message update_ handlers and then continue the event
     * emission process.
     */
    protected async onMessageUpdateActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _message delete_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _message delete_ handlers and then continue the event
     * emission process.
     */
    protected async onMessageDeleteActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _conversation update_ event.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _conversation update_ handlers and then continue the event
     * emission process.
     *
     * The default logic is:
     * - If members other than the bot were added to the conversation,
     *   call [onMembersAddedActivity](xref:botbuilder-core.ActivityHandlerBase.onMembersAddedActivity).
     * - If members other than the bot were removed from the conversation,
     *   call [onMembersRemovedActivity](xref:botbuilder-core.ActivityHandlerBase.onMembersRemovedActivity).
     */
    protected async onConversationUpdateActivity(context: TurnContext): Promise<void> {
        if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
            if (
                context.activity.membersAdded.filter(
                    (m) => context.activity.recipient && context.activity.recipient.id !== m.id
                ).length
            ) {
                await this.onMembersAddedActivity(context.activity.membersAdded, context);
            }
        } else if (context.activity.membersRemoved && context.activity.membersRemoved.length > 0) {
            if (
                context.activity.membersRemoved.filter(
                    (m) => context.activity.recipient && context.activity.recipient.id !== m.id
                ).length
            ) {
                await this.onMembersRemovedActivity(context.activity.membersRemoved, context);
            }
        }
    }

    /**
     * Provides a hook for emitting the _message reaction_ event.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _message reaction_ handlers and then continue the event
     * emission process.
     *
     * The default logic is:
     * - If reactions were added to a message,
     *   call [onReactionsAddedActivity](xref:botbuilder-core.ActivityHandlerBase.onReactionsAddedActivity).
     * - If reactions were removed from a message,
     *   call [onReactionsRemovedActivity](xref:botbuilder-core.ActivityHandlerBase.onReactionsRemovedActivity).
     */
    protected async onMessageReactionActivity(context: TurnContext): Promise<void> {
        if (context.activity.reactionsAdded?.length) {
            await this.onReactionsAddedActivity(context.activity.reactionsAdded, context);
        }

        if (context.activity.reactionsRemoved?.length) {
            await this.onReactionsRemovedActivity(context.activity.reactionsRemoved, context);
        }
    }

    /**
     * Provides a hook for emitting the _event_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _event_ handlers and then continue the event
     * emission process.
     */
    protected async onEventActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for invoke calls.
     *
     * @param _context The context object for the current turn.
     * @returns {Promise<InvokeResponse>} An Invoke Response for the activity.
     * @remarks
     * Override this method to handle particular invoke calls.
     */
    protected async onInvokeActivity(_context: TurnContext): Promise<InvokeResponse> {
        return { status: StatusCodes.NOT_IMPLEMENTED };
    }

    /**
     * Provides a hook for emitting the _end of conversation_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _end of conversation_ handlers and then continue the event
     * emission process.
     */
    protected async onEndOfConversationActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _typing_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _typing_ handlers and then continue the event
     * emission process.
     */
    protected async onTypingActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _installationupdate_ event.
     *
     * @param context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _installationupdate_ handlers and then continue the event
     * emission process.
     */
    protected async onInstallationUpdateActivity(context: TurnContext): Promise<void> {
        switch (context.activity.action) {
            case 'add':
            case 'add-upgrade':
                await this.onInstallationUpdateAddActivity(context);
                return;
            case 'remove':
            case 'remove-upgrade':
                await this.onInstallationUpdateRemoveActivity(context);
                return;
        }
    }

    /**
     * Provides a hook for emitting the _installationupdateadd_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _installationupdateadd_ handlers and then continue the event
     * emission process.
     */
    protected async onInstallationUpdateAddActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _installationupdateremove_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _installationupdateremove_ handlers and then continue the event
     * emission process.
     */
    protected async onInstallationUpdateRemoveActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _unrecognized_ event.
     *
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _unrecognized_ handlers and then continue the event
     * emission process.
     */
    protected async onUnrecognizedActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _members added_ event,
     * a sub-type of the _conversation update_ event.
     *
     * @param _membersAdded An array of the members added to the conversation.
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _members added_ handlers and then continue the event
     * emission process.
     */
    protected async onMembersAddedActivity(_membersAdded: ChannelAccount[], _context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _members removed_ event,
     * a sub-type of the _conversation update_ event.
     *
     * @param _membersRemoved An array of the members removed from the conversation.
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _members removed_ handlers and then continue the event
     * emission process.
     */
    protected async onMembersRemovedActivity(_membersRemoved: ChannelAccount[], _context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _reactions added_ event,
     * a sub-type of the _message reaction_ event.
     *
     * @param _reactionsAdded An array of the reactions added to a message.
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _reactions added_ handlers and then continue the event
     * emission process.
     */
    protected async onReactionsAddedActivity(_reactionsAdded: MessageReaction[], _context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Provides a hook for emitting the _reactions removed_ event,
     * a sub-type of the _message reaction_ event.
     *
     * @param _reactionsRemoved An array of the reactions removed from a message.
     * @param _context The context object for the current turn.
     *
     * @remarks
     * Override this method to run registered _reactions removed_ handlers and then continue the event
     * emission process.
     */
    protected async onReactionsRemovedActivity(
        _reactionsRemoved: MessageReaction[],
        _context: TurnContext
    ): Promise<void> {
        return;
    }

    /**
     * Invoked when a command activity is received when the base behavior of
     * `onTurn()` is used.
     * Commands are requests to perform an action and receivers typically respond with
     * one or more commandResult activities. Receivers are also expected to explicitly
     * reject unsupported command activities.
     *
     * @param _context A context object for this turn.
     * @returns A promise that represents the work queued to execute.
     */
    protected async onCommandActivity(_context: TurnContext): Promise<void> {
        return;
    }

    /**
     * Invoked when a commandResult activity is received when the base behavior of
     * `onTurn()` is used.
     * CommandResult activity can be used to communicate the result of a command execution.
     *
     * @param _context A context object for this turn.
     * @returns A promise that represents the work queued to execute.
     */
    protected async onCommandResultActivity(_context: TurnContext): Promise<void> {
        return;
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
     *          // Route to main dialog.
     *          await bot.run(context);
     *      });
     * });
     * ```
     *
     * **See also**
     * - [BotFrameworkAdapter.processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity)
     */
    async run(context: TurnContext): Promise<void> {
        if (!context) {
            throw new Error('Missing TurnContext parameter');
        }

        if (!context.activity) {
            throw new Error('TurnContext does not include an activity');
        }

        if (!context.activity.type) {
            throw new Error('Activity is missing its type');
        }

        // List of all Activity Types:
        // https://github.com/Microsoft/botbuilder-js/blob/main/libraries/botframework-schema/src/index.ts#L1627
        await this.onTurnActivity(context);
    }
}
