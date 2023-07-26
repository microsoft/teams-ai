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
 * ThisMemoryScope maps "this" -> dc.activeDialog.state
 */
export class ThisMemoryScope extends MemoryScope {
    /**
     * Initializes a new instance of the [ThisMemoryScope](xref:botbuilder-dialogs.ThisMemoryScope) class.
     */
    constructor() {
        super(ScopePath.this);
    }

    /**
     * Gets the backing memory for this scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns The memory for the scope.
     */
    getMemory(dc: DialogContext): object {
        return dc.activeDialog ? dc.activeDialog.state : undefined;
    }

    /**
     * Changes the backing object for the memory scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @param memory Memory object to set for the scope.
     */
    setMemory(dc: DialogContext, memory: object): void {
        if (memory == undefined) {
            throw new Error('ThisMemoryScope.setMemory: undefined memory object passed in.');
        }

        if (!dc.activeDialog) {
            throw new Error('ThisMemoryScope.setMemory: no active dialog found.');
        }

        dc.activeDialog.state = memory;
    }
}
