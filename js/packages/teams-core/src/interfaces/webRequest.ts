/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Represents an Express or Restify request object.
 *
 * This interface supports the framework and is not intended to be called directly for your code.
 */
export interface WebRequest {
    /**
     * Optional. The request body.
     */
    body?: any;

    /***
     * Optional. The request headers.
     */
    headers: any;

    /***
     * Optional. The request method.
     */
    method?: any;

    /***
     * Optional. The request parameters from the url.
     */
    params?: any;

    /***
     * Optional. The values from the query string.
     */
    query?: any;

    /**
     * When implemented in a derived class, adds a listener for an event.
     * The framework uses this method to retrieve the request body when the
     * [body](xref:botbuilder.WebRequest.body) property is `null` or `undefined`.
     *
     * @param event The event name.
     * @param args Arguments used to handle the event.
     *
     * @returns A reference to the request object.
     */
    on?(event: string, ...args: any[]): any;
}
