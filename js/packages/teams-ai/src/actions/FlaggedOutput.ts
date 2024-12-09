/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StopCommandName } from './Action';

/**
 * @private
 * @returns {() => Promise<string>} A function that logs an error and returns the StopCommandName.
 */
export function flaggedOutput(): () => Promise<string> {
    return async () => {
        console.error(
            `The bots output has been moderated but no handler was registered for 'AI.FlaggedOutputActionName'.`
        );
        return StopCommandName;
    };
}
