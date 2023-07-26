/* eslint-disable @typescript-eslint/ban-types */
/**
 * @module botbuilder-azure
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Container, CosmosClient, CosmosClientOptions } from '@azure/cosmos';
import { CosmosDbKeyEscape } from './cosmosDbKeyEscape';
import { DoOnce } from './doOnce';
import { Storage, StoreItems } from '@microsoft/teams-core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pjson: Record<'name' | 'version', string> = require('../package.json');

const _doOnce: DoOnce<Container> = new DoOnce<Container>();

const maxDepthAllowed = 127;

/**
 * Cosmos DB Partitioned Storage Options.
 */
export interface CosmosDbPartitionedStorageOptions {
    /**
     * The CosmosDB endpoint.
     */
    cosmosDbEndpoint?: string;
    /**
     * The authentication key for Cosmos DB.
     */
    authKey?: string;
    /**
     * The database identifier for Cosmos DB instance.
     */
    databaseId: string;
    /**
     * The container identifier.
     */
    containerId: string;
    /**
     * The options for the CosmosClient.
     */
    cosmosClientOptions?: CosmosClientOptions;
    /**
     * The throughput set when creating the Container. Defaults to 400.
     */
    containerThroughput?: number;
    /**
     * The suffix to be added to every key. See cosmosDbKeyEscape.escapeKey
     *
     * Note: compatibilityMode must be set to 'false' to use a KeySuffix.
     * When KeySuffix is used, keys will NOT be truncated but an exception will
     * be thrown if the key length is longer than allowed by CosmosDb.
     *
     * The keySuffix must contain only valid CosmosDb key characters.
     * (e.g. not: '\\', '?', '/', '#', '*')
     */
    keySuffix?: string;
    /**
     * Early version of CosmosDb had a max key length of 255.  Keys longer than
     * this were truncated in cosmosDbKeyEscape.escapeKey.  This remains the default
     * behavior of cosmosDbPartitionedStorage, but can be overridden by setting
     * compatibilityMode to false.
     *
     * compatibilityMode cannot be true if keySuffix is used.
     */
    compatibilityMode?: boolean;
}

//Internal data structure for storing items in a CosmosDB Collection.
class DocumentStoreItem {
    /**
     * Gets the PartitionKey path to be used for this document type.
     *
     * @returns {string} the partition key path
     */
    static get partitionKeyPath(): string {
        return '/id';
    }

    /**
     * Gets or sets the sanitized Id/Key used as PrimaryKey.
     */
    id: string;

    /**
     * Gets or sets the un-sanitized Id/Key.
     *
     */
    realId: string;

    /**
     * Gets or sets the persisted object.
     */
    document: object;

    /**
     * Gets or sets the ETag information for handling optimistic concurrency updates.
     */
    eTag: string|undefined;

    /**
     * Gets the PartitionKey value for the document.
     *
     * @returns {string} the partition key
     */
    get partitionKey(): string {
        return this.id;
    }

    // We can't make the partitionKey optional AND have it auto-get this.realId, so we'll use a constructor
    constructor(storeItem: { id: string; realId: string; document: object; eTag?: string }) {
        this.id = storeItem.id;
        this.realId = storeItem.realId;
        this.document = storeItem.document;
        this.eTag = storeItem.eTag;
    }
}

/**
 * Implements a CosmosDB based storage provider using partitioning for a bot.
 */
export class CosmosDbPartitionedStorage implements Storage {
    private container?: Container;
    private client?: CosmosClient;
    private compatibilityModePartitionKey = false;

    /**
     * Initializes a new instance of the <see cref="CosmosDbPartitionedStorage"/> class.
     * using the provided CosmosDB credentials, database ID, and container ID.
     *
     * @param {CosmosDbPartitionedStorageOptions} cosmosDbStorageOptions Cosmos DB partitioned storage configuration options.
     */
    constructor(private readonly cosmosDbStorageOptions: CosmosDbPartitionedStorageOptions) {
        if (!cosmosDbStorageOptions) {
            throw new ReferenceError('CosmosDbPartitionedStorageOptions is required.');
        }
        const { cosmosClientOptions } = cosmosDbStorageOptions;
        cosmosDbStorageOptions.cosmosDbEndpoint ??= cosmosClientOptions?.endpoint;
        if (!cosmosDbStorageOptions.cosmosDbEndpoint) {
            throw new ReferenceError('cosmosDbEndpoint for CosmosDB is required.');
        }
        cosmosDbStorageOptions.authKey ??= cosmosClientOptions?.key;
        if (!cosmosDbStorageOptions.authKey && !cosmosClientOptions?.tokenProvider) {
            throw new ReferenceError('authKey for CosmosDB is required.');
        }
        if (!cosmosDbStorageOptions.databaseId) {
            throw new ReferenceError('databaseId is for CosmosDB required.');
        }
        if (!cosmosDbStorageOptions.containerId) {
            throw new ReferenceError('containerId for CosmosDB is required.');
        }
        // In order to support collections previously restricted to max key length of 255, we default
        // compatibilityMode to 'true'.  No compatibilityMode is opt-in only.
        cosmosDbStorageOptions.compatibilityMode ??= true;
        if (cosmosDbStorageOptions.keySuffix) {
            if (cosmosDbStorageOptions.compatibilityMode) {
                throw new ReferenceError('compatibilityMode cannot be true while using a keySuffix.');
            }
            // In order to reduce key complexity, we do not allow invalid characters in a KeySuffix
            // If the keySuffix has invalid characters, the escaped key will not match
            const suffixEscaped = CosmosDbKeyEscape.escapeKey(cosmosDbStorageOptions.keySuffix);
            if (cosmosDbStorageOptions.keySuffix !== suffixEscaped) {
                throw new ReferenceError(
                    `Cannot use invalid Row Key characters: ${cosmosDbStorageOptions.keySuffix} in keySuffix`
                );
            }
        }
    }

    // Protects against JSON.stringify cycles
    private toJSON(): unknown {
        return { name: 'CosmosDbPartitionedStorage' };
    }

    /**
     * Read one or more items with matching keys from the Cosmos DB container.
     *
     * @param {string[]} keys A collection of Ids for each item to be retrieved.
     * @returns {Promise<StoreItems>} The read items.
     */
    async read(keys: string[]): Promise<StoreItems> {
        if (!keys) {
            throw new ReferenceError('Keys are required when reading.');
        } else if (keys.length === 0) {
            return {};
        }

        await this.initialize();

        const storeItems: StoreItems = {};

        await Promise.all(
            keys.map(
                async (k: string): Promise<void> => {
                    try {
                        const escapedKey = CosmosDbKeyEscape.escapeKey(
                            k,
                            this.cosmosDbStorageOptions.keySuffix,
                            this.cosmosDbStorageOptions.compatibilityMode
                        );

                        const readItemResponse = await this.container!
                            .item(escapedKey, this.getPartitionKey(escapedKey))
                            .read<DocumentStoreItem>();
                        const documentStoreItem = readItemResponse.resource;
                        if (documentStoreItem) {
                            storeItems[documentStoreItem.realId] = documentStoreItem.document;
                            storeItems[documentStoreItem.realId].eTag = documentStoreItem._etag;
                        }
                    } catch (err: unknown) {
                        // When an item is not found a CosmosException is thrown, but we want to
                        // return an empty collection so in this instance we catch and do not rethrow.
                        // Throw for any other exception.
                        if ((err as any).code === 404) {
                            // no-op
                        }
                        // Throw unique error for 400s
                        else if ((err as any).code === 400) {
                            this.throwInformativeError(
                                `Error reading from container. You might be attempting to read from a non-partitioned
                    container or a container that does not use '/id' as the partitionKeyPath`,
                                err as any
                            );
                        } else {
                            this.throwInformativeError('Error reading from container', err as any);
                        }
                    }
                }
            )
        );

        return storeItems;
    }

    /**
     * Insert or update one or more items into the Cosmos DB container.
     *
     * @param {StoreItems} changes Dictionary of items to be inserted or updated indexed by key.
     */
    async write(changes: StoreItems): Promise<void> {
        if (!changes) {
            throw new ReferenceError('Changes are required when writing.');
        } else if (changes.length === 0) {
            return;
        }

        await this.initialize();

        await Promise.all(
            Object.entries(changes).map(
                async ([key, { eTag, ...change }]): Promise<void> => {
                    const document = new DocumentStoreItem({
                        id: CosmosDbKeyEscape.escapeKey(
                            key,
                            this.cosmosDbStorageOptions.keySuffix,
                            this.cosmosDbStorageOptions.compatibilityMode
                        ),
                        realId: key,
                        document: change,
                    });

                    const accessCondition =
                        eTag !== '*' && eTag != null && eTag.length > 0
                            ? { accessCondition: { type: 'IfMatch', condition: eTag } }
                            : undefined;

                    try {
                        await this.container!.items.upsert(document, accessCondition);
                    } catch (err: unknown) {
                        // This check could potentially be performed before even attempting to upsert the item
                        // so that a request wouldn't be made to Cosmos if it's expected to fail.
                        // However, performing the check here ensures that this custom exception is only thrown
                        // if Cosmos returns an error first.
                        // This way, the nesting limit is not imposed on the Bot Framework side
                        // and no exception will be thrown if the limit is eventually changed on the Cosmos side.
                        this.checkForNestingError(change, err as any);

                        this.throwInformativeError('Error upserting document', err as any);
                    }
                }
            )
        );
    }

    /**
     * Delete one or more items from the Cosmos DB container.
     *
     * @param {string[]} keys Array of Ids for the items to be deleted.
     */
    async delete(keys: string[]): Promise<void> {
        await this.initialize();

        await Promise.all(
            keys.map(
                async (k: string): Promise<void> => {
                    const escapedKey = CosmosDbKeyEscape.escapeKey(
                        k,
                        this.cosmosDbStorageOptions.keySuffix,
                        this.cosmosDbStorageOptions.compatibilityMode
                    );
                    try {
                        await this.container!.item(escapedKey, this.getPartitionKey(escapedKey)).delete();
                    } catch (err: unknown) {
                        // If trying to delete a document that doesn't exist, do nothing. Otherwise, throw
                        if ((err as any).code === 404) {
                            // no-op
                        } else {
                            this.throwInformativeError('Unable to delete document', err as any);
                        }
                    }
                }
            )
        );
    }

    /**
     * Connects to the CosmosDB database and creates / gets the container.
     */
    async initialize(): Promise<void> {
        if (!this.container) {
            if (!this.client) {
                this.client = new CosmosClient({
                    endpoint: this.cosmosDbStorageOptions.cosmosDbEndpoint,
                    key: this.cosmosDbStorageOptions.authKey,
                    userAgentSuffix: `${pjson.name} ${pjson.version}`,
                    ...this.cosmosDbStorageOptions.cosmosClientOptions,
                } as any);
            }
            const dbAndContainerKey = `${this.cosmosDbStorageOptions.databaseId}-${this.cosmosDbStorageOptions.containerId}`;
            this.container = await _doOnce.waitFor(
                dbAndContainerKey,
                async (): Promise<Container> => await this.getOrCreateContainer()
            );
        }
    }

    private async getOrCreateContainer(): Promise<Container> {
        let container;
        if (this.cosmosDbStorageOptions.compatibilityMode) {
            try {
                container = await this.client!
                    .database(this.cosmosDbStorageOptions.databaseId)
                    .container(this.cosmosDbStorageOptions.containerId);
                const partitionKeyPath = await container.readPartitionKeyDefinition();
                const paths = partitionKeyPath.resource!.paths;
                if (paths) {
                    // Containers created with CosmosDbStorage had no partition key set, so the default was '/_partitionKey'.
                    if (paths.indexOf('/_partitionKey') !== -1) {
                        this.compatibilityModePartitionKey = true;
                    } else if (paths.indexOf(DocumentStoreItem.partitionKeyPath) === -1) {
                        // We are not supporting custom Partition Key Paths.
                        new Error(
                            `Custom Partition Key Paths are not supported. ${this.cosmosDbStorageOptions.containerId} has a custom Partition Key Path of ${paths[0]}.`
                        );
                    }
                } else {
                    this.compatibilityModePartitionKey = true;
                }
                return container;
            } catch {
                // Use createIfNotExist
            }
        }

        // Use createIfNotExist
        const result = await this.client!
            .database(this.cosmosDbStorageOptions.databaseId)
            .containers.createIfNotExists({
                id: this.cosmosDbStorageOptions.containerId,
                partitionKey: {
                    paths: [DocumentStoreItem.partitionKeyPath],
                },
                throughput: this.cosmosDbStorageOptions.containerThroughput,
            });
        return result.container;
    }

    private getPartitionKey(key: any) {
        return this.compatibilityModePartitionKey ? undefined : key;
    }

    // Return an informative error message if upsert failed due to deeply nested data
    private checkForNestingError(json: object, err: Error | Record<'message', string> | string): void {
        const checkDepth = (obj: unknown, depth: number, isInDialogState: boolean): void => {
            if (depth > maxDepthAllowed) {
                let message = `Maximum nesting depth of ${maxDepthAllowed} exceeded.`;

                if (isInDialogState) {
                    message +=
                        ' This is most likely caused by recursive component dialogs. ' +
                        'Try reworking your dialog code to make sure it does not keep dialogs on the stack ' +
                        "that it's not using. For example, consider using replaceDialog instead of beginDialog.";
                } else {
                    message += ' Please check your data for signs of unintended recursion.';
                }

                this.throwInformativeError(message, err);
            } else if (obj && typeof obj === 'object') {
                for (const [key, value] of Object.entries(obj)) {
                    checkDepth(value, depth + 1, key === 'dialogStack' || isInDialogState);
                }
            }
        };

        checkDepth(json, 0, false);
    }

    // The Cosmos JS SDK doesn't return very descriptive errors and not all errors contain a body.
    private throwInformativeError(prependedMessage: string, err: Error | Record<'message', string> | string): void {
        if (typeof err === 'string') {
            err = new Error(err);
        }

        err.message = `[${prependedMessage}] ${err.message}`;

        throw err;
    }
}
