/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Defines path passed to the active dialog.
 */
export class ThisPath {
    /**
     * The options that were passed to the active dialog via options argument of BeginDialog.
     */
    static readonly options = 'this.options';
}
