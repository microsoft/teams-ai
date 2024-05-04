/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @private
 */
export function httpError() {
    return async (): Promise<string> => {
        throw new Error(`An AI http request failed`);
    };
}
