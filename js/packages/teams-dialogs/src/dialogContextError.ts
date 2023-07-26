/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogContext } from './dialogContext';
import { DialogInstance } from './dialog';

/**
 * An Error that includes extra dialog context, including the dialog stack.
 */
export class DialogContextError extends Error {
    /**
     * Represents the state of a dialog when an error occurred.
     */
    readonly dialogContext: {
        activeDialog?: string;
        parent?: string;
        stack: DialogInstance[];
    };

    /**
     * Construct a DialogError.
     *
     * @param {Error | string} error Source error or error message.
     * @param {DialogContext} dialogContext Dialog context that is the source of the error.
     */
    constructor(public readonly error: Error | string, dialogContext: DialogContext) {
        super();

        if (!(error instanceof Error) && typeof error !== 'string') {
            throw new Error('`error` argument must be an Error or a string');
        }

        if (!(dialogContext instanceof DialogContext)) {
            throw new Error('`dialogContext` argument must be of type DialogContext');
        }

        this.name = 'DialogContextError';
        this.message = error instanceof Error ? error.message : error;

        this.dialogContext = {
            activeDialog: dialogContext.activeDialog?.id,
            parent: dialogContext.parent?.activeDialog?.id,
            stack: dialogContext.stack,
        };
    }
}
