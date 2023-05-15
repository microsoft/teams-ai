/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, Storage } from 'botbuilder';

export interface TurnState {
    [key: string]: TurnStateEntry;
}

export interface TurnStateManager<TState extends TurnState> {
    loadState(storage: Storage | undefined, context: TurnContext): Promise<TState>;
    saveState(storage: Storage | undefined, context: TurnContext, state: TState): Promise<void>;
}

export class TurnStateEntry<TValue extends Record<string, any> = Record<string, any>> {
    private _value: TValue;
    private _storageKey?: string;
    private _deleted = false;
    private _hash: string;

    public constructor(value?: TValue, storageKey?: string) {
        this._value = value || ({} as TValue);
        this._storageKey = storageKey;
        this._hash = JSON.stringify(this._value);
    }

    public get hasChanged(): boolean {
        return JSON.stringify(this._value) != this._hash;
    }

    public get isDeleted(): boolean {
        return this._deleted;
    }

    public get value(): TValue {
        if (this.isDeleted) {
            // Switch to a replace scenario
            this._value = {} as TValue;
            this._deleted = false;
        }

        return this._value;
    }

    public get storageKey(): string | undefined {
        return this._storageKey;
    }

    public delete(): void {
        this._deleted = true;
    }

    public replace(state?: TValue): void {
        this._value = state || ({} as TValue);
    }
}
