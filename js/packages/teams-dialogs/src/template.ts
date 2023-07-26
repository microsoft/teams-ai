/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogContext } from './dialogContext';

/**
 * Defines Template interface for binding data to T.
 */
export interface TemplateInterface<T, D = Record<string, unknown>> {
    /**
     * Given the turn context bind to the data to create the object
     *
     * @param dialogContext DialogContext.
     * @param data Data to bind to.
     * @returns Instance of T.
     */
    bind(dialogContext: DialogContext, data?: D): Promise<T>;
}
