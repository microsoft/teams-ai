/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Storage, StoreItems } from './storage';

/**
 * Memory based storage provider for a bot.
 *
 * @remarks
 * This provider is most useful for simulating production storage when running locally against the
 * emulator or as part of a unit test. It has the following characteristics:
 *
 * - Starts off completely empty when the bot is run.
 * - Anything written to the store will be forgotten when the process exits.
 * - Objects that are read and written to the store are cloned to properly simulate network based
 *   storage providers.
 * - Cloned objects are serialized using `JSON.stringify()` to catch any possible serialization
 *   related issues that might occur when using a network based storage provider.
 *
 * ```JavaScript
 * const { MemoryStorage } = require('botbuilder');
 *
 * const storage = new MemoryStorage();
 * ```
 */
export class MemoryStorage implements Storage {
    protected etag: number;
    /**
     * Creates a new MemoryStorage instance.
     *
     * @param memory (Optional) memory to use for storing items. By default it will create an empty JSON object `{}`.
     */
    constructor(protected memory: { [k: string]: string } = {}) {
        this.etag = 1;
    }

    /**
     * Reads storage items from storage.
     *
     * @param keys Keys of the [StoreItems](xref:botbuilder-core.StoreItems) objects to read.
     * @returns The read items.
     */
    read(keys: string[]): Promise<StoreItems> {
        return new Promise<StoreItems>((resolve: any): void => {
            if (!keys) {
                throw new ReferenceError('Keys are required when reading.');
            }
            const data: StoreItems = {};
            keys.forEach((key: string) => {
                const item: string = this.memory[key];
                if (item) {
                    data[key] = JSON.parse(item);
                }
            });
            resolve(data);
        });
    }

    /**
     * Writes storage items to storage.
     *
     * @param changes The [StoreItems](xref:botbuilder-core.StoreItems) to write, indexed by key.
     * @returns {Promise<void>} A promise representing the async operation.
     */
    write(changes: StoreItems): Promise<void> {
        const saveItem = (key: string, item: any) => {
            const clone: any = { ...item };
            clone.eTag = (this.etag++).toString();
            this.memory[key] = JSON.stringify(clone);
        };

        return new Promise<void>((resolve: any, reject: any): void => {
            if (!changes) {
                throw new ReferenceError('Changes are required when writing.');
            }
            Object.keys(changes).forEach((key: any) => {
                const newItem: any = changes[key];
                const old: string = this.memory[key];
                if (!old || newItem.eTag === '*' || !newItem.eTag) {
                    saveItem(key, newItem);
                } else {
                    const oldItem: any = <any>JSON.parse(old);
                    if (newItem.eTag === oldItem.eTag) {
                        saveItem(key, newItem);
                    } else {
                        reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
                    }
                }
            });
            resolve();
        });
    }

    /**
     * Deletes storage items from storage.
     *
     * @param keys Keys of the [StoreItems](xref:botbuilder-core.StoreItems) objects to delete.
     * @returns {Promise<void>} A promise representing the async operation.
     */
    delete(keys: string[]): Promise<void> {
        return new Promise<void>((resolve: any): void => {
            keys.forEach((key: string) => (this.memory[key] = <any>undefined));
            resolve();
        });
    }
}
