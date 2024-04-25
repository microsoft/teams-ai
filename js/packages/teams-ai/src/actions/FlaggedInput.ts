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
export function flaggedInput() {
    return async () => {
        console.error(
            `The users input has been moderated but no handler was registered for 'AI.FlaggedInputActionName'.`
        );
        return StopCommandName;
    };
}
