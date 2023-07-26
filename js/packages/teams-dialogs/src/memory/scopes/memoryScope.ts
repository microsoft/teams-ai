/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogContext } from '../../dialogContext';

/**
 * Abstract base class for all memory scopes.
 */
export abstract class MemoryScope {
    /**
     * Initializes a new instance of the [MemoryScope](xref:botbuilder-dialogs.MemoryScope) class.
     *
     * @param name Name of the scope.
     * @param includeInSnapshot Boolean value indicating whether this memory
     * should be included in snapshot. Default value is true.
     */
    constructor(name: string, includeInSnapshot = true) {
        this.includeInSnapshot = includeInSnapshot;
        this.name = name;
    }

    /**
     * Gets or sets name of the scope
     */
    readonly name: string;

    /**
     * Gets a value indicating whether this memory should be included in snapshot.
     */
    readonly includeInSnapshot: boolean;

    /**
     * Get the backing memory for this scope
     *
     * @param dc Current dialog context.
     * @returns memory for the scope
     */
    abstract getMemory(dc: DialogContext): object|undefined;

    /**
     * Changes the backing object for the memory scope.
     *
     * @param _dc Current dialog context
     * @param _memory memory to assign
     */
    setMemory(_dc: DialogContext, _memory: object): void {
        throw new Error(`MemoryScope.setMemory: The '${this.name}' memory scope is read-only.`);
    }

    /**
     * Loads a scopes backing memory at the start of a turn.
     *
     * @param _dc Current dialog context.
     */
    async load(_dc: DialogContext): Promise<void> {
        // No initialization by default.
    }

    /**
     * Saves a scopes backing memory at the end of a turn.
     *
     * @param _dc Current dialog context.
     */
    async saveChanges(_dc: DialogContext): Promise<void> {
        // No initialization by default.
    }

    /**
     * Deletes the backing memory for a scope.
     *
     * @param _dc Current dialog context.
     */
    async delete(_dc: DialogContext): Promise<void> {
        throw new Error(`MemoryScope.delete: The '${this.name}' memory scope can't be deleted.`);
    }
}
