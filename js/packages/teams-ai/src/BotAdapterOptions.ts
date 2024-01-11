/**
 * @module teams-ai
 */

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TeamsBotFrameworkAuthentication } from './TeamsBotFrameworkAuthentication';

/**
 * Options for `BotAdapter`
 */
export interface BotAdapterOptions {
    /**
     * Authentication options for initializing the `BotAdapter`.
     * When `undefined` no adapter will be initialized.
     */
    authentication: TeamsBotFrameworkAuthentication;
}
