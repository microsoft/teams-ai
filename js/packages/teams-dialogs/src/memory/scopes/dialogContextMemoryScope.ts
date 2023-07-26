/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogContext } from '../../dialogContext';
import { MemoryScope } from './memoryScope';
import { ScopePath } from '../scopePath';

/**
 * `DialogContextMemoryScope` maps 'dialogcontext' -> properties.
 */
export class DialogContextMemoryScope extends MemoryScope {
    /**
     * Initializes a new instance of the `DialogContextMemoryScope` class.
     */
    constructor() {
        super(ScopePath.dialogContext, false);
    }

    /**
     * Gets the backing memory for this scope.
     *
     * @param dc The `DialogContext` object for this turn.
     * @returns Memory for the scope.
     */
    getMemory(dc: DialogContext): Record<'stack' | 'activeDialog' | 'parent', unknown> {
        const stack = [];
        let currentDc: DialogContext|undefined = dc;

        // go to leaf node
        while (currentDc.child) {
            currentDc = currentDc.child;
        }

        while (currentDc) {
            for (let i = currentDc.stack.length - 1; i >= 0; i--) {
                const item = currentDc.stack[i];
                // filter out ActionScope items because they are internal bookkeeping.
                if (!item.id.startsWith('ActionScope[')) {
                    stack.push(item.id);
                }
            }

            currentDc = currentDc.parent;
        }

        return {
            stack,
            activeDialog: dc.activeDialog && dc.activeDialog.id,
            parent: dc.parent && dc.parent.activeDialog && dc.parent.activeDialog.id,
        };
    }
}
