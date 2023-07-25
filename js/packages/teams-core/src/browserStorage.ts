/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { MemoryStorage } from './memoryStorage';

/**
 * Storage provider that uses browser local storage.
 *
 * @remarks
 * Anything written to the store will remain persisted until the user manually flushes their
 * browsers cookies and other site data.
 *
 * ```JavaScript
 * const { BrowserLocalStorage, UserState } = require('botbuilder');
 *
 * const userState = new UserState(new BrowserLocalStorage());
 * ```
 */
export class BrowserLocalStorage extends MemoryStorage {
    /**
     * Creates a new [BrowserLocalStorage](xref:botbuilder-core.BrowserLocalStorage) instance.
     */
    constructor() {
        super(localStorage as any);
    }
}

/**
 * Storage provider that uses browser session storage.
 *
 * @remarks
 * Anything written to the store will only be persisted for the lifetime of a single page within a
 * browser tab. The storage will survive page reloads but closing the tab will delete anything
 * persisted by the store and opening a new browser tab will create a new persistance store for the
 * page.
 *
 * ```JavaScript
 * const { BrowserSessionStorage, ConversationState } = require('botbuilder');
 *
 * const conversationState = new ConversationState(new BrowserSessionStorage());
 * ```
 */
export class BrowserSessionStorage extends MemoryStorage {
    /**
     * Creates a new [BrowserSessionStorage](xref:botbuilder-core.BrowserSessionStorage) instance.
     */
    constructor() {
        super(sessionStorage as any);
    }
}
