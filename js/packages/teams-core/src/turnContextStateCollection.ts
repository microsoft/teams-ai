/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const TURN_STATE_SCOPE_CACHE = Symbol('turnStateScopeCache');

/**
 * Values persisted for the lifetime of the turn as part of the [TurnContext](xref:botbuilder-core.TurnContext).
 *
 * @remarks Typical values stored here are objects which are needed for the lifetime of a turn, such
 * as [Storage](xref:botbuilder-core.Storage), [BotState](xref:botbuilder-core.BotState), [ConversationState](xref:botbuilder-core.ConversationState), [LanguageGenerator](xref:botbuilder-dialogs-adaptive.LanguageGenerator), [ResourceExplorer](xref:botbuilder-dialogs-declarative.ResourceExplorer), etc.
 */
export class TurnContextStateCollection extends Map<any, any> {
    /**
     * Gets a typed value from the [TurnContextStateCollection](xref:botbuilder-core.TurnContextStateCollection).
     *
     * @param key The values key.
     */
    get<T = any>(key: any): T;

    /**
     * Gets a value from the [TurnContextStateCollection](xref:botbuilder-core.TurnContextStateCollection).
     *
     * @param key The values key.
     */
    get(key: any): any;

    /**
     * Gets a value from the [TurnContextStateCollection](xref:botbuilder-core.TurnContextStateCollection).
     *
     * @param key The values key.
     * @returns The object; or null if no service is registered by the key.
     */
    get(key: any): unknown {
        return super.get(key);
    }

    /**
     * Push a value by key to the turn's context.
     *
     * @remarks
     * The keys current value (if any) will be saved and can be restored by calling [pop()](#pop).
     * @param key The values key.
     * @param value The new value.
     */
    push(key: any, value: any): void {
        // Get current value and add to scope cache
        const current = this.get(key);
        const cache: Map<any, any[]> = this.get(TURN_STATE_SCOPE_CACHE) || new Map<any, any[]>();
        if (cache.has(key)) {
            cache.get(key)!.push(current);
        } else {
            cache.set(key, [current]);
        }

        // Set new (or current) value and save cache
        if (value == undefined) {
            value = current;
        }
        this.set(key, value);
        this.set(TURN_STATE_SCOPE_CACHE, cache);
    }

    /**
     * Restores a keys previous value, and returns the value that was removed.
     *
     * @param key The values key.
     * @returns The removed value.
     */
    pop(key: any): any {
        // Get current value
        const current = this.get(key);

        // Get previous value from scope cache
        let previous: any;
        const cache: Map<any, any[]> = this.get(TURN_STATE_SCOPE_CACHE) || new Map<any, any[]>();
        if (cache.has(key)) {
            previous = cache.get(key)!.pop();
        }

        // Restore previous value and save cache
        this.set(key, previous);
        this.set(TURN_STATE_SCOPE_CACHE, cache);

        return current;
    }
}
