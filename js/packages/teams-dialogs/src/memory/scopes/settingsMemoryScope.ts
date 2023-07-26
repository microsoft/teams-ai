/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogContext } from '../../dialogContext';
import { DialogTurnStateConstants } from '../../dialogTurnStateConstants';
import { MemoryScope } from './memoryScope';
import { ScopePath } from '../scopePath';

/**
 * The setting node.
 */
class Node {
    /**
     * Initializes a new instance of `Node`.
     *
     * @param {string} value Value of the node. If the node is not leaf, value represents the current path.
     */
    constructor(public value?: string) {}

    /**
     * The child nodes of the node.
     */
    children: Node[] = [];

    /**
     * Indicates if the node is leaf node.
     *
     * @returns {boolean} If the node is leaf node or not.
     */
    isLeaf(): boolean {
        return this.children.length === 0;
    }
}

/**
 * SettingsMemoryScope maps "settings" -> dc.context.turnState['settings']
 */
export class SettingsMemoryScope extends MemoryScope {
    private static readonly blockingList = [
        'MicrosoftAppPassword',
        'cosmosDb:authKey',
        'blobStorage:connectionString',
        'BlobsStorage:connectionString',
        'CosmosDbPartitionedStorage:authKey',
        'applicationInsights:connectionString',
        'applicationInsights:InstrumentationKey',
        'runtimeSettings:telemetry:options:connectionString',
        'runtimeSettings:telemetry:options:instrumentationKey',
        'runtimeSettings:features:blobTranscript:connectionString',
    ];

    /**
     * Initializes a new instance of the [SettingsMemoryScope](xref:botbuilder-dialogs.SettingsMemoryScope) class.
     *
     * @param initialSettings initial set of settings to supply
     */
    constructor(private readonly initialSettings?: Record<string, unknown>) {
        super(ScopePath.settings, false);
    }

    /**
     * Gets the backing memory for this scope.
     *
     * @param {DialogContext} dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns {Record<string, ?>} The memory for the scope.
     */
    getMemory(dc: DialogContext): Record<string, unknown> {
        if (dc.context.turnState.has(ScopePath.settings)) {
            return dc.context.turnState.get(ScopePath.settings) ?? {};
        }

        const configuration = dc.context.turnState.get(DialogTurnStateConstants.configuration) ?? {};

        Object.entries(process.env).reduce((result, [key, value]) => {
            result[`${key}`] = value;
            return result;
        }, configuration);

        const settings = SettingsMemoryScope.loadSettings(configuration);
        dc.context.turnState.set(ScopePath.settings, settings);

        return settings;
    }

    /**
     * @param dc Current dialog context.
     */
    async load(dc: DialogContext): Promise<void> {
        if (this.initialSettings) {
            // filter initialSettings
            const filteredSettings = SettingsMemoryScope.filterSettings(this.initialSettings);
            dc.context.turnState.set(ScopePath.settings, filteredSettings);
        }

        await super.load(dc);
    }

    /**
     * Build a dictionary view of configuration providers.
     *
     * @param {Record<string, string>} configuration The configuration that we are running with.
     * @returns {Record<string, ?>} Projected dictionary for settings.
     */
    protected static loadSettings(configuration: Record<string, string>): Record<string, unknown> {
        let settings = {};

        if (configuration) {
            // load configuration into settings
            const root = this.convertFlattenSettingToNode(Object.entries(configuration));
            settings = root.children.reduce(
                (acc, child) => ({ ...acc, [child.value!]: this.convertNodeToObject(child) }),
                settings
            );
        }

        // filter env configuration settings
        return this.filterSettings(settings);
    }

    /**
     * Generate a node tree with the flatten settings.
     * For example:
     * {
     *   "array":["item1", "item2"],
     *   "object":{"array":["item1"], "2":"numberkey"}
     * }
     *
     * Would generate a flatten settings like:
     * array:0 item1
     * array:1 item2
     * object:array:0 item1
     * object:2 numberkey
     *
     * After Converting it from flatten settings into node tree, would get:
     *
     *                         null
     *                |                     |
     *              array                object
     *            |        |            |        |
     *           0          1        array        2
     *           |          |         |           |
     *         item1       item2      0        numberkey
     *                                |
     *                              item1
     * The result is a Tree.
     *
     * @param {Array<[string, string]>} kvs Configurations with key value pairs.
     * @returns {Node} The root node of the tree.
     */
    private static convertFlattenSettingToNode(kvs: Array<[key: string, value: string]>): Node {
        const root = new Node();

        kvs.forEach(([key, value]) => {
            const keyChain = key.split(':');
            let currentNode = root;
            keyChain.forEach((item) => {
                const matchItem = currentNode.children.find((u) => u?.value === item);
                if (!matchItem) {
                    // Remove all the leaf children
                    currentNode.children = currentNode.children.filter((u) => u.children.length !== 0);

                    // Append new child into current node
                    const node = new Node(item);
                    currentNode.children.push(node);
                    currentNode = node;
                } else {
                    currentNode = matchItem;
                }
            });

            currentNode.children.push(new Node(value));
        });

        return root;
    }

    private static convertNodeToObject(node: Node): unknown {
        if (!node.children.length) {
            return {};
        }

        // If the child is leaf node, return its value directly.
        if (node.children.length === 1 && node.children[0].isLeaf()) {
            return node.children[0].value;
        }

        // check if all the children are number format.
        let pureNumberIndex = true;
        const indexArray: number[] = [];
        let indexMax = -1;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[Number(i)];
            if (/^-?\d+$/.test(child.value!)) {
                const num = parseInt(child.value!, 10);
                if (!isNaN(num) && num >= 0) {
                    indexArray.push(num);
                    if (num > indexMax) {
                        indexMax = num;
                    }
                    continue;
                }
            }
            pureNumberIndex = false;
            break;
        }

        if (pureNumberIndex) {
            // all children are int numbers, treat it as array.
            const listResult = new Array(indexMax + 1);
            node.children.forEach((child, index) => {
                listResult[indexArray[Number(index)]] = this.convertNodeToObject(child);
            });
            return listResult;
        }

        // Convert all child into dictionary
        return node.children.reduce((result, child) => {
            (result as Record<string,any>)[child.value!] = this.convertNodeToObject(child);
            return result;
        }, {});
    }

    private static filterSettings(settings: Record<string, unknown>): Record<string, unknown> {
        const result = Object.assign({}, settings);
        this.blockingList.forEach((path) => this.deletePropertyPath(result, path));
        return result;
    }

    private static deletePropertyPath(obj: Record<string,any>, path: string): void {
        if (!obj || !path?.length) {
            return;
        }

        const pathArray = path.split(':');

        for (let i = 0; i < pathArray.length - 1; i++) {
            const realKey = Object.keys(obj).find((key) => key.toLowerCase() === pathArray[i].toLowerCase())!;
            obj = obj[realKey];

            if (typeof obj === 'undefined') {
                return;
            }
        }

        const lastPath = pathArray.pop()!.toLowerCase();
        const lastKey = Object.keys(obj).find((key) => key.toLowerCase() === lastPath)!;
        delete obj[lastKey];
    }
}
