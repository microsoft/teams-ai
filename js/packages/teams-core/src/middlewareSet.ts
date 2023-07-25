/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from './turnContext';

/**
 * Interface implemented by object based middleware.
 */
export interface Middleware {
    /**
     * Called each time the bot receives a new request.
     *
     * @remarks
     * Calling `await next();` will cause execution to continue to either the next piece of
     * middleware in the chain or the bots main logic if you are the last piece of middleware.
     *
     * Your middleware should perform its business logic before and/or after the call to `next()`.
     * You can short-circuit further execution of the turn by omitting the call to `next()`.
     *
     * The following example shows a simple piece of logging middleware:
     *
     * ```JavaScript
     * class MyLogger {
     *     async onTurn(context, next) {
     *         console.log(`Leading Edge`);
     *         await next();
     *         console.log(`Trailing Edge`);
     *     }
     * }
     * ```
     * @param context Context for current turn of conversation with the user.
     * @param next Function to call to continue execution to the next step in the middleware chain.
     */
    onTurn(context: TurnContext, next: () => Promise<void>): Promise<void>;
}

/**
 * Signature implemented by function based middleware.
 *
 * ```TypeScript
 * type MiddlewareHandler = (context: TurnContext, next: () => Promise<void>) => Promise<void>;
 * ```
 */
export type MiddlewareHandler = (context: TurnContext, next: () => Promise<void>) => Promise<void>;

/**
 * A set of `Middleware` plugins.
 *
 * @remarks
 * The set itself is middleware so you can easily package up a set of middleware that can be composed
 * into an adapter with a single `adapter.use(mySet)` call or even into another middleware set using
 * `set.use(mySet)`.
 *
 * ```JavaScript
 * const { MiddlewareSet } = require('botbuilder');
 *
 * const set = new MiddlewareSet();
 * set.use(async (context, next) => {
 *    console.log(`Leading Edge`);
 *    await next();
 *    console.log(`Trailing Edge`);
 * });
 * ```
 */
export class MiddlewareSet implements Middleware {
    private middleware: MiddlewareHandler[] = [];

    /**
     * Creates a new MiddlewareSet instance.
     *
     * @param {...any} middlewares One or more middleware handlers(s) to register.
     */
    constructor(...middlewares: (MiddlewareHandler | Middleware)[]) {
        this.use(...middlewares);
    }

    /**
     * Processes an incoming activity.
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext) object for this turn.
     * @param next Delegate to call to continue the bot middleware pipeline.
     * @returns {Promise<void>} A Promise representing the async operation.
     */
    onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        return this.run(context, next);
    }

    /**
     * Registers middleware handlers(s) with the set.
     *
     * @remarks This example adds a new piece of middleware to a set:
     * ```JavaScript
     * set.use(async (context, next) => {
     *    console.log(`Leading Edge`);
     *    await next();
     *    console.log(`Trailing Edge`);
     * });
     * ```
     * @param {...any} middlewares One or more middleware handlers(s) to register.
     * @returns The updated middleware set.
     */
    use(...middlewares: (MiddlewareHandler | Middleware)[]): this {
        middlewares.forEach((plugin) => {
            if (typeof plugin === 'function') {
                this.middleware.push(plugin);
            } else if (typeof plugin === 'object' && plugin.onTurn) {
                this.middleware.push((context, next) => plugin.onTurn(context, next));
            } else {
                throw new Error('MiddlewareSet.use(): invalid plugin type being added.');
            }
        });

        return this;
    }

    /**
     * Executes a set of middleware in series.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param next Function to invoke at the end of the middleware chain.
     * @returns A promise that resolves after the handler chain is complete.
     */
    run(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const runHandlers: Function = ([handler, ...remaining]: MiddlewareHandler[]) => {
            try {
                return Promise.resolve(handler ? handler(context, () => runHandlers(remaining)) : next());
            } catch (err: unknown) {
                return Promise.reject(err);
            }
        };

        return runHandlers(this.middleware);
    }
}
