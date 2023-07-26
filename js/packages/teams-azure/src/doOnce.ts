/**
 * @module botbuilder-azure
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Task to perform only one time.
 */
export class DoOnce<T> {
    private task: {
        [key: string]: Promise<T>;
    } = {};

    /**
     * Wait for the task to be executed.
     *
     * @param key Key of the task.
     * @param fn Function to perform.
     * @returns A promise representing the asynchronous operation.
     */
    waitFor(key: string, fn: () => Promise<T>): Promise<T> {
        if (!this.task[key]) {
            this.task[key] = fn();
        }

        return this.task[key];
    }
}
