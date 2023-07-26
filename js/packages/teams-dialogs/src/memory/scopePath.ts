/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Defines paths for the available scopes.
 */
export class ScopePath {
    /**
     * User memory scope root path.
     */
    static readonly user = 'user';

    /**
     * Conversation memory scope root path.
     */
    static readonly conversation = 'conversation';

    /**
     * Dialog memory scope root path.
     */
    static readonly dialog = 'dialog';

    /**
     * DialogClass memory scope root path.
     */
    static readonly dialogClass = 'dialogClass';

    /**
     * DialogContext memory scope root path.
     */
    static readonly dialogContext = 'dialogContext';

    /**
     * This memory scope root path.
     */
    static readonly this = 'this';

    /**
     * Class memory scope root path.
     */
    static readonly class = 'class';

    /**
     * Settings memory scope root path.
     */
    static readonly settings = 'settings';

    /**
     * Turn memory scope root path.
     */
    static readonly turn = 'turn';
}
