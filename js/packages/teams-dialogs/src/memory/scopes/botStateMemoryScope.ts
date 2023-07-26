/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotState } from '@microsoft/teams-core';
import { MemoryScope } from './memoryScope';
import { DialogContext } from '../../dialogContext';

/**
 * Base class for memory scopes based on BotState.
 */
export class BotStateMemoryScope extends MemoryScope {
    protected stateKey?: string;

    /**
     * Initializes a new instance of the [BotStateMemoryScope](xref:adaptive-expressions.BotStateMemoryScope) class.
     *
     * @param name name of the property.
     */
    constructor(name: string) {
        super(name, true);
    }

    /**
     * Get the backing memory for this scope.
     *
     * @param dc current dialog context.
     * @returns Memory for the scope.
     */
    getMemory(dc: DialogContext): object|undefined {
        const botState: BotState = dc.context.turnState.get(this.stateKey);
        if (botState) {
            return botState.get(dc.context);
        }

        return undefined;
    }

    /**
     * Changes the backing object for the memory scope.
     *
     * @param dc current dialog context
     * @param _memory memory
     */
    setMemory(dc: DialogContext, _memory: object): void {
        const botState = dc.context.turnState.get(this.stateKey);
        if (!botState) {
            throw new Error(`${this.stateKey} is not available.`);
        }
        throw new Error('You cannot replace the root BotState object.');
    }

    /**
     * Populates the state cache for this [BotState](xref:botbuilder-core.BotState) from the storage layer.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @param force Optional, `true` to overwrite any existing state cache;
     * or `false` to load state from storage only if the cache doesn't already exist.
     * @returns A Promise that represents the work queued to execute.
     */
    async load(dc: DialogContext, force = false): Promise<void> {
        const botState: BotState = dc.context.turnState.get(this.stateKey);
        if (botState) {
            await botState.load(dc.context, force);
        }
    }

    /**
     * Writes the state cache for this [BotState](xref:botbuilder-core.BotState) to the storage layer.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @param force Optional, `true` to save the state cache to storage;
     * or `false` to save state to storage only if a property in the cache has changed.
     * @returns A Promise that represents the work queued to execute.
     */
    async saveChanges(dc: DialogContext, force = false): Promise<void> {
        const botState: BotState = dc.context.turnState.get(this.stateKey);
        if (botState) {
            await botState.saveChanges(dc.context, force);
        }
    }

    /**
     * Deletes any state in storage and the cache for this [BotState](xref:botbuilder-core.BotState).
     *
     * @param _dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns A Promise that represents the work queued to execute.
     */
    async delete(_dc: DialogContext): Promise<void> {
        return Promise.resolve();
    }
}
