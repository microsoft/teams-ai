/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BotAdapter } from './botAdapter';
import { BotState } from './botState';
import { RegisterClassMiddleware } from './registerClassMiddleware';

/**
 * Adds middleware to the adapter to register one or more BotState objects on the turn context.
 * The middleware registers the state objects on the turn context at the start of each turn.
 *
 * @param botAdapter The adapter on which to register the state objects.
 * @param botStates The state objects to register.
 * @returns The updated adapter.
 */
export function useBotState(botAdapter: BotAdapter, ...botStates: BotState[]): BotAdapter {
    for (const botState of botStates) {
        const key = botState.constructor.name;
        botAdapter.use(new RegisterClassMiddleware(botState, key));
    }

    return botAdapter;
}
