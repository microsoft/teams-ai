/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AppCredentials } from './auth/appCredentials';
import fetch from 'cross-fetch';

/**
 * The purpose of this class is to emulate an api client.
 */
export class EmulatorApiClient {
    /**
     * OAuth card emulation.
     *
     * @remarks If the emulation fails, an error containing the status code from the server is thrown.
     *
     * @param credentials [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     * @param emulatorUrl The URL of the emulator.
     * @param emulate `true` to send an emulated OAuth card to the emulator; or `false` to not send the card.
     * @returns `true` on a successful emulation of OAuthCards.
     */
    static async emulateOAuthCards(
        credentials: AppCredentials,
        emulatorUrl: string,
        emulate: boolean
    ): Promise<boolean> {
        const token = await credentials.getToken();
        const requestUrl: string =
            emulatorUrl +
            (emulatorUrl.endsWith('/') ? '' : '/') +
            `api/usertoken/emulateOAuthCards?emulate=${(!!emulate).toString()}`;
        const res = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.ok) {
            return true;
        } else {
            throw new Error(`EmulateOAuthCards failed with status code: ${res.status}`);
        }
    }
}
