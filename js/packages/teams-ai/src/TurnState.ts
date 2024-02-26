/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, Storage, StoreItems } from 'botbuilder';
import { Memory } from './MemoryFork';
import { InputFile } from './InputFileDownloader';

/**
 * @private
 */
const CONVERSATION_SCOPE = 'conversation';

/**
 * @private
 */
const USER_SCOPE = 'user';

/**
 * @private
 */
const TEMP_SCOPE = 'temp';

/**
 * Default conversation state
 * @remarks
 * Inherit a new interface from this base interface to strongly type the applications conversation
 * state.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultConversationState {}

/**
 * Default user state
 * @remarks
 * Inherit a new interface from this base interface to strongly type the applications user
 * state.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultUserState {}

/**
 * Default temp state
 * @remarks
 * Inherit a new interface from this base interface to strongly type the applications temp
 * state.
 */
export interface DefaultTempState {
    /**
     * Input passed from the user to the AI Library
     */
    input: string;

    /**
     * Downloaded files passed by the user to the AI Library
     */
    inputFiles: InputFile[];

    /**
     * Output returned from the last executed action
     */
    lastOutput: string;

    /**
     * All outputs returned from the action sequence that was executed
     */
    actionOutputs: Record<string, string>;

    /**
     * User authentication tokens
     */
    authTokens: { [key: string]: string };

    /**
     * Flag indicating whether a token exchange event has already been processed
     */
    duplicateTokenExchange?: boolean;
}

/**
 * Base class defining a collection of turn state scopes.
 * @remarks
 * Developers can create a derived class that extends `TurnState` to add additional state scopes.
 * ```JavaScript
 * class MyTurnState extends TurnState {
 *   protected async onComputeStorageKeys(context) {
 *     const keys = await super.onComputeStorageKeys(context);
 *     keys['myScope'] = `myScopeKey`;
 *     return keys;
 *   }
 *
 *   public get myScope() {
 *     const scope = this.getScope('myScope');
 *     if (!scope) {
 *       throw new Error(`MyTurnState hasn't been loaded. Call load() first.`);
 *     }
 *     return scope.value;
 *   }
 *
 *   public set myScope(value) {
 *     const scope = this.getScope('myScope');
 *     if (!scope) {
 *       throw new Error(`MyTurnState hasn't been loaded. Call load() first.`);
 *     }
 *     scope.replace(value);
 *   }
 * }
 * ```
 */
/**
 * Represents the turn state for a conversation.
 * Turn state includes conversation state, user state, and temporary state.
 * Provides methods to access, modify, and delete the state objects.
 * @template TConversationState
 * @param {TConversationState} TConversationState The type of the conversation state object.
 * @param {TUserState} TUserState The type of the user state object.
 * @param {TTempState} TTempState - The type of the temporary state object.
 */
export class TurnState<
    TConversationState = DefaultConversationState,
    TUserState = DefaultUserState,
    TTempState = DefaultTempState
> implements Memory
{
    private _scopes: Record<string, TurnStateEntry> = {};
    private _isLoaded = false;
    private _loadingPromise?: Promise<boolean>;
    private _stateNotLoadedString = `TurnState hasn't been loaded. Call load() first.`;

    /**
     * Accessor for the conversation state.
     */
    /**
     * Gets the conversation state from the turn state.
     * @template TConversationState
     * @returns {TConversationState} The conversation state.
     * @throws Error if TurnState hasn't been loaded. Call load() first.
     */
    public get conversation(): TConversationState {
        const scope = this.getScope(CONVERSATION_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        return scope.value as TConversationState;
    }

    /**
     * Replaces the conversation state with a new value.
     * @param {TConversationState} value New value to replace the conversation state with.
     */
    public set conversation(value: TConversationState) {
        const scope = this.getScope(CONVERSATION_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        scope.replace(value as Record<string, unknown>);
    }

    /**
     * Gets a value indicating whether the applications turn state has been loaded.
     * @returns {boolean} True if the applications turn state has been loaded, false otherwise.
     */
    public get isLoaded(): boolean {
        return this._isLoaded;
    }

    /**
     * Accessor for the temp state.
     @returns {TTempState} The temp TurnState.
     @throws Error if TurnState hasn't been loaded. Call load() first.
     */
    public get temp(): TTempState {
        const scope = this.getScope(TEMP_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        return scope.value as TTempState;
    }

    /**
     * Replaces the temp state with a new value.
     * @param {TTempState} value New value to replace the temp state with.
     * @throws Error if TurnState hasn't been loaded. Call load() first.
     */
    public set temp(value: TTempState) {
        const scope = this.getScope(TEMP_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        scope.replace(value as Record<string, unknown>);
    }

    /**
     * Accessor for the user state.
     * @returns {TUserState} The user TurnState.
     */
    public get user(): TUserState {
        const scope = this.getScope(USER_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        return scope.value as TUserState;
    }

    /**
     * Replaces the user state with a new value.
     */
    public set user(value: TUserState) {
        const scope = this.getScope(USER_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        scope.replace(value as Record<string, unknown>);
    }

    /**
     * Deletes the state object for the current conversation from storage.
     */
    public deleteConversationState(): void {
        const scope = this.getScope(CONVERSATION_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        scope.delete();
    }

    /**
     * Deletes the temp state object.
     */
    public deleteTempState(): void {
        const scope = this.getScope(TEMP_SCOPE);
        if (!scope) {
            throw new Error(this._stateNotLoadedString);
        }
        scope.delete();
    }

    /**
     * Deletes the state object for the current user from storage.
     */
    public deleteUserState(): void {
        const scope = this.getScope(USER_SCOPE);
        if (!scope) {
            throw new Error();
        }
        scope.delete();
    }

    /**
     * Gets a state scope by name.
     * @param {string} scope Name of the state scope to return. (i.e. 'conversation', 'user', or 'temp')
     * @returns {string | undefined} The state scope or undefined if not found.
     */
    public getScope(scope: string): TurnStateEntry | undefined {
        return this._scopes[scope];
    }

    /**
     * Deletes a value from the memory.
     * @param {string} path Path to the value to delete in the form of `[scope].property`. If scope is omitted, the value is deleted from the temporary scope.
     */
    public deleteValue(path: string): void {
        const { scope, name } = this.getScopeAndName(path);
        if (scope.value.hasOwnProperty(name)) {
            delete scope.value[name];
        }
    }

    /**
     * Checks if a value exists in the memory.
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns {boolean} True if the value exists, false otherwise.
     */
    public hasValue(path: string): boolean {
        const { scope, name } = this.getScopeAndName(path);
        return Object.prototype.hasOwnProperty.call(scope.value, name);
    }

    /**
     * Retrieves a value from the memory.
     * @template TValue
     * @param {TValue} path Path to the value to retrieve in the form of `[scope].property`. If scope is omitted, the value is retrieved from the temporary scope.
     * @returns {string} The value or undefined if not found.
     */
    public getValue<TValue = unknown>(path: string): TValue {
        const { scope, name } = this.getScopeAndName(path);
        return scope.value[name] as TValue;
    }

    /**
     * Assigns a value to the memory.
     * @param {string} path Path to the value to assign in the form of `[scope].property`. If scope is omitted, the value is assigned to the temporary scope.
     * @param {unknown} value Value to assign.
     */
    public setValue(path: string, value: unknown): void {
        const { scope, name } = this.getScopeAndName(path);
        scope.value[name] = value;
    }

    /**
     * Loads all of the state scopes for the current turn.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Storage} storage Optional. Storage provider to load state scopes from.
     * @returns {boolean} True if the states needed to be loaded.
     */
    public load(context: TurnContext, storage?: Storage): Promise<boolean> {
        // Only load on first call
        if (this._isLoaded) {
            return Promise.resolve(false);
        }

        // Check for existing load operation
        if (!this._loadingPromise) {
            this._loadingPromise = new Promise<boolean>(async (resolve, reject) => {
                try {
                    // Prevent additional load attempts
                    this._isLoaded = true;

                    // Compute state keys
                    const keys: string[] = [];
                    const scopes = await this.onComputeStorageKeys(context);
                    for (const key in scopes) {
                        if (Object.prototype.hasOwnProperty.call(scopes, key)) {
                            keys.push(scopes[key]);
                        }
                    }

                    // Read items from storage provider (if configured)
                    const items = storage ? await storage.read(keys) : {};

                    // Create scopes for items
                    for (const key in scopes) {
                        if (Object.prototype.hasOwnProperty.call(scopes, key)) {
                            const storageKey = scopes[key];
                            const value = items[storageKey];
                            this._scopes[key] = new TurnStateEntry(value, storageKey);
                        }
                    }

                    // Add the temp scope
                    this._scopes[TEMP_SCOPE] = new TurnStateEntry({});

                    // Clear loading promise
                    this._isLoaded = true;
                    this._loadingPromise = undefined;
                    resolve(true);
                } catch (err) {
                    this._loadingPromise = undefined;
                    reject(err);
                }
            });
        }

        return this._loadingPromise;
    }

    /**
     * Saves all of the state scopes for the current turn.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Storage} storage Optional. Storage provider to save state scopes to.
     */
    public async save(context: TurnContext, storage?: Storage): Promise<void> {
        // Check for existing load operation
        if (!this._isLoaded && this._loadingPromise) {
            // Wait for load to finish
            await this._loadingPromise;
        }

        // Ensure loaded
        if (!this._isLoaded) {
            throw new Error(this._stateNotLoadedString);
        }

        // Find changes and deletions
        let changes: StoreItems | undefined;
        let deletions: string[] | undefined;
        for (const key in this._scopes) {
            if (!Object.prototype.hasOwnProperty.call(this._scopes, key)) {
                continue;
            }
            const entry = this._scopes[key];
            if (entry.storageKey) {
                if (entry.isDeleted) {
                    // Add to deletion list
                    if (deletions) {
                        deletions.push(entry.storageKey);
                    } else {
                        deletions = [entry.storageKey];
                    }
                } else if (entry.hasChanged) {
                    // Add to change set
                    if (!changes) {
                        changes = {};
                    }

                    changes[entry.storageKey] = entry.value;
                }
            }
        }

        // Do we have a storage provider?
        if (storage) {
            // Apply changes
            const promises: Promise<void>[] = [];
            if (changes) {
                promises.push(storage.write(changes));
            }

            // Apply deletions
            if (deletions) {
                promises.push(storage.delete(deletions));
            }

            // Wait for completion
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        }
    }

    /**
     * Computes the storage keys for the state scopes being persisted.
     * @remarks
     * Can be overridden in derived classes to add additional storage scopes.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @returns {Promise<Record<string, string>>} A dictionary of scope names -> storage keys.
     * @throws Error if the context is missing a required property.
     */
    protected onComputeStorageKeys(context: TurnContext): Promise<Record<string, string>> {
        // Compute state keys
        const activity = context.activity;
        const channelId = activity?.channelId;
        const botId = activity?.recipient?.id;
        const conversationId = activity?.conversation?.id;
        const userId = activity?.from?.id;

        if (!channelId) {
            throw new Error('missing context.activity.channelId');
        }

        if (!botId) {
            throw new Error('missing context.activity.recipient.id');
        }

        if (!conversationId) {
            throw new Error('missing context.activity.conversation.id');
        }

        if (!userId) {
            throw new Error('missing context.activity.from.id');
        }

        const keys: Record<string, string> = {};
        keys[CONVERSATION_SCOPE] = `${channelId}/${botId}/conversations/${conversationId}`;
        keys[USER_SCOPE] = `${channelId}/${botId}/users/${userId}`;
        return Promise.resolve(keys);
    }

    /**
     * @private
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns {{ scope: TurnStateEntry; name: string }} Scope and name.
     */
    private getScopeAndName(path: string): { scope: TurnStateEntry; name: string } {
        // Get variable scope and name
        const parts = path.split('.');
        if (parts.length > 2) {
            throw new Error(`Invalid state path: ${path}`);
        } else if (parts.length === 1) {
            parts.unshift(TEMP_SCOPE);
        }

        // Validate scope
        const scope = this.getScope(parts[0]);
        if (scope === undefined) {
            throw new Error(`Invalid state scope: ${parts[0]}`);
        }
        return { scope, name: parts[1] };
    }
}

/**
 * Accessor class for managing an individual state scope.
 */
export class TurnStateEntry {
    private _value: Record<string, unknown>;
    private _storageKey?: string;
    private _deleted = false;
    private _hash: string;

    /**
     * Creates a new instance of the `TurnStateEntry` class.
     * @param {Record<string, unknown>} value Optional. Value to initialize the state scope with. The default is an {} object.
     * @param {string} storageKey Optional. Storage key to use when persisting the state scope.
     */
    public constructor(value?: Record<string, unknown>, storageKey?: string) {
        this._value = value || {};
        this._storageKey = storageKey;
        this._hash = JSON.stringify(this._value);
    }

    /**
     * Gets a value indicating whether the state scope has changed since it was last loaded.
     * @returns {boolean} A value indicating whether the state scope has changed.
     */
    public get hasChanged(): boolean {
        return JSON.stringify(this._value) != this._hash;
    }

    /**
     * Gets a value indicating whether the state scope has been deleted.
     * @returns {boolean} A value indicating whether the state scope has been deleted.
     */
    public get isDeleted(): boolean {
        return this._deleted;
    }

    /**
     * Gets the value of the state scope.
     * @returns {Record<string, unknown>} value of the state scope.
     */
    public get value(): Record<string, unknown> {
        if (this.isDeleted) {
            // Switch to a replace scenario
            this._value = {};
            this._deleted = false;
        }

        return this._value;
    }

    /**
     * Gets the storage key used to persist the state scope.
     * @returns {string | undefined} The storage key used to persist the state scope.
     */
    public get storageKey(): string | undefined {
        return this._storageKey;
    }

    /**
     * Clears the state scope.
     */
    public delete(): void {
        this._deleted = true;
    }

    /**
     * Replaces the state scope with a new value.
     * @template TValue
     * @param {TValue} value New value to replace the state scope with.
     */
    public replace(value?: Record<string, unknown>): void {
        this._value = value || {};
    }
}
