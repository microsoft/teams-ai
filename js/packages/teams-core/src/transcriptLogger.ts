/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Activity,
    ActivityEventNames,
    ActivityTypes,
    ConversationReference,
    ResourceResponse,
    RoleTypes,
} from '@microsoft/teams-connector/src/schema';
import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';

/**
 * Logs incoming and outgoing activities to a TranscriptStore.
 */
export class TranscriptLoggerMiddleware implements Middleware {
    private logger: TranscriptLogger;

    /**
     * Middleware for logging incoming and outgoing activities to a transcript store.
     *
     * @param logger Transcript logger
     */
    constructor(logger: TranscriptLogger) {
        if (!logger) {
            throw new Error('TranscriptLoggerMiddleware requires a TranscriptLogger instance.');
        }

        this.logger = logger;
    }

    /**
     * Initialization for middleware turn.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param next Function to call at the end of the middleware chain.
     */
    async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const transcript: Activity[] = [];

        // log incoming activity at beginning of turn
        if (context.activity) {
            if (!context.activity.from.role) {
                context.activity.from.role = RoleTypes.User;
            }

            this.logActivity(transcript, this.cloneActivity(context.activity));
        }

        // hook up onSend pipeline
        context.onSendActivities(
            async (ctx: TurnContext, activities: Partial<Activity>[], next: () => Promise<ResourceResponse[]>) => {
                // Run full pipeline.
                const responses = await next();

                activities.forEach((activity, index) => {
                    const clonedActivity = this.cloneActivity(activity);
                    clonedActivity.id = responses && responses[index] ? responses[index].id : clonedActivity.id;

                    // For certain channels, a ResourceResponse with an id is not always sent to the bot.
                    // This fix uses the timestamp on the activity to populate its id for logging the transcript.
                    // If there is no outgoing timestamp, the current time for the bot is used for the activity.id.
                    // See https://github.com/microsoft/botbuilder-js/issues/1122
                    if (!clonedActivity.id) {
                        const prefix = `g_${Math.random().toString(36).slice(2, 8)}`;
                        if (clonedActivity.timestamp) {
                            clonedActivity.id = `${prefix}${new Date(clonedActivity.timestamp).getTime().toString()}`;
                        } else {
                            clonedActivity.id = `${prefix}${new Date().getTime().toString()}`;
                        }
                    }

                    this.logActivity(transcript, clonedActivity);
                });

                return responses;
            }
        );

        // hook up update activity pipeline
        context.onUpdateActivity(async (ctx: TurnContext, activity: Partial<Activity>, next: () => Promise<void>) => {
            // run full pipeline
            const response: void = await next();

            // add Message Update activity
            const updateActivity = this.cloneActivity(activity);
            updateActivity.type = ActivityTypes.MessageUpdate;
            this.logActivity(transcript, updateActivity);

            return response;
        });

        // hook up delete activity pipeline
        context.onDeleteActivity(
            async (ctx: TurnContext, reference: Partial<ConversationReference>, next: () => Promise<void>) => {
                // run full pipeline
                await next();

                // add MessageDelete activity
                // log as MessageDelete activity
                const deleteActivity = TurnContext.applyConversationReference(
                    {
                        type: ActivityTypes.MessageDelete,
                        id: reference.activityId,
                    },
                    reference,
                    false
                );

                this.logActivity(transcript, this.cloneActivity(deleteActivity));
            }
        );

        // process bot logic
        await next();

        // flush transcript at end of turn
        while (transcript.length) {
            try {
                // If the implementation of this.logger.logActivity() is asynchronous, we don't
                // await it as to not block processing of activities.
                // Because TranscriptLogger.logActivity() returns void or Promise<void>, we capture
                // the result and see if it is a Promise.
                const maybePromise = this.logger.logActivity(transcript.shift()!);

                // If this.logger.logActivity() returns a Promise, a catch is added in case there
                // is no innate error handling in the method. This catch prevents
                // UnhandledPromiseRejectionWarnings from being thrown and prints the error to the
                // console.
                if (maybePromise instanceof Promise) {
                    maybePromise.catch((err) => {
                        this.transcriptLoggerErrorHandler(err);
                    });
                }
            } catch (err: unknown) {
                this.transcriptLoggerErrorHandler(err);
            }
        }
    }

    /**
     * Logs the Activity.
     *
     * @param transcript Array where the activity will be pushed.
     * @param activity Activity to log.
     */
    private logActivity(transcript: Activity[], activity: Activity): void {
        if (!activity.timestamp) {
            activity.timestamp = new Date();
        }

        // We should not log ContinueConversation events used by skills to initialize the middleware.
        if (!(activity.type === ActivityTypes.Event && activity.name === ActivityEventNames.ContinueConversation)) {
            transcript.push(activity);
        }
    }

    /**
     * Clones the Activity entity.
     *
     * @param activity Activity to clone.
     * @returns The cloned activity.
     */
    private cloneActivity(activity: Partial<Activity>): Activity {
        return Object.assign(<Activity>{}, activity);
    }

    /**
     * Error logging helper function.
     *
     * @param err Error or object to console.error out.
     */
    private transcriptLoggerErrorHandler(err: Error | any): void {
        // tslint:disable:no-console
        if (err instanceof Error) {
            console.error(`TranscriptLoggerMiddleware logActivity failed: "${(err as Error).message}"`);
            console.error(err.stack);
        } else {
            console.error(`TranscriptLoggerMiddleware logActivity failed: "${JSON.stringify(err)}"`);
        }
        // tslint:enable:no-console
    }
}

/**
 * ConsoleTranscriptLogger , writes activities to Console output.
 */
export class ConsoleTranscriptLogger implements TranscriptLogger {
    /**
     * Log an activity to the transcript.
     *
     * @param activity Activity being logged.
     */
    logActivity(activity: Activity): void | Promise<void> {
        if (!activity) {
            throw new Error('Activity is required.');
        }

        // tslint:disable-next-line:no-console
        console.log('Activity Log:', activity);
    }
}

/**
 * Transcript logger stores activities for conversations for recall.
 */
export interface TranscriptLogger {
    /**
     * Log an activity to the transcript.
     *
     * @param activity Activity being logged.
     */
    logActivity(activity: Activity): void | Promise<void>;
}

/**
 * Transcript logger stores activities for conversations for recall.
 */
export interface TranscriptStore extends TranscriptLogger {
    /**
     * Get activities for a conversation (Aka the transcript)
     *
     * @param channelId Channel Id.
     * @param conversationId Conversation Id.
     * @param continuationToken Continuation token to page through results.
     * @param startDate Earliest time to include.
     */
    getTranscriptActivities(
        channelId: string,
        conversationId: string,
        continuationToken?: string,
        startDate?: Date
    ): Promise<PagedResult<Activity>>;

    /**
     * List conversations in the channelId.
     *
     * @param channelId Channel Id.
     * @param continuationToken Continuation token to page through results.
     */
    listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<TranscriptInfo>>;

    /**
     * Delete a specific conversation and all of its activities.
     *
     * @param channelId Channel Id where conversation took place.
     * @param conversationId Id of the conversation to delete.
     */
    deleteTranscript(channelId: string, conversationId: string): Promise<void>;
}

/**
 * Metadata for a stored transcript.
 */
export interface TranscriptInfo {
    /**
     * ChannelId that the transcript was taken from.
     */
    channelId: string;

    /**
     * Conversation Id.
     */
    id: string;

    /**
     * Date conversation was started.
     */
    created: Date;
}

/**
 * Page of results.
 *
 * @param T type of items being paged in.
 */
// tslint:disable-next-line:max-classes-per-file
export interface PagedResult<T> {
    /**
     * Page of items.
     */
    items: T[];

    /**
     * Token used to page through multiple pages.
     */
    continuationToken: string;
}
