/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotStateMemoryScope } from './botStateMemoryScope';
import { ScopePath } from '../scopePath';

/**
 * Memory that's scoped to the current user.
 */
export class UserMemoryScope extends BotStateMemoryScope {
    protected stateKey = 'UserState';
    /**
     * Initializes a new instance of the [UserMemoryScope](xref:botbuilder-dialogs.UserMemoryScope) class.
     */
    constructor() {
        super(ScopePath.user);
    }
}
