/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StatePropertyAccessor, TurnContext } from 'botbuilder';
import { TurnState, TurnStateEntry } from './TurnState';

/**
 * Maps an applications Turn State property to a Bot State property.
 * Note: This is used to inject a Turn State property into a DialogSet.
 * @template T Optional. Type of the property being mapped. Defaults to any.
 */
export class TurnStateProperty<T = any> implements StatePropertyAccessor<T> {
    private readonly _state: TurnStateEntry<any>;
    private readonly _propertyName: string;

    /**
     * Creates a new instance of the `TurnStateProperty` class.
     * @param state Current application turn state.
     * @param scope Name of properties the memory scope to use.
     * @param propertyName Name of the property to use.
     */
    public constructor(state: TurnState, scope: string, propertyName: string) {
        this._propertyName = propertyName;
        this._state = state[scope];
        if (!this._state) {
            throw new Error(`TurnStateProperty: TurnState missing state scope named "${scope}".`);
        }
    }

    /**
     * Deletes the state property.
     */
    public delete(context: TurnContext): Promise<void> {
        this._state.value[this._propertyName] = undefined;
        return Promise.resolve();
    }

    /**
     * Returns the state property value.
     */
    public get(context: TurnContext): Promise<T | undefined>;
    public get(context: TurnContext, defaultValue: T): Promise<T>;
    public get(context: unknown, defaultValue?: unknown): Promise<T | undefined> | Promise<T> {
        if (this._state.value[this._propertyName] == undefined)  {
            this._state.value[this._propertyName] = defaultValue;
        }

        return Promise.resolve(this._state.value[this._propertyName]);
    }

    /**
     * Replace's the state property value.
     */
    public set(context: TurnContext, value: T): Promise<void> {
        this._state.value[this._propertyName] = value;
        return Promise.resolve();
    }

}