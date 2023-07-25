/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity } from '@microsoft/teams-connector/src/schema';
import { PagedResult, TranscriptInfo, TranscriptStore } from './transcriptLogger';

/**
 * The memory transcript store stores transcripts in volatile memory in a Map.
 *
 * @remarks
 * Because this uses an unbounded volatile dictionary this should only be used for unit tests or
 * non-production environments.
 */
export class MemoryTranscriptStore implements TranscriptStore {
    private static readonly pageSize: number = 20;

    private channels: Map<string, Map<string, Activity[]>> = new Map<string, Map<string, Activity[]>>();

    /**
     * Log an activity to the transcript.
     *
     * @param activity Activity to log.
     * @returns {Promise<void>} A promise representing the async operation.
     */
    logActivity(activity: Activity): void | Promise<void> {
        if (!activity) {
            throw new Error('activity cannot be null for logActivity()');
        }

        // get channel
        let channel: Map<string, Activity[]>;
        if (!this.channels.has(activity.channelId)) {
            channel = new Map<string, Activity[]>();
            this.channels.set(activity.channelId, channel);
        } else {
            channel = this.channels.get(activity.channelId)!;
        }

        // get conversation transcript
        let transcript: Activity[];
        if (!channel.has(activity.conversation.id)) {
            transcript = [];
            channel.set(activity.conversation.id, transcript);
        } else {
            transcript = channel.get(activity.conversation.id)!;
        }

        transcript.push(activity);

        return Promise.resolve();
    }

    /**
     * Get activities from the memory transcript store.
     *
     * @param channelId Channel Id.
     * @param conversationId Conversation Id.
     * @param continuationToken Continuation token to page through results.
     * @param startDate Earliest time to include.
     * @returns {Promise<PagedResult<Activity>>} A page of matching activities.
     */
    getTranscriptActivities(
        channelId: string,
        conversationId: string,
        continuationToken?: string,
        startDate?: Date
    ): Promise<PagedResult<Activity>> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        if (!conversationId) {
            throw new Error('Missing conversationId');
        }

        const pagedResult: PagedResult<Activity> = { items: [], continuationToken: undefined as any };
        if (this.channels.has(channelId)) {
            const channel: Map<string, Activity[]> = this.channels.get(channelId)!;
            if (channel.has(conversationId)) {
                const transcript: Activity[] = channel.get(conversationId)!;
                if (continuationToken) {
                    pagedResult.items = transcript
                        .sort(timestampSorter)
                        .filter((a: Activity) => !startDate || a.timestamp! >= startDate)
                        .filter(skipWhileExpression((a: Activity) => a.id !== continuationToken))
                        .slice(1, MemoryTranscriptStore.pageSize + 1);
                } else {
                    pagedResult.items = transcript
                        .sort(timestampSorter)
                        .filter((a: Activity) => !startDate || a.timestamp! >= startDate)
                        .slice(0, MemoryTranscriptStore.pageSize);
                }

                if (pagedResult.items.length === MemoryTranscriptStore.pageSize) {
                    pagedResult.continuationToken = pagedResult.items[pagedResult.items.length - 1].id!;
                }
            }
        }

        return Promise.resolve(pagedResult);
    }

    /**
     * List conversations in the channelId.
     *
     * @param channelId Channel Id.
     * @param continuationToken Continuation token to page through results.
     * @returns {Promise<PagedResult<TranscriptInfo>>} A page of conversations for a channel from the store.
     */
    listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<TranscriptInfo>> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        const pagedResult: PagedResult<TranscriptInfo> = { items: [], continuationToken: undefined as any };
        if (this.channels.has(channelId)) {
            const channel: Map<string, Activity[]> = this.channels.get(channelId)!;

            if (continuationToken) {
                pagedResult.items = Array.from(channel.entries())
                    .map((kv: [string, Activity[]]) => ({
                        channelId,
                        id: kv[0],
                        created: getDate(kv[1]),
                    }))
                    .sort(createdSorter)
                    .filter(skipWhileExpression((a: any) => a.id !== continuationToken))
                    .slice(1, MemoryTranscriptStore.pageSize + 1);
            } else {
                pagedResult.items = Array.from(channel.entries())
                    .map((kv: [string, Activity[]]) => ({
                        channelId,
                        id: kv[0],
                        created: getDate(kv[1]),
                    }))
                    .sort(createdSorter)
                    .slice(0, MemoryTranscriptStore.pageSize);
            }

            if (pagedResult.items.length === MemoryTranscriptStore.pageSize) {
                pagedResult.continuationToken = pagedResult.items[pagedResult.items.length - 1].id;
            }
        }

        return Promise.resolve(pagedResult);
    }

    /**
     * Delete a specific conversation and all of it's activities.
     *
     * @param channelId Channel Id where conversation took place.
     * @param conversationId Id of the conversation to delete.
     * @returns {Promise<void>} A promise representing the async operation.
     */
    deleteTranscript(channelId: string, conversationId: string): Promise<void> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        if (!conversationId) {
            throw new Error('Missing conversationId');
        }

        if (this.channels.has(channelId)) {
            const channel: Map<string, Activity[]> = this.channels.get(channelId)!;
            if (channel.has(conversationId)) {
                channel.delete(conversationId);
            }
        }

        return Promise.resolve();
    }
}

/**
 * @private
 */
const createdSorter: (a: TranscriptInfo, b: TranscriptInfo) => number = (
    a: TranscriptInfo,
    b: TranscriptInfo
): number => a.created.getTime() - b.created.getTime();

/**
 * @private
 */
const timestampSorter: (a: Activity, b: Activity) => number = (a: Activity, b: Activity): number =>
    a.timestamp!.getTime() - b.timestamp!.getTime();

/**
 * @private
 */
const skipWhileExpression: (expression: any) => (item: any) => boolean = (
    expression: any
): ((item: any) => boolean) => {
    let skipping = true;

    return (item: any): boolean => {
        if (!skipping) {
            return true;
        }
        if (!expression(item)) {
            skipping = false;
        }

        return !skipping;
    };
};

/**
 * @private
 */
const getDate: (activities: Activity[]) => Date = (activities: Activity[]): Date => {
    if (activities && activities.length > 0) {
        return activities[0].timestamp || new Date(0);
    }

    return new Date(0);
};
