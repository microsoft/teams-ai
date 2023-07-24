/**
 * @module botframework-connector
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as adal from 'adal-node';
import { AppCredentials } from './appCredentials';

/**
 * CertificateAppCredentials auth implementation
 */
export class CertificateAppCredentials extends AppCredentials {
    certificateThumbprint: string;
    certificatePrivateKey: string;

    /**
     * Initializes a new instance of the [CertificateAppCredentials](xref:botframework-connector.CertificateAppCredentials) class.
     *
     * @param appId Microsoft application Id related to the certificate.
     * @param certificateThumbprint A hex encoded thumbprint of the certificate.
     * @param certificatePrivateKey A PEM encoded certificate private key.
     * @param channelAuthTenant Optional. The oauth token tenant.
     * @param oAuthScope Optional. The scope for the token.
     */
    constructor(
        appId: string,
        certificateThumbprint: string,
        certificatePrivateKey: string,
        channelAuthTenant?: string,
        oAuthScope?: string
    ) {
        super(appId, channelAuthTenant, oAuthScope);
        this.certificateThumbprint = certificateThumbprint;
        this.certificatePrivateKey = certificatePrivateKey;
    }

    protected async refreshToken(): Promise<adal.TokenResponse> {
        if (!this.refreshingToken) {
            this.refreshingToken = new Promise<adal.TokenResponse>((resolve, reject) => {
                this.authenticationContext?.acquireTokenWithClientCertificate(
                    this.oAuthScope,
                    this.appId,
                    this.certificatePrivateKey,
                    this.certificateThumbprint,
                    function (err, tokenResponse) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(tokenResponse as adal.TokenResponse);
                        }
                    }
                );
            });
        }
        return this.refreshingToken;
    }
}
