/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AliasPathResolver } from './aliasPathResolver';

/**
 * Maps $xxx => dialog.xxx
 */
export class DollarPathResolver extends AliasPathResolver {
    /**
     * Initializes a new instance of the [DollarPathResolver](xref:botbuilder-dialogs.DollarPathResolver) class.
     */
    constructor() {
        super('$', 'dialog.');
    }
}
