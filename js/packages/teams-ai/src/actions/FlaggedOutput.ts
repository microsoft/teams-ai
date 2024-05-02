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
 */
export function flaggedOutput() {
    return async () => {
        console.error(
            `The bots output has been moderated but no handler was registered for 'AI.FlaggedOutputActionName'.`
        );
        return StopCommandName;
    };
}
