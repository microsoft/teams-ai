// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import getStream from 'get-stream';
import pmap from 'p-map';
import { Activity, PagedResult, TranscriptInfo, TranscriptStore } from '@microsoft/teams-core';
import { sanitizeBlobKey, maybeCast } from './internals';

import {
    ContainerClient,
    ContainerListBlobHierarchySegmentResponse,
    StoragePipelineOptions,
} from '@azure/storage-blob';

// Formats a timestamp in a way that is consistent with the C# SDK
function formatTicks(timestamp: Date): string {
    const epochTicks = 621355968000000000; // the number of .net ticks at the unix epoch
    const ticksPerMillisecond = 10000; // there are 10000 .net ticks per millisecond
    const ticks = epochTicks + timestamp.getTime() * ticksPerMillisecond;
    return ticks.toString(16);
}

// Formats a channelId as a blob prefix
function getChannelPrefix(channelId: string): string {
    return sanitizeBlobKey(`${channelId}/`);
}

// Formats a channelId and conversationId as a blob prefix
function getConversationPrefix(channelId: string, conversationId: string): string {
    return sanitizeBlobKey(`${channelId}/${conversationId}`);
}

// Formats an activity as a blob key
function getBlobKey(activity: Activity, options?: BlobsTranscriptStoreOptions): string {
    const { timestamp } = z
        .object({ timestamp: z.instanceof(Date) })
        .nonstrict()
        .parse(activity);

    return sanitizeBlobKey(
        [activity.channelId, activity.conversation.id, `${formatTicks(timestamp)}-${activity.id}.json`].join('/'),
        options
    );
}

// Max number of results returned in a single Azure API call
const MAX_PAGE_SIZE = 20;

/**
 * Optional settings for BlobsTranscriptStore
 */
export interface BlobsTranscriptStoreOptions {
    /**
     * [StoragePipelineOptions](xref:@azure/storage-blob.StoragePipelineOptions) to pass to azure blob
     * storage client
     */
    storagePipelineOptions?: StoragePipelineOptions;

    /**
     * Optional setting to return a new string representing the decoded version of the given encoded blob transcript key.
     * This remains the default behavior to false, but can be overridden by setting decodeTranscriptKey to true.
     */
    decodeTranscriptKey?: boolean;
}

/**
 * BlobsTranscriptStore is a [TranscriptStore](xref:botbuilder-core.TranscriptStore) that persists
 * transcripts in Azure Blob Storage
 *
 * @summary
 * Each activity is stored as JSON blob with a key of
 * `container/{channelId]/{conversationId}/{Timestamp.ticks}-{activity.id}.json`.
 */
export class BlobsTranscriptStore implements TranscriptStore {
    private readonly _containerClient: ContainerClient;
    private readonly _concurrency = Infinity;
    private _initializePromise?: Promise<unknown>;
    private _isDecodeTranscriptKey?: boolean = false;

    /**
     * Constructs a BlobsTranscriptStore instance.
     *
     * @param {string} connectionString Azure Blob Storage connection string
     * @param {string} containerName Azure Blob Storage container name
     * @param {BlobsTranscriptStoreOptions} options Other options for BlobsTranscriptStore
     */
    constructor(connectionString: string, containerName: string, options?: BlobsTranscriptStoreOptions) {
        z.object({ connectionString: z.string(), containerName: z.string() }).parse({
            connectionString,
            containerName,
        });

        this._containerClient = new ContainerClient(connectionString, containerName, options?.storagePipelineOptions);

        this._isDecodeTranscriptKey = options?.decodeTranscriptKey;

        // At most one promise at a time to be friendly to local emulator users
        if (connectionString.trim() === 'UseDevelopmentStorage=true;') {
            this._concurrency = 1;
        }
    }

    // Protects against JSON.stringify cycles
    private toJSON(): unknown {
        return { name: 'BlobsTranscriptStore' };
    }

    private _initialize(): Promise<unknown> {
        if (!this._initializePromise) {
            this._initializePromise = this._containerClient.createIfNotExists();
        }
        return this._initializePromise;
    }

    /**
     * Get activities for a conversation (aka the transcript).
     *
     * @param {string} channelId channelId
     * @param {string} conversationId conversationId
     * @param {string} continuationToken continuation token to page through results
     * @param {Date} startDate earliest time to include in results
     * @returns {Promise<PagedResult<Activity>>} Promise that resolves to a
     * [PagedResult](xref:botbuilder-core.PagedResult) of [Activity](xref:botbuilder-core.Activity) items
     */
    async getTranscriptActivities(
        channelId: string,
        conversationId: string,
        continuationToken?: string,
        startDate?: Date
    ): Promise<PagedResult<Activity>> {
        z.object({ channelId: z.string(), conversationId: z.string() }).parse({ channelId, conversationId });

        await this._initialize();

        const iter = this._containerClient
            .listBlobsByHierarchy('/', {
                prefix: getConversationPrefix(channelId, conversationId),
            })
            .byPage({ continuationToken, maxPageSize: MAX_PAGE_SIZE });

        let page = await iter.next();
        while (!page.done) {
            // Note: azure library does not properly type iterator result, hence the need to cast
            const response = maybeCast<ContainerListBlobHierarchySegmentResponse>(page?.value ?? {});
            const blobItems = response?.segment?.blobItems ?? [];

            // Locate first index of results to slice from. If we have a start date, we want to return
            // activities after that start date. Otherwise we can simply return all activities in this page.
            const fromIdx =
                startDate != null
                    ? blobItems.findIndex(
                          (blobItem) => blobItem?.properties?.createdOn && blobItem?.properties?.createdOn >= startDate
                      )
                    : 0;

            if (fromIdx !== -1) {
                const activities = await pmap(
                    blobItems.slice(fromIdx),
                    async (blobItem) => {
                        const blob = await this._containerClient.getBlobClient(blobItem.name).download();

                        const { readableStreamBody: stream } = blob;
                        if (!stream) {
                            return null;
                        }

                        const contents = await getStream(stream as any);

                        const activity = JSON.parse(contents);
                        return { ...activity, timestamp: new Date(activity.timestamp) } as Activity;
                    },
                    { concurrency: this._concurrency }
                );

                return {
                    continuationToken: response?.continuationToken ?? '',
                    items: activities.reduce<Activity[]>(
                        (acc, activity) => (activity ? acc.concat(activity) : acc),
                        []
                    ),
                };
            }

            page = await iter.next();
        }

        return { continuationToken: '', items: [] };
    }

    /**
     * List conversations in the channelId.
     *
     * @param {string} channelId channelId
     * @param {string} continuationToken continuation token to page through results
     * @returns {Promise<PagedResult<TranscriptInfo>>} Promise that resolves to a
     * [PagedResult](xref:botbuilder-core.PagedResult) of [Activity](xref:botbuilder-core.Activity) items
     */
    async listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<TranscriptInfo>> {
        z.object({ channelId: z.string() }).parse({ channelId });

        await this._initialize();

        const page = await this._containerClient
            .listBlobsByHierarchy('/', {
                prefix: getChannelPrefix(channelId),
            })
            .byPage({ continuationToken, maxPageSize: MAX_PAGE_SIZE })
            .next();

        // Note: azure library does not properly type iterator result, hence the need to cast
        const response = maybeCast<ContainerListBlobHierarchySegmentResponse>(page?.value ?? {});
        const blobItems = response?.segment?.blobItems ?? [];

        return {
            continuationToken: response?.continuationToken ?? '',
            items: blobItems.map((blobItem) => {
                const [, id] = decodeURIComponent(blobItem.name).split('/');

                const created = blobItem.metadata?.timestamp ? new Date(blobItem.metadata.timestamp) : new Date();

                return { channelId, created, id };
            }),
        };
    }

    /**
     * Delete a specific conversation and all of its activities.
     *
     * @param {string} channelId channelId
     * @param {string} conversationId conversationId
     * @returns {Promise<void>} A promise representing the async operation.
     */
    async deleteTranscript(channelId: string, conversationId: string): Promise<void> {
        z.object({ channelId: z.string(), conversationId: z.string() }).parse({ channelId, conversationId });

        await this._initialize();

        const iter = this._containerClient
            .listBlobsByHierarchy('/', {
                prefix: getConversationPrefix(channelId, conversationId),
            })
            .byPage({
                maxPageSize: MAX_PAGE_SIZE,
            });

        let page = await iter.next();
        while (!page.done) {
            // Note: azure library does not properly type iterator result, hence the need to cast
            const response = maybeCast<ContainerListBlobHierarchySegmentResponse>(page?.value ?? {});
            const blobItems = response?.segment?.blobItems ?? [];

            await pmap(blobItems, (blobItem) => this._containerClient.deleteBlob(blobItem.name), {
                concurrency: this._concurrency,
            });

            page = await iter.next();
        }
    }

    /**
     * Log an activity to the transcript.
     *
     * @param {Activity} activity activity to log
     * @param {BlobsTranscriptStoreOptions} options Optional settings for BlobsTranscriptStore
     * @returns {Promise<void>} A promise representing the async operation.
     */
    async logActivity(activity: Activity, options?: BlobsTranscriptStoreOptions): Promise<void> {
        z.object({ activity: z.record(z.unknown()) }).parse({ activity });

        await this._initialize();

        const blob = this._containerClient.getBlockBlobClient(getBlobKey(activity, options));
        const serialized = JSON.stringify(activity);

        const metadata: Record<string, string> = {
            FromId: activity.from.id,
            RecipientId: activity.recipient.id,
        };

        if (activity.id) {
            metadata.Id = activity.id;
        }

        if (activity.timestamp) {
            metadata.Timestamp = activity.timestamp.toJSON();
        }

        await blob.upload(serialized, serialized.length, { metadata });
    }
}
