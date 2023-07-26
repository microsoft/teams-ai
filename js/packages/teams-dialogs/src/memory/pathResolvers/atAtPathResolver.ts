/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AliasPathResolver } from './aliasPathResolver';

/**
 * Maps @@ => turn.recognized.entitites.xxx array.
 */
export class AtAtPathResolver extends AliasPathResolver {
    /**
     * Initializes a new instance of the [AtAtPathResolver](xref:botbuilder-dialogs.AtAtPathResolver) class.
     */
    constructor() {
        super('@@', 'turn.recognized.entities.');
    }
}
