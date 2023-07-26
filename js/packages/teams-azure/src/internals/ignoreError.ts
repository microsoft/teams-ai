// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RestError } from '@azure/storage-blob';

/**
 * Describes an ignore error function
 */
export type IgnoreError = (err: Error) => boolean;

/**
 * Wrap a promise and provide a function to decide whether to ignore a type of error
 *
 * @template T expected promise return type
 * @param {Promise<T>} promise a promise to await
 * @param {IgnoreError} ignore method that returns true if an error should be ignored
 * @returns {Promise<T | null>} a promise that resolves to `T` or `null` after ignoring any matched errors
 */
export async function ignoreError<T>(promise: Promise<T>, ignore: IgnoreError): Promise<T | null> {
    try {
        return await promise;
    } catch (err: unknown) {
        if (!ignore(err as any)) {
            throw err;
        } else {
            return null;
        }
    }
}

/**
 * Ignore RestErrors that match a set of status codes.
 *
 * @param {number[]} codes HTTP status codes that should not be considered errors
 * @returns {IgnoreError} a function that accepts an error and returns true if it represents one of the ignored status codes
 */
export function isStatusCodeError(...codes: number[]): IgnoreError {
    const ignoredCodes = new Set(codes);
    return function (err) {
        return err instanceof RestError && err.statusCode != null && ignoredCodes.has(err.statusCode);
    };
}
