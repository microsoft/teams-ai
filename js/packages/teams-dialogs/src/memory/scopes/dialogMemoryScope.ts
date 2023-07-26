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
import { DialogContainer } from '../../dialogContainer';

/**
 * DialogMemoryScope maps "dialog" -> dc.parent.activeDialog.state || dc.activeDialog.state
 */
export class DialogMemoryScope extends MemoryScope {
    /**
     * Initializes a new instance of the [DialogMemoryScope](xref:botbuilder-dialogs.DialogMemoryScope) class.
     */
    constructor() {
        super(ScopePath.dialog);
    }

    /**
     * Gets the backing memory for this scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns The memory for the scope.
     */
    getMemory(dc: DialogContext): object {
        // If active dialog is a container dialog then "dialog" binds to it.
        // Otherwise the "dialog" will bind to the dialogs parent assuming it
        // is a container.
        let parent = dc;
        if (!this.isContainer(parent) && parent.parent && this.isContainer(parent.parent)) {
            parent = parent.parent;
        }

        // If there's no active dialog then return undefined.
        return parent.activeDialog ? parent.activeDialog.state : undefined;
    }

    /**
     * Changes the backing object for the memory scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @param memory Memory object to set for the scope.
     */
    setMemory(dc: DialogContext, memory: object): void {
        if (memory == undefined) {
            throw new Error('DialogMemoryScope.setMemory: undefined memory object passed in.');
        }

        // If active dialog is a container dialog then "dialog" binds to it.
        // Otherwise the "dialog" will bind to the dialogs parent assuming it
        // is a container.
        let parent = dc;
        if (!this.isContainer(parent) && parent.parent && this.isContainer(parent.parent)) {
            parent = parent.parent;
        }

        // If there's no active dialog then throw an error.
        if (!parent.activeDialog) {
            throw new Error('DialogMemoryScope.setMemory: no active dialog found.');
        }

        parent.activeDialog.state = memory;
    }

    /**
     * @private
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns A boolean indicating whether is a cointainer or not.
     */
    private isContainer(dc: DialogContext): boolean {
        if (dc != undefined && dc.activeDialog != undefined) {
            const dialog = dc.findDialog(dc.activeDialog.id);
            if (dialog instanceof DialogContainer) {
                return true;
            }
        }

        return false;
    }
}
