/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Helper class containing string utility methods.
 */
export class StringUtils {
    /**
     * Truncate string with ...
     *
     * @param text Text.
     * @param length Length to truncate text.
     * @returns Original string modified.
     */
    static ellipsis(text: string, length: number): string {
        text = text || '';
        if (text.length <= length) {
            return text;
        }

        return `${text.substr(0, length)}...`;
    }

    /**
     * UniqueHash - create a unique hash from a string.
     *
     * @remarks
     * The source for this function was derived from the following article:
     *
     * https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     *
     * @param text Text to hash.
     * @returns A string which is an unique hash.
     */
    static hash(text: string): string {
        const length = text.length;
        let hash = 0;
        for (let i = 0; i < length; i++) {
            const chr = text.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32 bit integer
        }
        return hash.toString();
    }

    /**
     * EllipsisHash - create truncated string with unique hash for the truncated part.
     *
     * @param text Text to truncate.
     * @param length Length to truncate at.
     * @returns The truncated string with unique hash for the truncated part.
     */
    static ellipsisHash(text: string, length: number): string {
        text = text || '';
        if (text.length <= length) {
            return text;
        }

        return `${this.ellipsis(text, length)}${this.hash(text)}`;
    }
}
