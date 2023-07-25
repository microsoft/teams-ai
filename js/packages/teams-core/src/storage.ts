/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as z from 'zod';
import { TurnContext } from './turnContext';

/**
 * Callback to calculate a storage key.
 *
 * ```TypeScript
 * type StorageKeyFactory = (context: TurnContext) => Promise<string>;
 * ```
 *
 * @param StorageKeyFactory.context Context for the current turn of conversation with a user.
 * @returns A promise resolving to the storage key string
 */
export type StorageKeyFactory = (context: TurnContext) => Promise<string>;

/**
 * Interface for a storage provider that stores and retrieves plain old JSON objects.
 */
export interface Storage {
    /**
     * Loads store items from storage
     *
     * @remarks
     * This example reads in a single object from storage:
     *
     * ```JavaScript
     * const items = await storage.read(['botState']);
     * const state = items['botState'] || {};
     * ```
     * @param keys Array of item keys to read from the store.
     */
    read(keys: string[]): Promise<StoreItems>;

    /**
     * Saves store items to storage.
     *
     * @remarks
     * This example writes an object to storage after its been modified:
     *
     * ```JavaScript
     * state.topic = 'someTopic';
     * await storage.write({ 'botState': state });
     * ```
     * @param changes Map of items to write to storage.
     */
    write(changes: StoreItems): Promise<void>;

    /**
     * Removes store items from storage
     *
     * @remarks
     * This example deletes an object from storage:
     *
     * ```JavaScript
     * await storage.delete(['botState']);
     * ```
     * @param keys Array of item keys to remove from the store.
     */
    delete(keys: string[]): Promise<void>;
}

/**
 * Object which is stored in Storage with an optional eTag.
 */
export interface StoreItem {
    /**
     * Key/value pairs.
     */
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    /**
     * (Optional) eTag field for stores that support optimistic concurrency.
     */
    eTag?: string;
}

/**
 * Map of named `StoreItem` objects.
 */
export interface StoreItems {
    /**
     * List of store items indexed by key.
     */
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const storeItems = z.record(z.unknown());

/**
 * @internal
 *
 * @deprecated Use `zod.record(zod.unknown())` instead.
 */
export function assertStoreItems(val: unknown, ..._args: unknown[]): asserts val is StoreItem {
    storeItems.parse(val);
}

/**
 * Utility function to calculate a change hash for a `StoreItem`.
 *
 * @remarks
 * This example calculates a change hash for an object that's been read in and then only writes it
 * back out if it's been modified:
 *
 * ```JavaScript
 * // Calculate state objects initial hash
 * const hash = calculateChangeHash(state);
 *
 * // Process the received activity
 * await processActivity(context, state);
 *
 * // Save state if changed
 * if (calculateChangeHash(state) !== hash) {
 *    await storage.write({ 'botState': state });
 * }
 * ```
 *
 * @param item Item to calculate the change hash for.
 * @returns change hash string
 */
export function calculateChangeHash(item: StoreItem): string {
    const cpy = { ...item };
    if (cpy.eTag) {
        delete cpy.eTag;
    }

    return JSON.stringify(cpy);
}
