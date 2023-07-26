/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AliasPathResolver } from './aliasPathResolver';

/**
 * Maps %xxx => class.xxx (aka activeDialog.properties.xxx)
 */
export class PercentPathResolver extends AliasPathResolver {
    /**
     * Initializes a new instance of the [PercentPathResolver](xref:botbuilder-dialogs.PercentPathResolver) class.
     */
    constructor() {
        super('%', 'class.');
    }
}
