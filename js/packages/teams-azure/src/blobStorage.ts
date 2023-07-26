/**
 * @module botbuilder-azure
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as azure from 'azure-storage';
import { Storage, StoreItems } from '@microsoft/teams-core';
import { escape } from 'querystring';

// A host address.
export interface Host {
    /**
     * Primary host address.
     */
    primaryHost: string;

    /**
     * Secondary host address.
     */
    secondaryHost: string;
}

/**
 * Settings for configuring an instance of `BlobStorage`.
 */
export interface BlobStorageSettings {
    /**
     * Root container name to use.
     */
    containerName: string;

    /**
     * The storage account or the connection string. If this is the storage account, the storage access key must be provided.
     */
    storageAccountOrConnectionString: string;

    /**
     * The storage access key.
     */
    storageAccessKey?: string;

    /**
     * (Optional) azure storage host.
     */
    host?: string | Host;
}

/**
 * @private
 * Internal data structure for storing items in BlobStorage.
 */
interface DocumentStoreItem {
    /**
     * Represents the Sanitized Key and used as name of blob
     */
    id: string;
    /**
     * Represents the original Id/Key
     */
    realId: string;
    /**
     * The item itself + eTag information
     */
    document: any;
}

/**
 * @private
 */
const ContainerNameCheck = new RegExp('^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$');

/**
 * @private
 */

// tslint:disable-next-line:max-line-length typedef align no-shadowed-variable
const ResolvePromisesSerial = (values: any, promise: any) =>
    values
        .map((value: any) => () => promise(value))
        .reduce(
            (promise: any, func: any) => promise.then((result: any) => func().then(Array.prototype.concat.bind(result))),
            Promise.resolve([])
        );

/**
 * @private
 */
// tslint:disable-next-line: typedef align
const ResolvePromisesParallel = (values: any, promise: any) => Promise.all(values.map(promise));

/**
 * @private
 * Internal dictionary with the containers where entities will be stored.
 */
const checkedCollections: { [key: string]: Promise<azure.BlobService.ContainerResult> } = {};

/**
 * Middleware that implements a BlobStorage based storage provider for a bot.
 *
 * @remarks
 * The BlobStorage implements its storage using a single Azure Storage Blob Container. Each entity
 * is serialized into a JSON string and stored in an individual text blob. Each blob
 * is named after the key which is encoded and ensure it conforms a valid blob name.
 *
 * @deprecated This class is deprecated in favor of [BlobsStorage](xref:botbuilder-azure-blobs.BlobsStorage)
 */
export class BlobStorage implements Storage {
    private settings: BlobStorageSettings;
    private client: BlobServiceAsync;
    private useEmulator: boolean;

    /**
     * Creates a new BlobStorage instance.
     *
     * @param settings Settings for configuring an instance of BlobStorage.
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
        this.client = this.createBlobService(
            this.settings.storageAccountOrConnectionString,
            this.settings.storageAccessKey!,
            this.settings.host
        );
        this.useEmulator = settings.storageAccountOrConnectionString === 'UseDevelopmentStorage=true;';
    }

    /**
     * Retrieve entities from the configured blob container.
     *
     * @param keys An array of entity keys.
     * @returns The read items.
     */
    read(keys: string[]): Promise<StoreItems> {
        if (!keys) {
            throw new Error('Please provide at least one key to read from storage.');
        }

        const sanitizedKeys: string[] = keys.filter((k: string) => k).map((key: string) => this.sanitizeKey(key));

        return this.ensureContainerExists()
            .then((container: azure.BlobService.ContainerResult) => {
                return new Promise<StoreItems>((resolve: any, reject: any): void => {
                    Promise.all<DocumentStoreItem>(
                        sanitizedKeys.map((key: string) => {
                            return this.client
                                .doesBlobExistAsync(container.name, key)
                                .then((blobResult: azure.BlobService.BlobResult) => {
                                    if (blobResult.exists) {
                                        return this.client
                                            .getBlobMetadataAsync(container.name, key)
                                            .then((blobMetadata: azure.BlobService.BlobResult) => {
                                                return this.client
                                                    .getBlobToTextAsync(blobMetadata.container, blobMetadata.name)
                                                    .then((result: azure.BlobService.BlobToText) => {
                                                        const document: DocumentStoreItem = JSON.parse(result as any);
                                                        document.document.eTag = blobMetadata.etag;

                                                        return document;
                                                    });
                                            });
                                    } else {
                                        // If blob does not exist, return an empty DocumentStoreItem.
                                        return { document: {} } as DocumentStoreItem;
                                    }
                                });
                        })
                    )
                        .then((items: DocumentStoreItem[]) => {
                            if (items !== null && items.length > 0) {
                                const storeItems: StoreItems = {};
                                items
                                    .filter((x: DocumentStoreItem) => x)
                                    .forEach((item: DocumentStoreItem) => {
                                        storeItems[item.realId] = item.document;
                                    });
                                resolve(storeItems);
                            }
                        })
                        .catch((error: Error) => {
                            reject(error);
                        });
                });
            })
            .catch((error: Error) => {
                throw error;
            });
    }

    /**
     * Store a new entity in the configured blob container.
     *
     * @param changes The changes to write to storage.
     * @returns A promise representing the asynchronous operation.
     */
    write(changes: StoreItems): Promise<void> {
        if (!changes) {
            throw new Error('Please provide a StoreItems with changes to persist.');
        }

        return this.ensureContainerExists().then((container: azure.BlobService.ContainerResult) => {
            const blobs: {
                id: string;
                data: string;
                options: azure.BlobService.CreateBlobRequestOptions;
            }[] = Object.keys(changes).map((key: string) => {
                const documentChange: DocumentStoreItem = {
                    id: this.sanitizeKey(key),
                    realId: key,
                    document: changes[key],
                };

                const payload: string = JSON.stringify(documentChange);
                const options: azure.BlobService.CreateBlobRequestOptions = {
                    accessConditions:
                        changes[key].eTag === '*'
                            ? azure.AccessCondition.generateEmptyCondition()
                            : azure.AccessCondition.generateIfMatchCondition(changes[key].eTag),
                    parallelOperationThreadCount: 4,
                };

                return {
                    id: documentChange.id,
                    data: payload,
                    options: options,
                };
            });

            // A block blob can be uploaded using a single PUT operation or divided into multiple PUT block operations
            // depending on the payload's size. The default maximum size for a single blob upload is 128MB.
            // An 'InvalidBlockList' error is commonly caused due to concurrently uploading an object larger than 128MB in size.
            const promise: (b: any) => Promise<azure.BlobService.BlobResult> = (
                blob: any
            ): Promise<azure.BlobService.BlobResult> =>
                this.client.createBlockBlobFromTextAsync(container.name, blob.id, blob.data, blob.options);

            // if the blob service client is using the storage emulator, all write operations must be performed in a sequential mode
            // because of the storage emulator internal implementation, that includes a SQL LocalDb
            // that crash with a deadlock when performing parallel uploads.
            // This behavior does not occur when using an Azure Blob Storage account.
            const results: any = this.useEmulator
                ? ResolvePromisesSerial(blobs, promise)
                : ResolvePromisesParallel(blobs, promise);

            return results
                .then(() => {
                    return;
                })
                .catch((error: Error) => {
                    throw error;
                });
        });
    }

    /**
     * Delete entity blobs from the configured container.
     *
     * @param keys An array of entity keys.
     * @returns A promise representing the asynchronous operation.
     */
    delete(keys: string[]): Promise<void> {
        if (!keys) {
            throw new Error('Please provide at least one key to delete from storage.');
        }

        const sanitizedKeys: string[] = keys.filter((k: string) => k).map((key: string) => this.sanitizeKey(key));

        return this.ensureContainerExists()
            .then((container: azure.BlobService.ContainerResult) => {
                return Promise.all(
                    sanitizedKeys.map((key: string) => {
                        return this.client.deleteBlobIfExistsAsync(container.name, key);
                    })
                );
            })
            .then(() => {
                return;
            })
            .catch((error: Error) => {
                throw error;
            });
    }

    /**
     * Get a blob name validated representation of an entity to be used as a key.
     *
     * @param key The key used to identify the entity.
     * @returns An appropriately escaped version of the key.
     */
    private sanitizeKey(key: string): string {
        if (!key || key.length < 1) {
            throw new Error('Please provide a not empty key.');
        }

        const segments: string[] = key.split('/').filter((x: string) => x);
        const base: string = segments.splice(0, 1)[0];
        // The number of path segments comprising the blob name cannot exceed 254
        const validKey: string = segments.reduce(
            (acc: any, curr: any, index: number) => [acc, curr].join(index < 255 ? '/' : ''),
            base
        );

        // Reserved URL characters must be escaped.
        return escape(validKey).substr(0, 1024);
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
     * Delay Container creation if it does not exist.
     *
     * @returns A promise representing the asynchronous operation.
     */
    private ensureContainerExists(): Promise<azure.BlobService.ContainerResult> {
        const key: string = this.settings.containerName;
        if (!checkedCollections[key]) {
            checkedCollections[key] = this.client.createContainerIfNotExistsAsync(key);
        }

        return checkedCollections[key];
    }

    /**
     * Create a Blob Service.
     *
     * @param storageAccountOrConnectionString Azure CloudStorageAccount instance or Connection String.
     * @param storageAccessKey Blob Service Access Key.
     * @param host Blob Service Host.
     * @returns The blob services created.
     */
    private createBlobService(
        storageAccountOrConnectionString: string,
        storageAccessKey: string,
        host: any
    ): BlobServiceAsync {
        if (!storageAccountOrConnectionString) {
            throw new Error('The storageAccountOrConnectionString parameter is required.');
        }

        const blobService: azure.BlobService = azure
            .createBlobService(storageAccountOrConnectionString, storageAccessKey, host)
            .withFilter(new azure.LinearRetryPolicyFilter(5, 500));

        // create BlobServiceAsync by using denodeify to create promise wrappers around cb functions
        return {
            createBlockBlobFromTextAsync: this.denodeify(blobService, blobService.createBlockBlobFromText),
            createContainerIfNotExistsAsync: this.denodeify(blobService, blobService.createContainerIfNotExists),
            deleteBlobIfExistsAsync: this.denodeify(blobService, blobService.deleteBlobIfExists),
            deleteContainerIfExistsAsync: this.denodeify(blobService, blobService.deleteContainerIfExists),
            doesBlobExistAsync: this.denodeify(blobService, blobService.doesBlobExist),
            getBlobMetadataAsync: this.denodeify(blobService, blobService.getBlobMetadata),
            getBlobToTextAsync: this.denodeify(blobService, blobService.getBlobToText),
        } as any;
    }

    /**
     * @private
     * Turn a cb based azure method into a Promisified one.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    private denodeify<T>(thisArg: any, fn: Function): (...args: any[]) => Promise<T> {
        return (...args: any[]): Promise<T> => {
            return new Promise<T>((resolve: any, reject: any): void => {
                args.push((error: Error, result: any) => (error ? reject(error) : resolve(result)));
                fn.apply(thisArg, args);
            });
        };
    }
}

/**
 * @private
 * Promise based methods created using denodeify function
 */
interface BlobServiceAsync extends azure.BlobService {
    createBlockBlobFromTextAsync(
        container: string,
        blob: string,
        text: string | Buffer,
        options: azure.BlobService.CreateBlobRequestOptions
    ): Promise<azure.BlobService.BlobResult>;
    createContainerIfNotExistsAsync(container: string): Promise<azure.BlobService.ContainerResult>;
    deleteBlobIfExistsAsync(container: string, blob: string): Promise<boolean>;
    deleteContainerIfExistsAsync(container: string): Promise<boolean>;
    doesBlobExistAsync(container: string, blob: string): Promise<azure.BlobService.BlobResult>;
    getBlobMetadataAsync(container: string, blob: string): Promise<azure.BlobService.BlobResult>;
    getBlobToTextAsync(container: string, blob: string): Promise<azure.BlobService.BlobToText>;
}
