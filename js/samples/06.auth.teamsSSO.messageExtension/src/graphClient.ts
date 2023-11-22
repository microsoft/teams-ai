// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

/**
 * This class is a wrapper for the Microsoft Graph API.
 * See: https://developer.microsoft.com/en-us/graph for more information.
 */
export class GraphClient {
    graphClient: Client;
    _token: string;

    constructor(token: string) {
        if (!token || !token.trim()) {
            throw new Error('GraphClient: Invalid token received.');
        }

        this._token = token;

        // Get an authenticated Microsoft Graph client using the token issued to the user.
        this.graphClient = Client.init({
            authProvider: (done) => {
                done(null, this._token); // First parameter takes an error if you can't get an access token.
            }
        });
    }

    public async getMyProfile() {
        return await this.graphClient.api('/me').get();
    }

    // Gets the user's photo
    public async getProfilePhotoAsync(): Promise<string> {
        const graphPhotoEndpoint = 'https://graph.microsoft.com/v1.0/me/photos/240x240/$value';
        const graphRequestParams = {
            method: 'GET',
            headers: {
                'Content-Type': 'image/png',
                authorization: 'bearer ' + this._token
            }
        };

        const response = await fetch(graphPhotoEndpoint, graphRequestParams);
        if (!response.ok) {
            console.error('ERROR: ', response);
        }

        const imageBuffer = await response.arrayBuffer(); //Get image data as raw binary data

        //Convert binary data to an image URL and set the url in state
        const imageUri = 'data:image/png;base64,' + Buffer.from(imageBuffer).toString('base64');
        return imageUri;
    }
}
