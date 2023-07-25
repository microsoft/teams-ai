// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StatusCodes } from '@microsoft/teams-connector/src/schema';
import { InvokeResponse } from './invokeResponse';

/**
 * A custom exception for invoke response errors.
 */
export class InvokeException<T = unknown> extends Error {
    /**
     * @param status The Http status code of the error.
     * @param response optional. The body of the exception. Default is null.
     */
    constructor(private readonly status: StatusCodes, private readonly response?: T) {
        super();

        this.name = 'InvokeException';
    }

    /**
     * A factory method that creates a new [InvokeResponse](xref:botbuilder-core.InvokeResponse) object with the status code and body of the current object.
     *
     * @returns A new [InvokeResponse](xref:botbuilder-core.InvokeResponse) object.
     */
    createInvokeResponse(): InvokeResponse {
        return {
            status: this.status,
            body: this.response,
        };
    }
}
