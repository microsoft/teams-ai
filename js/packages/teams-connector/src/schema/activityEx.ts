/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */

import { v4 as uuid } from 'uuid';

import {
    IEndOfConversationActivity,
    IEventActivity,
    IMessageActivity,
    IContactRelationUpdateActivity,
    IConversationUpdateActivity,
    ITypingActivity,
    IHandoffActivity,
    IInvokeActivity,
    ITraceActivity,
    IInstallationUpdateActivity,
    IMessageUpdateActivity,
    IMessageDeleteActivity,
    IMessageReactionActivity,
    ISuggestionActivity,
} from './activityInterfaces';

import {
    Activity,
    ActivityEventNames,
    ActivityTypes,
    ChannelAccount,
    Channels,
    ConversationAccount,
    ConversationReference,
    ICommandActivity,
    ICommandResultActivity,
    Mention,
} from './index';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ActivityEx {
    /**
     * Creates an Activity as an IMessageActivity object.
     *
     * @returns The new message activity.
     */
    export function createMessageActivity(): Partial<IMessageActivity> {
        return { type: ActivityTypes.Message };
    }

    /**
     * Creates an Activity as an IContactRelationUpdateActivity object.
     *
     * @returns The new contact relation update activity.
     */
    export function createContactRelationUpdateActivity(): Partial<IContactRelationUpdateActivity> {
        return { type: ActivityTypes.ContactRelationUpdate };
    }

    /**
     * Creates an Activity as an IConversationUpdateActivity object.
     *
     * @returns The new conversation update activity.
     */
    export function createConversationUpdateActivity(): Partial<IConversationUpdateActivity> {
        return { type: ActivityTypes.ConversationUpdate };
    }

    /**
     * Creates an Activity as an ITypingActivity object.
     *
     * @returns The new typing activity.
     */
    export function createTypingActivity(): Partial<ITypingActivity> {
        return { type: ActivityTypes.Typing };
    }

    /**
     * Creates an Activity as an IHandoffActivity object.
     *
     * @returns The new handoff activity.
     */
    export function createHandoffActivity(): Partial<IHandoffActivity> {
        return { type: ActivityTypes.Handoff };
    }

    /**
     * Creates an Activity as an IEndOfConversationActivity object.
     *
     * @returns The new end of conversation activity.
     */
    export function createEndOfConversationActivity(): Partial<IEndOfConversationActivity> {
        return { type: ActivityTypes.EndOfConversation };
    }

    /**
     * Creates an Activity as an IEventActivity object.
     *
     * @returns The new event activity.
     */
    export function createEventActivity(): Partial<IEventActivity> {
        return { type: ActivityTypes.Event };
    }

    /**
     * Creates an Activity as an IInvokeActivity object.
     *
     * @returns The new invoke activity.
     */
    export function createInvokeActivity(): Partial<IInvokeActivity> {
        return { type: ActivityTypes.Invoke };
    }

    /**
     * Creates an Activity as an ITraceActivity object.
     *
     * @param name The name of the trace operation to create.
     * @param valueType Optional, identifier for the format of the @param value . Default is the name of type of the @param value .
     * @param value Optional, the content for this trace operation.
     * @param label Optional, a descriptive label for this trace operation.
     * @returns The new trace activity.
     */
    export function createTraceActivity(
        name: string,
        valueType?: string,
        value?: unknown,
        label?: string
    ): Partial<ITraceActivity> {
        return {
            type: ActivityTypes.Trace,
            name: name,
            label: label,
            valueType: valueType ? valueType : typeof value,
            value: value,
        };
    }

    /**
     * Creates a new message activity as a response to this activity.
     *
     * @param source The activity to respond.
     * @param text The text of the reply.
     * @param locale The language code for the @param text .
     * @returns The new message activity.
     * @remarks The new activity sets up routing information based on this activity.
     */
    export function createReply(source: Activity, text?: string, locale?: string): Activity {
        return {
            type: ActivityTypes.Message,
            timestamp: new Date(),
            from: {
                id: source.recipient ? source.recipient.id : null,
                name: source.recipient ? source.recipient.name : null,
            } as ChannelAccount,
            recipient: {
                id: source.from ? source.from.id : null,
                name: source.from ? source.from.name : null,
            } as ChannelAccount,
            replyToId: getAppropriateReplyToId(source),
            serviceUrl: source.serviceUrl,
            channelId: source.channelId,
            conversation: {
                isGroup: source.conversation.isGroup,
                id: source.conversation.id,
                name: source.conversation.name,
            } as ConversationAccount,
            text: text || '',
            locale: locale || source.locale,
            label: source.label,
            callerId: source.callerId,
            valueType: source.valueType,
            localTimezone: source.localTimezone,
            listenFor: source.listenFor,
            semanticAction: source.semanticAction,
        };
    }

    /**
     * Creates a new trace activity based on the source activity.
     *
     * @param source The activity to base the trace.
     * @param name The name of the trace operation to create.
     * @param value Optional, the content for this trace operation.
     * @param valueType Optional, identifier for the format of the @param value . Default is the name of type of the @param value .
     * @param label Optional, a descriptive label for this trace operation.
     * @returns The new trace activity.
     */
    export function createTrace(
        source: Activity,
        name: string,
        value?: unknown,
        valueType?: string,
        label?: string
    ): ITraceActivity {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            from: {
                id: source.recipient ? source.recipient.id : null,
                name: source.recipient ? source.recipient.name : null,
            } as ChannelAccount,
            recipient: {
                id: source.from ? source.from.id : null,
                name: source.from ? source.from.name : null,
            } as ChannelAccount,
            replyToId: getAppropriateReplyToId(source),
            serviceUrl: source.serviceUrl,
            channelId: source.channelId,
            conversation: source.conversation,
            name: name,
            label: label,
            valueType: valueType ? valueType : typeof value,
            value: value,
        };
    }

    /**
     * Returns the source activity as an IMessageActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a message activity; or null.
     */
    export function asMessageActivity(source: Partial<Activity>): Partial<IMessageActivity>|null {
        return isActivity(source, ActivityTypes.Message) ? source : null;
    }

    /**
     * Returns the source activity as an IContactRelationUpdateActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a contact relation update activity; or null.
     */
    export function asContactRelationUpdateActivity(
        source: Partial<Activity>
    ): Partial<IContactRelationUpdateActivity>|null {
        return isActivity(source, ActivityTypes.ContactRelationUpdate) ? source : null;
    }

    /**
     * Returns the source activity as an IInstallationUpdateActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as an installation update activity; or null.
     */
    export function asInstallationUpdateActivity(source: Partial<Activity>): Partial<IInstallationUpdateActivity>|null {
        return isActivity(source, ActivityTypes.InstallationUpdate) ? source : null;
    }

    /**
     * Returns the source activity as an IConversationUpdateActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as an conversation update activity; or null.
     */
    export function asConversationUpdateActivity(source: Partial<Activity>): Partial<IConversationUpdateActivity>|null {
        return isActivity(source, ActivityTypes.ConversationUpdate) ? source : null;
    }

    /**
     * Returns the source activity as an ITypingActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a typing activity; or null.
     */
    export function asTypingActivity(source: Partial<Activity>): Partial<ITypingActivity>|null {
        return isActivity(source, ActivityTypes.Typing) ? source : null;
    }

    /**
     * Returns the source activity as an IEndOfConversationActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as an end of conversation activity; or null.
     */
    export function asEndOfConversationActivity(source: Partial<Activity>): Partial<IEndOfConversationActivity>|null {
        return isActivity(source, ActivityTypes.EndOfConversation) ? source : null;
    }

    /**
     * Returns the source activity as an IEventActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as an event activity; or null.
     */
    export function asEventActivity(source: Partial<Activity>): Partial<IEventActivity>|null {
        return isActivity(source, ActivityTypes.Event) ? source : null;
    }

    /**
     * Returns the source activity as an IInvokeActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as an invoke activity; or null.
     */
    export function asInvokeActivity(source: Partial<Activity>): Partial<IInvokeActivity>|null {
        return isActivity(source, ActivityTypes.Invoke) ? source : null;
    }

    /**
     * Returns the source activity as an IMessageUpdateActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a message update request; or null.
     */
    export function asMessageUpdateActivity(source: Partial<Activity>): Partial<IMessageUpdateActivity>|null {
        return isActivity(source, ActivityTypes.MessageUpdate) ? source : null;
    }

    /**
     * Returns the source activity as an IMessageDeleteActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a message delete request; or null.
     */
    export function asMessageDeleteActivity(source: Partial<Activity>): Partial<IMessageDeleteActivity>|null {
        return isActivity(source, ActivityTypes.MessageDelete) ? source : null;
    }

    /**
     * Returns the source activity as an IMessageReactionActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a message reaction activity; or null.
     */
    export function asMessageReactionActivity(source: Partial<Activity>): Partial<IMessageReactionActivity>|null {
        return isActivity(source, ActivityTypes.MessageReaction) ? source : null;
    }

    /**
     * Returns the source activity as an ISuggestionActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a suggestion activity; or null.
     */
    export function asSuggestionActivity(source: Partial<Activity>): Partial<ISuggestionActivity>|null {
        return isActivity(source, ActivityTypes.Suggestion) ? source : null;
    }

    /**
     * Returns the source activity as an ITraceActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a trace activity; or null.
     */
    export function asTraceActivity(source: Partial<Activity>): Partial<ITraceActivity>|null {
        return isActivity(source, ActivityTypes.Trace) ? source : null;
    }

    /**
     * Returns the source activity as an IHandoffActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a handoff activity; or null.
     */
    export function asHandoffActivity(source: Partial<Activity>): Partial<IHandoffActivity>|null {
        return isActivity(source, ActivityTypes.Handoff) ? source : null;
    }

    /**
     * Returns the source activity as an ICommandActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a command activity; or null.
     */
    export function asCommandActivity<T = unknown>(source: Partial<Activity>): Partial<ICommandActivity<T>>|null {
        return isActivity(source, ActivityTypes.Command) ? source : null;
    }

    /**
     * Returns the source activity as an ICommandResultActivity object; or null, if this is not that type of activity.
     *
     * @param source The source activity.
     * @returns This activity as a command result activity; or null.
     */
    export function asCommandResultActivity<T = unknown>(
        source: Partial<Activity>
    ): Partial<ICommandResultActivity<T>>|null {
        return isActivity(source, ActivityTypes.CommandResult) ? source : null;
    }

    /**
     * Indicates whether the source activity has content.
     *
     * @param source The source activity.
     * @returns True, if this activity has any content to send; otherwise, false.
     * @remarks This method is only intended for use with a message activity, where the Activity Type is set to Message.
     */
    export function hasContent(source: Partial<Activity>): boolean {
        if (source.text !== undefined && source.text.trim().length > 0) {
            return true;
        }

        if (source.summary !== undefined && source.summary.trim().length > 0) {
            return true;
        }

        if (source.attachments !== undefined && source.attachments.length > 0) {
            return true;
        }

        if (source.channelData !== undefined) {
            return true;
        }

        return false;
    }

    /**
     * Resolves the mentions from the entities of the source activity.
     *
     * @param source The source activity.
     * @returns The array of mentions; or an empty array, if none are found.
     * @remarks This method is only intended for use with a message activity, where the Activity Type is set to Message.
     * @see cref="entities" .
     * @see cref="mention" .
     */
    export function getMentions(source: Partial<Activity>): Mention[] {
        return (source.entities ?? []).filter((x) => x.type.toLowerCase() === 'mention').map((e) => e as Mention);
    }

    /**
     * Creates a ConversationReference based on the source activity.
     *
     * @param source The source activity.
     * @returns A conversation reference for the conversation that contains the activity.
     */
    export function getConversationReference(source: Partial<Activity>): ConversationReference {
        return {
            activityId: getAppropriateReplyToId(source),
            bot: source.recipient!,
            channelId: source.channelId!,
            conversation: source.conversation!,
            locale: source.locale,
            serviceUrl: source.serviceUrl!,
            user: source.from,
        };
    }

    /**
     * Creates an Activity from conversation reference as it is posted to bot.
     *
     * @param reference the conversation reference
     * @returns the activity
     */
    export function getContinuationActivity(reference: Partial<ConversationReference>): Partial<Activity> {
        return {
            type: ActivityTypes.Event,
            name: ActivityEventNames.ContinueConversation,
            id: uuid(),
            channelId: reference.channelId,
            locale: reference.locale,
            serviceUrl: reference.serviceUrl,
            conversation: reference.conversation,
            recipient: reference.bot,
            from: reference.user,
            relatesTo: reference as ConversationReference,
        };
    }

    /**
     * Determines if the Activity was sent via an Http/Https connection or Streaming.
     * This can be determined by looking at the ServiceUrl property:
     * (1) All channels that send messages via http/https are not streaming
     * (2) Channels that send messages via streaming have a ServiceUrl that does not begin with http/https.
     *
     * @param source The source activity.
     * @returns True if the Activity was originate from a streaming connection.
     */
    export function isFromStreamingConnection(source: Partial<Activity>): boolean {
        if (source.serviceUrl !== undefined) {
            const isHttp: boolean = source.serviceUrl.toLowerCase().startsWith('http');
            return !isHttp;
        }
        return false;
    }

    /**
     * Indicates whether this activity is of a specified activity type.
     *
     * @param source The source activity.
     * @param activityType The activity type to check for.
     * @returns True if the activity is of the specified activity type; otherwise, false.
     */
    export function isActivity(source: Partial<Activity>, activityType: string): boolean {
        /*
         * NOTE: This code was migrated from .NET implementation applying optimizations to make
         * it more verbose. The goal is to have zero allocations because it is called by all
         * of the .asXXXActivity methods to "pseudo-cast" the activity based on its type.
         */

        const type = source.type;

        // If there's no type set then we can't tell if it's the type they're looking for
        if (type == undefined || typeof type !== 'string') {
            return false;
        }

        // Check if the full type value starts with the type they're looking for
        let result: boolean = type.toUpperCase().startsWith(activityType.toUpperCase());

        // If the full type value starts with the type they're looking for, then we need to check if it's definitely the right type
        if (result) {
            // If the lengths are equal, then it's the exact type they're looking for
            result = type.length === activityType.length;
        }

        if (!result) {
            // Finally, if the type is longer than the type they're looking for then we need to check if there's a / separator right after the type they're looking for
            result = type.length > activityType.length && type[activityType.length] === '/';
        }

        return result;
    }
}

function getAppropriateReplyToId(source: Partial<Activity>): string | undefined {
    if (
        source.type !== ActivityTypes.ConversationUpdate ||
        (source.channelId !== Channels.Directline && source.channelId !== Channels.Webchat)
    ) {
        return source.id;
    }

    return undefined;
}
