// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Retry a given promise with gradually increasing delay.
 *
 * @param promise a function that returns a promise to retry
 * @param maxRetries the maximum number of times to retry
 * @param initialDelay the initial value to delay before retrying (in milliseconds)
 * @returns a promise resolving to the result of the promise from the promise generating function, or undefined
 */
export async function retry<T>(
    promise: (n: number) => Promise<T>,
    maxRetries: number,
    initialDelay = 500
): Promise<T | undefined> {
    let delay = initialDelay,
        n = 1,
        maybeError: Error | undefined;

    // Take care of negative or zero
    maxRetries = Math.max(maxRetries, 1);

    while (n <= maxRetries) {
        try {
            // Note: return await intentional so we can catch errors
            return await promise(n);
        } catch (err: unknown) {
            maybeError = err as any;

            await new Promise((resolve) => setTimeout(resolve, delay));

            delay *= n;
            n++;
        }
    }

    if (maybeError) {
        throw maybeError;
    }
}
