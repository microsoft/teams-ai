/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotState } from './botState';
import { TurnContext } from './turnContext';

/**
 * A collection of `BotState` plugins that should be loaded or saved in parallel as a single unit.
 * See `AutoSaveStateMiddleware` for an implementation of this class.
 */
export class BotStateSet {
    /**
     * Array of the sets `BotState` plugins.
     */
    readonly botStates: BotState[] = [];

    /**
     * Creates a new BotStateSet instance.
     *
     * @param botStates One or more BotState plugins to register.
     */
    constructor(...botStates: BotState[]) {
        BotStateSet.prototype.add.apply(this, botStates);
    }

    /**
     * Registers one or more `BotState` plugins with the set.
     *
     * @param botStates One or more BotState plugins to register.
     * @returns The updated BotStateSet.
     */
    add(...botStates: BotState[]): this {
        botStates.forEach((botstate: BotState) => {
            if (typeof botstate.load === 'function' && typeof botstate.saveChanges === 'function') {
                this.botStates.push(botstate);
            } else {
                throw new Error("BotStateSet: a object was added that isn't an instance of BotState.");
            }
        });

        return this;
    }

    /**
     * Calls `BotState.load()` on all of the BotState plugins in the set.
     *
     * @remarks
     * This will trigger all of the plugins to read in their state in parallel.
     *
     * ```JavaScript
     * await stateSet.readAll(context);
     * ```
     * @param context Context for current turn of conversation with the user.
     * @param force (Optional) If `true` the cache will be bypassed and the state will always be read in directly from storage. Defaults to `false`.
     */
    async loadAll(context: TurnContext, force = false): Promise<void> {
        const promises: Promise<any>[] = this.botStates.map((botstate: BotState) => botstate.load(context, force));

        await Promise.all(promises);

        return;
    }

    /**
     * Calls `BotState.saveChanges()` on all of the BotState plugins in the set.
     *
     * @remarks
     * This will trigger all of the plugins to write out their state in parallel.
     *
     * ```JavaScript
     * await stateSet.saveAllChanges(context);
     * ```
     * @param context Context for current turn of conversation with the user.
     * @param force (Optional) if `true` the state will always be written out regardless of its change state. Defaults to `false`.
     */
    async saveAllChanges(context: TurnContext, force = false): Promise<void> {
        const promises: Promise<void>[] = this.botStates.map((botstate: BotState) =>
            botstate.saveChanges(context, force)
        );

        await Promise.all(promises);

        return;
    }
}
