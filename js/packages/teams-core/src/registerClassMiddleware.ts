/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';

/**
 * Middleware for adding an object to or registering a service with the current turn context.
 */
export class RegisterClassMiddleware<T> implements Middleware {
    private _key: string | symbol;

    /**
     * Initialize a new instance of the RegisterClassMiddleware class.
     *
     * @param service The object or service to add.
     * @param key The key for service object in turn state.
     */
    constructor(service: T, key: string | symbol) {
        this.service = service;
        this._key = key;
    }

    /**
     * The object or service to add to the turn context.
     */
    service: T;

    /**
     * Adds the associated object or service to the current turn context.
     *
     * @param turnContext The context object for this turn.
     * @param next The delegate to call to continue the bot middleware pipeline.
     */
    async onTurn(turnContext: TurnContext, next: () => Promise<void>): Promise<void> {
        turnContext.turnState.set(this._key, this.service);
        if (next) {
            await next();
        }
    }
}
