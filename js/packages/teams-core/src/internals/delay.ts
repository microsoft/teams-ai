// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Delay resolution of `promise`
 *
 * @template T type that promise will yield, defaults to `void`
 * @param {Promise<T>} promise an optional promise to delay
 * @param {number} milliseconds how long to delay
 * @returns {Promise<T>} a promise that will resolve to the result of `promise`, delayed by `milliseconds`.
 */
export function delay<T>(promise: Promise<T>, milliseconds: number): Promise<T>;

/**
 * Return a promise that resolves after `milliseconds`.
 *
 * @param {number} milliseconds how long to delay
 * @returns {Promise<void>} a promise that will resolve to the result of `promise`, delayed by `milliseconds`.
 */
export function delay(milliseconds: number): Promise<void>;

/**
 * @internal
 */
export function delay<T>(promiseOrmilliseconds: Promise<T> | number, maybeMilliseconds?: number): Promise<T> {
    if (typeof promiseOrmilliseconds === 'number') {
        return new Promise<T>((resolve) => setTimeout(resolve, promiseOrmilliseconds));
    }

    return new Promise<T>((resolve) => setTimeout(() => resolve(promiseOrmilliseconds), maybeMilliseconds));
}