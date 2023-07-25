/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Represents an Express or Restify response object.
 *
 * This interface supports the framework and is not intended to be called directly for your code.
 */
export interface WebResponse {
    /**
     *
     * Optional. The underlying socket.
     */
    socket?: any;

    /**
     * When implemented in a derived class, sends a FIN packet.
     *
     * @param args The arguments for the end event.
     *
     * @returns A reference to the response object.
     */
    end(...args: any[]): any;

    /**
     * When implemented in a derived class, sends the response.
     *
     * @param body The response payload.
     *
     * @returns A reference to the response object.
     */
    send(body: any): any;

    /**
     * When implemented in a derived class, sets the HTTP status code for the response.
     *
     * @param status The status code to use.
     *
     * @returns The status code.
     */
    status(status: number): any;
}
