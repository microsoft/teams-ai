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
import { Dialog } from '../../dialog';

/**
 * ClassMemoryScope maps "class" -> dc.activeDialog.properties
 */
export class ClassMemoryScope extends MemoryScope {
    /**
     * Initializes a new instance of the [ClassMemoryScope](xref:botbuilder-dialogs.ClassMemoryScope) class.
     *
     * @param name Name of the scope class.
     */
    constructor(name = ScopePath.class) {
        super(name, false);
    }

    /**
     * Gets the backing memory for this scope.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) object for this turn.
     * @returns The memory for the scope.
     */
    getMemory(dc: DialogContext): object|undefined {
        // if active dialog is a container dialog then "dialog" binds to it
        if (dc.activeDialog) {
            const dialog = this.onFindDialog(dc);
            if (dialog != undefined) {
                // Clone properties
                const clone: Record<string,any> = {};
                for (const key in dialog) {
                    const prop = (dialog as Record<string,any>)[key];
                    if (Object.prototype.hasOwnProperty.call(dialog, key) && typeof prop != 'function') {
                        if (isExpression(prop)) {
                            const { value, error } = prop.tryGetValue(dc.state);
                            if (!error) {
                               clone[key] = value;
                            }
                        } else {
                            clone[key] = prop;
                        }
                    }
                }

                return clone;
            }
        }

        return undefined;
    }

    /**
     * Override to find the dialog instance referenced by the scope.
     *
     * @param dc Current dialog context.
     * @returns The dialog instance referenced by the scope.
     */
    protected onFindDialog(dc: DialogContext): Dialog|undefined {
        return dc.findDialog(dc.activeDialog!.id);
    }
}

function isExpression(prop: any): prop is ExpressionResolver {
    return typeof prop == 'object' && typeof prop['tryGetValue'] == 'function';
}

interface ExpressionResolver {
    tryGetValue(data: object): { value: any; error: Error };
}
