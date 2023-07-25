/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { join, parse } from 'path';
import { mkdirp, pathExists, readdir, readFile, remove, writeFile } from 'fs-extra';
import { Activity } from '@microsoft/teams-connector/src/schema';
import { PagedResult, TranscriptInfo, TranscriptStore } from './transcriptLogger';

const filenamify: Function = require('filenamify');

/**
 * @private
 * The number of .net ticks at the unix epoch.
 */
const epochTicks = 621355968000000000;

/**
 * @private
 * There are 10000 .net ticks per millisecond.
 */
const ticksPerMillisecond = 10000;

/**
 * @private
 * @param timestamp A date used to calculate future ticks.
 */
function getTicks(timestamp: Date): string {
    const ticks: number = epochTicks + timestamp.getTime() * ticksPerMillisecond;

    return ticks.toString(16);
}

/**
 * @private
 * @param ticks A string containing ticks.
 */
function readDate(ticks: string): Date {
    const t: number = Math.round((parseInt(ticks, 16) - epochTicks) / ticksPerMillisecond);

    return new Date(t);
}

/**
 * @private
 * @param date A date used to create a filter.
 * @param fileName The filename containing the timestamp string
 */
function withDateFilter(date: Date, fileName: string): any {
    if (!date) {
        return true;
    }

    const ticks: string = fileName.split('-')[0];
    return readDate(ticks) >= date;
}

/**
 * @private
 * @param expression A function that will be used to test items.
 */
function includeWhen(expression: any): any {
    let shouldInclude = false;

    return (item: any): boolean => {
        return shouldInclude || (shouldInclude = expression(item));
    };
}

/**
 * @private
 * @param json A JSON string to be parsed into an activity.
 */
function parseActivity(json: string): Activity {
    const activity: Activity = JSON.parse(json);
    activity.timestamp = new Date(activity.timestamp!);

    return activity;
}

/**
 * The file transcript store stores transcripts in file system with each activity as a file.
 *
 * @remarks
 * This class provides an interface to log all incoming and outgoing activities to the filesystem.
 * It implements the features necessary to work alongside the TranscriptLoggerMiddleware plugin.
 * When used in concert, your bot will automatically log all conversations.
 *
 * Below is the boilerplate code needed to use this in your app:
 * ```javascript
 * const { FileTranscriptStore, TranscriptLoggerMiddleware } = require('botbuilder');
 *
 * adapter.use(new TranscriptLoggerMiddleware(new FileTranscriptStore(__dirname + '/transcripts/')));
 * ```
 */
export class FileTranscriptStore implements TranscriptStore {
    private static readonly PageSize: number = 20;

    private readonly rootFolder: string;

    /**
     * Creates an instance of FileTranscriptStore.
     *
     * @param folder Root folder where transcript will be stored.
     */
    constructor(folder: string) {
        if (!folder) {
            throw new Error('Missing folder.');
        }

        this.rootFolder = folder;
    }

    /**
     * Log an activity to the transcript.
     *
     * @param activity Activity being logged.
     * @returns {Promise<void>} a promise representing the asynchronous operation.
     */
    async logActivity(activity: Activity): Promise<void> {
        if (!activity) {
            throw new Error('activity cannot be null for logActivity()');
        }

        const conversationFolder: string = this.getTranscriptFolder(activity.channelId, activity.conversation.id);
        const activityFileName: string = this.getActivityFilename(activity);

        return this.saveActivity(activity, conversationFolder, activityFileName);
    }

    /**
     * Get all activities associated with a conversation id (aka get the transcript).
     *
     * @param channelId Channel Id.
     * @param conversationId Conversation Id.
     * @param continuationToken (Optional) Continuation token to page through results.
     * @param startDate (Optional) Earliest time to include.
     * @returns {Promise<PagedResult<Activity>>} PagedResult of activities.
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

        const pagedResult: PagedResult<Activity> = { items: [], continuationToken: undefined as any };
        const transcriptFolder: string = this.getTranscriptFolder(channelId, conversationId);

        const exists = await pathExists(transcriptFolder);
        if (!exists) {
            return pagedResult;
        }

        const transcriptFolderContents = await readdir(transcriptFolder);
        const include = includeWhen((fileName: string) => !continuationToken || parse(fileName).name === continuationToken);
        const items = transcriptFolderContents.filter(
            (transcript) => transcript.endsWith('.json') && withDateFilter(startDate!, transcript) && include(transcript)
        );

        pagedResult.items = await Promise.all(
            items
                .slice(0, FileTranscriptStore.PageSize)
                .sort()
                .map(async (activityFilename) => {
                    const json = await readFile(join(transcriptFolder, activityFilename), 'utf8');
                    return parseActivity(json);
                })
        );
        const { length } = pagedResult.items;
        if (length === FileTranscriptStore.PageSize && items[length]) {
            pagedResult.continuationToken = parse(items[length]).name;
        }
        return pagedResult;
    }

    /**
     * List all the logged conversations for a given channelId.
     *
     * @param channelId Channel Id.
     * @param continuationToken (Optional) Continuation token to page through results.
     * @returns {Promise<PagedResult<TranscriptInfo>>} PagedResult of transcripts.
     */
    async listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<TranscriptInfo>> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        const pagedResult: PagedResult<TranscriptInfo> = { items: [], continuationToken: undefined as any };
        const channelFolder: string = this.getChannelFolder(channelId);

        const exists = await pathExists(channelFolder);
        if (!exists) {
            return pagedResult;
        }
        const channels = await readdir(channelFolder);
        const items = channels.filter(includeWhen((di: string) => !continuationToken || di === continuationToken));
        pagedResult.items = items
            .slice(0, FileTranscriptStore.PageSize)
            .map((i) => ({ channelId: channelId, id: i, created: null as any } as TranscriptInfo));
        const { length } = pagedResult.items;
        if (length === FileTranscriptStore.PageSize && items[length]) {
            pagedResult.continuationToken = items[length];
        }

        return pagedResult;
    }

    /**
     * Delete a conversation and all of it's activities.
     *
     * @param channelId Channel Id where conversation took place.
     * @param conversationId Id of the conversation to delete.
     * @returns {Promise<void>} A promise representing the asynchronous operation.
     */
    async deleteTranscript(channelId: string, conversationId: string): Promise<void> {
        if (!channelId) {
            throw new Error('Missing channelId');
        }

        if (!conversationId) {
            throw new Error('Missing conversationId');
        }

        const transcriptFolder: string = this.getTranscriptFolder(channelId, conversationId);

        return remove(transcriptFolder);
    }

    /**
     * Saves the [Activity](xref:botframework-schema.Activity) as a JSON file.
     *
     * @param activity The [Activity](xref:botframework-schema.Activity) to transcript.
     * @param transcriptPath The path where the transcript will be saved.
     * @param activityFilename The name for the file.
     * @returns {Promise<void>} A promise representing the asynchronous operation.
     */
    private async saveActivity(activity: Activity, transcriptPath: string, activityFilename: string): Promise<void> {
        const json: string = JSON.stringify(activity, null, '\t');

        const exists = await pathExists(transcriptPath);
        if (!exists) {
            await mkdirp(transcriptPath);
        }
        return writeFile(join(transcriptPath, activityFilename), json, 'utf8');
    }

    /**
     * @private
     */
    private getActivityFilename(activity: Activity): string {
        return `${getTicks(activity.timestamp!)}-${this.sanitizeKey(activity.id!)}.json`;
    }

    /**
     * @private
     */
    private getChannelFolder(channelId: string): string {
        return join(this.rootFolder, this.sanitizeKey(channelId));
    }

    /**
     * @private
     */
    private getTranscriptFolder(channelId: string, conversationId: string): string {
        return join(this.rootFolder, this.sanitizeKey(channelId), this.sanitizeKey(conversationId));
    }

    /**
     * @private
     */
    private sanitizeKey(key: string): string {
        return filenamify(key);
    }
}
