/**
 * @private
 */
export function httpError() {
    return async (): Promise<string> => {
        throw new Error(`An AI http request failed`);
    };
}
