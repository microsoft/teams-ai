/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity } from '@microsoft/teams-connector/src/schema';

/**
 * A base class for enqueueing an Activity for later processing.
 */
export abstract class QueueStorage {
    /**
     * Enqueues an Activity for later processing. The visibility timeout specifies how long the message should be visible
     * to Dequeue and Peek operations.
     *
     * @param {Partial<Activity>} activity The [Activity](xref:botframework-schema.Activity) to be queued for later processing.
     * @param {number} visibilityTimeout Visibility timeout in seconds. Optional with a default value of 0. Cannot be larger than 7 days.
     * @param {number} timeToLive Specifies the time-to-live interval for the message in seconds.
     */
    abstract queueActivity(
        activity: Partial<Activity>,
        visibilityTimeout?: number,
        timeToLive?: number
    ): Promise<string>;
}
