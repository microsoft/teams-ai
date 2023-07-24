/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IStatusCodeError, StatusCodes } from 'botframework-schema';

export type StatusCode = number;

/**
 * General `AuthenticationError` class to represent an Authentication error with a Code Status.
 */
export class AuthenticationError extends Error implements IStatusCodeError {
    /**
     * Initializes a new instance of the [AuthenticationError](xref:botframework-connector.AuthenticationError) class.
     *
     * @param message The Error message.
     * @param statusCode The `StatusCode` number to use.
     */
    constructor(message: string, public readonly statusCode: StatusCode) {
        super(message);
    }

    /**
     * Corroborates that the error is of type [IStatusCodeError](xref:botframework-schema.IStatusCodeError).
     *
     * @param err The error to validate.
     * @returns If `err` is an [IStatusCodeError](xref:botframework-schema.IStatusCodeError), the result is true; otherwise false.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    static isStatusCodeError(err: any): err is IStatusCodeError {
        return !!(err && typeof err.statusCode === 'number');
    }

    /**
     * Used to determine a status code from the error message for non-`IStatusCodeError`'s.
     *
     * @param err The error thrown, used to determine an appropriate status code.
     * @returns The error message to be sent as a response.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    static determineStatusCodeAndBuildMessage(err: any): string {
        const errMessage: string = err && err.message ? err.message : 'Internal Server Error';
        const code: number = AuthenticationError.determineStatusCode(errMessage);
        const connectionHeader = "Connection: 'close'\r\n";

        return `HTTP/1.1 ${code} ${StatusCodes[code]}\r\n${errMessage}\r\n${connectionHeader}\r\n`;
    }

    /**
     * @private
     */
    private static determineStatusCode(message: string): StatusCode {
        if (typeof message === 'string') {
            if (message.toLowerCase().startsWith('unauthorized')) {
                return StatusCodes.UNAUTHORIZED;
            } else if (message.toLowerCase().startsWith("'authheader'")) {
                return StatusCodes.BAD_REQUEST;
            }
        }
        return StatusCodes.INTERNAL_SERVER_ERROR;
    }
}
