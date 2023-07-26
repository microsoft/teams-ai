/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { MemoryScope } from './memoryScope';
import { ScopePath } from '../scopePath';
import { DialogContext } from '../../dialogContext';

/**
 * @private
 */
const TURN_STATE = 'turn';

/**
 * TurnMemoryScope represents memory scoped to the current turn.
 */
export class TurnMemoryScope extends MemoryScope {
    /**
     * Initializes a new instance of the [TurnMemoryScope](xref:botbuilder-dialogs.TurnMemoryScope) class.
     */
    constructor() {
        super(ScopePath.turn, true);
    }

    /**
     * Get the backing memory for this scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for this turn.
     * @returns The memory for the scope.
     */
    getMemory(dc: DialogContext): object {
        let memory = dc.context.turnState.get(TURN_STATE);
        if (typeof memory != 'object') {
            memory = {};
            dc.context.turnState.set(TURN_STATE, memory);
        }

        return memory;
    }

    /**
     * Changes the backing object for the memory scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for this turn.
     * @param memory Memory object to set for the scope.
     */
    setMemory(dc: DialogContext, memory: object): void {
        if (memory == undefined) {
            throw new Error('TurnMemoryScope.setMemory: undefined memory object passed in.');
        }

        dc.context.turnState.set(TURN_STATE, memory);
    }
}
