/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, Storage } from 'botbuilder';

/**
 * Base interface defining a collection of turn state scopes.
 */
export interface TurnState {
    /**
     * A named state scope.
     */
    [key: string]: TurnStateEntry;
}

/**
 * Interface implemented by classes responsible for loading and saving an applications turn state.
 * @template TState Type of the state object being persisted.
 */
export interface TurnStateManager<TState extends TurnState> {
    /**
     * Loads all of the state scopes for the current turn.
     * @param storage Storage provider to load state scopes from.
     * @param context Context for the current turn of conversation with the user.
     * @returns The loaded state scopes.
     */
    loadState(storage: Storage | undefined, context: TurnContext): Promise<TState>;

    /**
     * Saves all of the state scopes for the current turn.
     * @param storage Storage provider to save state scopes to.
     * @param context Context for the current turn of conversation with the user.
     * @param state State scopes to save.
     */
    saveState(storage: Storage | undefined, context: TurnContext, state: TState): Promise<void>;
}

/**
 * Accessor class for managing an individual state scope.
 * @template TValue Optional. Strongly typed value of the state scope.
 */
export class TurnStateEntry<TValue extends Record<string, any> = Record<string, any>> {
    private _value: TValue;
    private _storageKey?: string;
    private _deleted = false;
    private _hash: string;

    /**
     * Creates a new instance of the `TurnStateEntry` class.
     * @param {TValue} value Optional. Value to initialize the state scope with. The default is an {} object.
     * @param {string} storageKey Optional. Storage key to use when persisting the state scope.
     */
    public constructor(value?: TValue, storageKey?: string) {
        this._value = value || ({} as TValue);
        this._storageKey = storageKey;
        this._hash = JSON.stringify(this._value);
    }

    /**
    Gets a value indicating whether the state scope has changed since it was last loaded.
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
     * @returns {TValue} The value of the state scope.
     */
    public get value(): TValue {
        if (this.isDeleted) {
            // Switch to a replace scenario
            this._value = {} as TValue;
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
     * @param {TValue} value New value to replace the state scope with.
     */
    public replace(value?: TValue): void {
        this._value = value || ({} as TValue);
    }
}
