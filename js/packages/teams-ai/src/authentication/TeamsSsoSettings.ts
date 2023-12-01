// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Configuration } from "@azure/msal-node";

/**
 * Represents the settings for Teams Single Sign-On (SSO) authentication.
 */
export interface TeamsSsoSettings {
    /**
     * The scopes required for authentication.
     */
    scopes: string[];
    /**
     * The MSAL (Microsoft Authentication Library) configuration.
     */
    msalConfig: Configuration;
    /**
     * The sign-in link for authentication.
     * The library will pass `scope`, `clientId`, and `tenantId` to the link as query parameters.
     * Your sign-in page can leverage these parameters to compose the AAD sign-in URL.
     */
    signInLink: string;
    /**
     * (Optional) number of milliseconds to wait for the user to authenticate.
     * Defaults to a value `900,000` (15 minutes.)
     * Only works in conversional bot scenario.
     */
    timeout?: number;
    /**
     * (Optional) value indicating whether the OAuthPrompt should end upon
     * receiving an invalid message. 
     * Defaults to `true`.
     */
    endOnInvalidMessage?: boolean;
}