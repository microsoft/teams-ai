/**
 * @module botbuilder-azure
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as azure from 'azure-storage';
import { Activity, PagedResult, TranscriptInfo, TranscriptStore } from '@microsoft/teams-core';
import { escape } from 'querystring';
import { BlobStorageSettings } from './blobStorage';

const ContainerNameCheck = new RegExp('^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$');

/**
 * @private
 * Unique ket used to access the static <code>checkedCollections</code>
 * property of the AzureBlobTranscriptStore. Accessing it is necessary for
 * proper testing and debugging.
 */
export const checkedCollectionsKey = Symbol('checkedCollectionsKey');

/**
 * Stores transcripts in an Azure Blob container.
 *
 * @remarks
 * Each activity is stored as JSON blob with a structure of
 * `container/{channelId]/{conversationId}/{Timestamp.ticks}-{activity.id}.json`.
 *
 * @deprecated This class is deprecated in favor of [BlobsTranscriptStore](xref:botbuilder-azure-blobs.BlobsTranscriptStore)
 */
export class AzureBlobTranscriptStore implements TranscriptStore {
    /**
     * @private
     * Internal dictionary with the containers where entities will be stored.
     */
    private static [checkedCollectionsKey]: { [key: string]: Promise<azure.BlobService.ContainerResult> } = {};
    private readonly settings: BlobStorageSettings;
    private client: BlobServiceAsync;
    private pageSize = 20;

    /**
     * Creates a new AzureBlobTranscriptStore instance.
     *
     * @param settings Settings required for configuring an instance of BlobStorage
     */
    constructor(settings: BlobStorageSettings) {
        if (!settings) {
            throw new Error('The settings parameter is required.');
        }

        if (!settings.containerName) {
            throw new Error('The containerName is required.');
        }

        if (!this.checkContainerName(settings.containerName)) {
            throw new Error('Invalid container name.');
        }

        this.settings = { ...settings };
        this.client = this.createBlobService(this.settings);
    }

    /**
     * Log an activity to the transcript.
     *
     * @param activity Activity being logged.
     */
    async logActivity(activity: Activity): Promise<void> {
        if (!activity) {
            throw new Error('Missing activity.');
        }

        const blobName: string = this.getBlobName(activity);
        const data: string = JSON.stringify(activity);
        const container = await this.ensureContainerExists();

        const block = await this.client.createBlockBlobFromTextAsync(container.name, blobName, data, undefined as any);
        const meta = this.client.setBlobMetadataAsync(container.name, blobName, {
            fromid: activity.from.id,
            recipientid: activity.recipient.id,
            timestamp: activity.timestamp!.toJSON(),
        });

        const props = this.client.setBlobPropertiesAsync(container.name, blobName, {
            contentType: 'application/json',
        });

        await Promise.all([block, meta, props]); // Concurrent
    }

    /**
     * Get activities for a conversation (Aka the transcript)
     *
     * @param channelId Channel Id.
     * @param conversationId Conversation Id.
     * @param continuationToken Continuation token to page through results.
     * @param startDate Earliest time to include.
     * @returns The PagedResult of activities.
     */
    async getTranscriptActivities(
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

        if (!startDate) {
            startDate = new Date(0);
        }

        // tslint:disable-next-line:prefer-template
        const prefix: string = this.getDirName(channelId, conversationId) + '/';
        const token: azure.common.ContinuationToken|undefined = undefined;

        const container = await this.ensureContainerExists();
        const activityBlobs = await this.getActivityBlobs(
            [],
            container.name,
            prefix,
            continuationToken!,
            startDate,
            token!
        );
        const activities = await Promise.all(activityBlobs.map((blob) => this.blobToActivity(blob)));
        const pagedResult: PagedResult<Activity> = { items: activities, continuationToken: undefined as any };
        if (pagedResult.items.length === this.pageSize) {
            pagedResult.continuationToken = activityBlobs.slice(-1).pop()!.name;
        }

        return pagedResult;
    }

    /**
     * List conversations in the channelId.
     *
     * @param channelId Channel Id.
     * @param continuationToken ContinuationToken token to page through results.
     * @returns A promise representation of [PagedResult<TranscriptInfo>](xref:botbuilder-core.PagedResult)
     */
    async listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<TranscriptInfo>> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        // tslint:disable-next-line:prefer-template
        const prefix: string = this.getDirName(channelId) + '/';
        const token: azure.common.ContinuationToken|undefined = undefined;

        const container = await this.ensureContainerExists();
        const transcripts = await this.getTranscriptsFolders(
            [],
            container.name,
            prefix,
            continuationToken!,
            channelId,
            token!
        );

        const pagedResult: PagedResult<TranscriptInfo> = { items: transcripts, continuationToken: undefined as any };
        if (pagedResult.items.length === this.pageSize) {
            pagedResult.continuationToken = transcripts.slice(-1).pop()!.id;
        }

        return pagedResult;
    }

    /**
     * Delete a specific conversation and all of it's activities.
     *
     * @param channelId Channel Id where conversation took place.
     * @param conversationId Id of the conversation to delete.
     */
    async deleteTranscript(channelId: string, conversationId: string): Promise<void> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        if (!conversationId) {
            throw new Error('Missing conversationId');
        }

        // tslint:disable-next-line:prefer-template
        const prefix: string = this.getDirName(channelId, conversationId) + '/';
        const token: azure.common.ContinuationToken|undefined = undefined;

        const container = await this.ensureContainerExists();
        const conversationBlobs = await this.getConversationsBlobs([], container.name, prefix, token!);
        await Promise.all(
            conversationBlobs.map((blob) => this.client.deleteBlobIfExistsAsync(blob.container, blob.name))
        );
    }

    /**
     * Parse a BlobResult as an [Activity](xref:botframework-schema.Activity).
     *
     * @param blob BlobResult to parse as an [Activity](xref:botframework-schema.Activity).
     * @returns The parsed [Activity](xref:botframework-schema.Activity).
     */
    private async blobToActivity(blob: azure.BlobService.BlobResult): Promise<Activity> {
        const content = await this.client.getBlobToTextAsync(blob.container, blob.name);
        const activity: Activity = JSON.parse(content as any) as Activity;
        activity.timestamp = new Date(activity.timestamp!);

        return activity;
    }

    /**
     * @private
     */
    private async getActivityBlobs(
        blobs: azure.BlobService.BlobResult[],
        container: string,
        prefix: string,
        continuationToken: string,
        startDate: Date,
        token: azure.common.ContinuationToken
    ): Promise<azure.BlobService.BlobResult[]> {
        const listBlobResult = await this.client.listBlobsSegmentedWithPrefixAsync(container, prefix, token, {
            include: 'metadata',
        });
        listBlobResult.entries.some((blob) => {
            const timestamp: Date = new Date(blob.metadata!.timestamp);
            if (timestamp >= startDate) {
                if (continuationToken) {
                    if (blob.name === continuationToken) {
                        continuationToken = undefined as any;
                    }
                } else {
                    blob.container = container;
                    blobs.push(blob);

                    return blobs.length === this.pageSize;
                }
            }

            return false;
        });

        if (listBlobResult.continuationToken && blobs.length < this.pageSize) {
            await this.getActivityBlobs(
                blobs,
                container,
                prefix,
                continuationToken,
                startDate,
                listBlobResult.continuationToken
            );
        }
        return blobs;
    }

    /**
     * @private
     */
    private async getTranscriptsFolders(
        transcripts: TranscriptInfo[],
        container: string,
        prefix: string,
        continuationToken: string,
        channelId: string,
        token: azure.common.ContinuationToken
    ): Promise<TranscriptInfo[]> {
        const result = await this.client.listBlobDirectoriesSegmentedWithPrefixAsync(container, prefix, token);
        result.entries.some((blob) => {
            const conversation: TranscriptInfo = {
                channelId: channelId,
                id: blob.name
                    .split('/')
                    .filter((part: string) => part)
                    .slice(-1)
                    .pop()!,
                created: undefined as any,
            };
            if (continuationToken) {
                if (conversation.id === continuationToken) {
                    continuationToken = undefined as any;
                }
            } else {
                transcripts.push(conversation);

                return transcripts.length === this.pageSize;
            }

            return false;
        });

        if (result.continuationToken && transcripts.length < this.pageSize) {
            await this.getTranscriptsFolders(
                transcripts,
                container,
                prefix,
                continuationToken,
                channelId,
                result.continuationToken
            );
        }
        return transcripts;
    }

    /**
     * @private
     */
    private async getConversationsBlobs(
        blobs: azure.BlobService.BlobResult[],
        container: string,
        prefix: string,
        token: azure.common.ContinuationToken
    ): Promise<azure.BlobService.BlobResult[]> {
        const result = await this.client.listBlobsSegmentedWithPrefixAsync(container, prefix, token, undefined as any);
        blobs = blobs.concat(
            result.entries.map((blob: azure.BlobService.BlobResult) => {
                blob.container = container;

                return blob;
            })
        );
        if (result.continuationToken) {
            await this.getConversationsBlobs(blobs, container, prefix, result.continuationToken);
        }
        return blobs;
    }

    /**
     * Check if a container name is valid.
     *
     * @param container String representing the container name to validate.
     * @returns A boolean value that indicates whether or not the name is valid.
     */
    private checkContainerName(container: string): boolean {
        return ContainerNameCheck.test(container);
    }

    /**
     * Get the blob name based on the [Activity](xref:botframework-schema.Activity).
     *
     * @param activity [Activity](xref:botframework-schema.Activity) to get the blob name from.
     * @returns The blob name.
     */
    private getBlobName(activity: Activity): string {
        const channelId: string = this.sanitizeKey(activity.channelId);
        const conversationId: string = this.sanitizeKey(activity.conversation.id);
        const timestamp: string = this.sanitizeKey(this.getTicks(activity.timestamp!));
        const activityId: string = this.sanitizeKey(activity.id!);

        return `${channelId}/${conversationId}/${timestamp}-${activityId}.json`;
    }

    /**
     * Get the directory name.
     *
     * @param channelId Channel Id.
     * @param conversationId Id of the conversation to get the directory name from.
     * @returns The sanitized directory name.
     */
    private getDirName(channelId: string, conversationId?: string): string {
        if (!conversationId) {
            return this.sanitizeKey(channelId);
        }

        return `${this.sanitizeKey(channelId)}/${this.sanitizeKey(conversationId)}`;
    }

    /**
     * Escape a given key to be compatible for use with BlobStorage.
     *
     * @param key Key to be sanitized(scaped).
     * @returns The sanitized key.
     */
    private sanitizeKey(key: string): string {
        return escape(key);
    }

    /**
     * @private
     */
    private getTicks(timestamp: Date): string {
        const epochTicks = 621355968000000000; // the number of .net ticks at the unix epoch
        const ticksPerMillisecond = 10000; // there are 10000 .net ticks per millisecond

        const ticks: number = epochTicks + timestamp.getTime() * ticksPerMillisecond;

        return ticks.toString(16);
    }

    /**
     * Delay Container creation if it does not exist.
     *
     * @returns A promise representing the asynchronous operation.
     */
    private ensureContainerExists(): Promise<azure.BlobService.ContainerResult> {
        const key: string = this.settings.containerName;
        if (!AzureBlobTranscriptStore[checkedCollectionsKey][key]) {
            AzureBlobTranscriptStore[checkedCollectionsKey][key] = this.client.createContainerIfNotExistsAsync(key);
        }

        return AzureBlobTranscriptStore[checkedCollectionsKey][key];
    }

    /**
     * Create a Blob Service.
     *
     * @param param0 Settings required for configuring the Blob Service.
     * @param param0.storageAccountOrConnectionString Storage account or connection string.
     * @param param0.storageAccessKey Storage access key.
     * @param param0.host Blob Service host.
     * @returns The BlobService created.
     */
    private createBlobService({
        storageAccountOrConnectionString,
        storageAccessKey,
        host,
    }: BlobStorageSettings): BlobServiceAsync {
        if (!storageAccountOrConnectionString) {
            throw new Error('The storageAccountOrConnectionString parameter is required.');
        }

        const blobService: azure.BlobService = azure
            .createBlobService(storageAccountOrConnectionString, storageAccessKey!, host)
            .withFilter(new azure.LinearRetryPolicyFilter(5, 500));

        // The perfect use case for a Proxy
        return new Proxy(<BlobServiceAsync>{}, {
            get(target: azure.services.blob.blobservice.BlobService, p: PropertyKey): Promise<any> {
                const prop = p.toString().endsWith('Async') ? p.toString().replace('Async', '') : p;
                return (target as any)[p] || ((target as any)[p] = denodeify(blobService, (blobService as Record<string,any>)[prop as any]));
            },
        }) as BlobServiceAsync;

        // eslint-disable-next-line @typescript-eslint/ban-types
        function denodeify<T>(thisArg: any, fn: Function): (...args: any[]) => Promise<T> {
            return (...args: any[]): Promise<T> => {
                return new Promise<T>((resolve: any, reject: any): void => {
                    args.push((error: Error, result: any) => (error ? reject(error) : resolve(result)));
                    fn.apply(thisArg, args);
                });
            };
        }
    }
}

/**
 * @private
 * Promise based methods created using denodeify function
 */
interface BlobServiceAsync extends azure.BlobService {
    createContainerIfNotExistsAsync(container: string): Promise<azure.BlobService.ContainerResult>;
    deleteContainerIfExistsAsync(container: string): Promise<boolean>;

    createBlockBlobFromTextAsync(
        container: string,
        blob: string,
        text: string | Buffer,
        options: azure.BlobService.CreateBlobRequestOptions
    ): Promise<azure.BlobService.BlobResult>;
    getBlobMetadataAsync(container: string, blob: string): Promise<azure.BlobService.BlobResult>;
    setBlobMetadataAsync(
        container: string,
        blob: string,
        metadata: { [index: string]: string }
    ): Promise<azure.BlobService.BlobResult>;
    getBlobPropertiesAsync(container: string, blob: string): Promise<azure.BlobService.BlobResult>;
    setBlobPropertiesAsync(
        container: string,
        blob: string,
        propertiesAndOptions: azure.BlobService.SetBlobPropertiesRequestOptions
    ): Promise<azure.BlobService.BlobResult>;
    getBlobToTextAsync(container: string, blob: string): Promise<azure.BlobService.BlobToText>;
    deleteBlobIfExistsAsync(container: string, blob: string): Promise<boolean>;
    listBlobsSegmentedWithPrefixAsync(
        container: string,
        prefix: string,
        currentToken: azure.common.ContinuationToken,
        options: azure.BlobService.ListBlobsSegmentedRequestOptions
    ): Promise<azure.BlobService.ListBlobsResult>;
    listBlobDirectoriesSegmentedWithPrefixAsync(
        container: string,
        prefix: string,
        currentToken: azure.common.ContinuationToken
    ): Promise<azure.BlobService.ListBlobsResult>;
}
