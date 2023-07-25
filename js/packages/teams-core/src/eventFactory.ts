/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Activity,
    ActivityTypes,
    Attachment,
    ConversationAccount,
    ConversationReference,
    Transcript,
} from '@microsoft/teams-connector/src/schema';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone as any);
import { HandoffEventNames } from './handoffEventNames';
import { TurnContext } from './turnContext';

/**
 * Contains utility methods for creating various event types.
 */
export class EventFactory {
    /**
     * Create handoff initiation event.
     *
     * @param context The context object for the turn.
     * @param handoffContext Agent hub-specific context.
     * @param transcript Transcript of the conversation.
     * @returns The handoff event activity.
     */
    static createHandoffInitiation<T = unknown>(
        context: TurnContext,
        handoffContext: T,
        transcript?: Transcript
    ): Activity {
        if (!context) {
            throw new TypeError('EventFactory.createHandoffInitiation(): Missing context.');
        }

        const handoffEvent = this.createHandoffEvent(
            HandoffEventNames.InitiateHandoff,
            handoffContext,
            context.activity.conversation
        );

        handoffEvent.from = context.activity.from;
        handoffEvent.relatesTo = TurnContext.getConversationReference(context.activity) as ConversationReference;
        handoffEvent.replyToId = context.activity.id;
        handoffEvent.serviceUrl = context.activity.serviceUrl;
        handoffEvent.channelId = context.activity.channelId;

        if (transcript) {
            const attachment: Attachment = {
                content: transcript,
                contentType: 'application/json',
                name: 'Transcript',
            };
            handoffEvent.attachments!.push(attachment);
        }

        return handoffEvent;
    }

    /**
     * Create handoff status event.
     *
     * @param conversation Conversation being handed over.
     * @param state State, possible values are: "accepted", "failed", "completed".
     * @param message Additional message for failed handoff.
     * @returns The handoff event activity.
     */
    static createHandoffStatus(conversation: ConversationAccount, state: string, message?: string): Activity {
        if (!conversation) {
            throw new TypeError('EventFactory.createHandoffStatus(): missing conversation.');
        }

        if (!state) {
            throw new TypeError('EventFactory.createHandoffStatus(): missing state.');
        }

        return this.createHandoffEvent(HandoffEventNames.HandoffStatus, { state, message }, conversation);
    }

    /**
     * @private
     */
    private static createHandoffEvent<T = unknown>(
        name: string,
        value: T,
        conversation: ConversationAccount
    ): Activity {
        const handoffEvent: Partial<Activity> = { type: ActivityTypes.Event };

        handoffEvent.name = name;
        handoffEvent.value = value;
        handoffEvent.id = uuidv4();
        handoffEvent.timestamp = new Date(Date.now());
        // The timestamp does not contain the local offset which is a known limitation of Date objects in JavaScript.
        // Therefore, the localTimezone is included in the handoffEvent.
        handoffEvent.localTimezone = dayjs.tz.guess();
        handoffEvent.conversation = conversation;
        handoffEvent.attachments = [];
        handoffEvent.entities = [];

        return handoffEvent as Activity;
    }
}
