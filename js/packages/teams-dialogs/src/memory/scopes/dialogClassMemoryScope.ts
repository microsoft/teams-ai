/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClassMemoryScope } from './classMemoryScope';
import { ScopePath } from '../scopePath';
import { DialogContext } from '../../dialogContext';
import { Dialog } from '../../dialog';
import { DialogContainer } from '../../dialogContainer';

/**
 * DialogClassMemoryScope maps "dialogClass" -> dc.parent.activeDialog.properties
 */
export class DialogClassMemoryScope extends ClassMemoryScope {
    /**
     * Initializes a new instance of the [DialogClassMemoryScope](xref:botbuilder-dialogs.DialogClassMemoryScope) class.
     */
    constructor() {
        super(ScopePath.dialogClass);
    }

    /**
     * @protected
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns The current [Dialog](xref:botbuilder-dialogs.Dialog).
     */
    protected onFindDialog(dc: DialogContext): Dialog|undefined {
        // Is the active dialog a container?
        const dialog = dc.findDialog(dc.activeDialog!.id);
        if (dialog && dialog instanceof DialogContainer) {
            return dialog;
        }

        // Return parent dialog if there is one?
        const parent = dc.parent;
        if (parent && parent.activeDialog) {
            const parentDialog = parent.findDialog(parent.activeDialog.id);
            if (parentDialog) {
                return parentDialog;
            }
        }

        // Fallback to returning current dialog
        return dialog;
    }
}
