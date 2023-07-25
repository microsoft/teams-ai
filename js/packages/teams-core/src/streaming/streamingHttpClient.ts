/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WebResource, HttpOperationResponse, HttpClient } from '@azure/ms-rest-js';
import { IStreamingTransportServer, StreamingRequest } from 'botframework-streaming';

/**
 * An implementation of `HttpClient` that adds compatibility with streaming connections.
 */
export class StreamingHttpClient implements HttpClient {
    private readonly server: IStreamingTransportServer;

    /**
     * Creates a new streaming Http client.
     *
     * @param server Transport server implementation to be used.
     */
    constructor(server: IStreamingTransportServer) {
        if (!server) {
            throw new Error('StreamingHttpClient: Expected server.');
        }
        this.server = server;
    }

    /**
     * This function hides the default sendRequest of the HttpClient, replacing it
     * with a version that takes the WebResource created by the BotFrameworkAdapter
     * and converting it to a form that can be sent over a streaming transport.
     *
     * @param httpRequest The outgoing request created by the BotframeworkAdapter.
     * @returns The streaming transport compatible response to send back to the client.
     */
    async sendRequest(httpRequest: WebResource): Promise<HttpOperationResponse> {
        if (!httpRequest) {
            throw new Error('StreamingHttpClient.sendRequest(): missing "httpRequest" parameter');
        }
        if (!this.server.isConnected) {
            throw new Error(
                'StreamingHttpClient.sendRequest(): Streaming connection is disconnected, and the request could not be sent.'
            );
        }

        const request = this.mapHttpRequestToProtocolRequest(httpRequest);
        request.path = request.path.substring(request.path.indexOf('/v3'));
        const res = await this.server.send(request);
        return {
            request: httpRequest,
            status: res.statusCode!,
            headers: httpRequest.headers,
            readableStreamBody: res.streams.length > 0 ? res.streams[0].getStream() : undefined,
        };
    }

    /**
     * @private
     */
    private mapHttpRequestToProtocolRequest(httpRequest: WebResource): StreamingRequest {
        return StreamingRequest.create(httpRequest.method, httpRequest.url, httpRequest.body);
    }
}
