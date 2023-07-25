/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Provides details for token polling.
 */
export interface TokenPollingSettings {
    /**
     * Polling timeout time in milliseconds. This is equivalent to login flow timeout.
     */
    timeout?: number;

    /**
     * Time Interval in milliseconds between token polling requests.
     */
    interval?: number;
}

/**
 * TurnState key for the OAuth login timeout
 */
export const OAuthLoginTimeoutKey = 'loginTimeout';

/**
 * Name of the token polling settings key.
 */
export const TokenPollingSettingsKey = 'tokenPollingSettings';

/**
 *  Default amount of time an OAuthCard will remain active (clickable and actively waiting for a token).
 *  After this time:
 *  (1) the OAuthCard will not allow the user to click on it.
 *  (2) any polling triggered by the OAuthCard will stop.
 */
export const OAuthLoginTimeoutMsValue = 900000;
