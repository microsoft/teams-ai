// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Newable ensures that a given value is a constructor
export type Newable<T, A extends unknown[] = unknown[]> = new (...args: A) => T;

/**
 * Maybe cast value to a particular type
 *
 * @template T type to maybe cast to
 * @param {any} value value to maybe cast
 * @param {Newable<T>} ctor optional class to perform instanceof check
 * @returns {T} value, maybe casted to T
 */
export function maybeCast<T>(value: unknown, ctor?: Newable<T>): T {
    if (ctor != null && value instanceof ctor) {
        return value;
    }

    return value as T;
}