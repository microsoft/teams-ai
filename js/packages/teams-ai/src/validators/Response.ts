/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utilities for working with Large Language Model responses.
 */
export class Response {
    /**
     * Parse all objects from a response string.
     * @param {string} text Response text to parse.
     * @returns {Record<string, any>[]} Array of parsed objects.
     */
    public static parseAllObjects(text: string): Record<string, any>[] {
        // First try parsing each line
        const objects: Record<string, any>[] = [];
        const lines = text.split('\n');
        if (lines.length > 1) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const obj = this.parseJSON(line);
                if (obj) {
                    objects.push(obj);
                }
            }
        }

        // Next try parsing the entire text
        if (objects.length == 0) {
            const obj = this.parseJSON(text);
            if (obj) {
                objects.push(obj);
            }
        }

        return objects;
    }

    /**
     * Fuzzy JSON parser.
     * @template TObject Type of the object to parse.
     * @param {string} text text to parse.
     * @returns {TObject | undefined} The parsed object or undefined if the object could not be parsed.
     */
    public static parseJSON<TObject = {}>(text: string): TObject | undefined {
        const startBrace = text.indexOf('{');
        if (startBrace >= 0) {
            // Find substring
            const objText = text.substring(startBrace);
            const nesting = ['}'];
            let cleaned = '{';
            let inString = false;
            for (let i = 1; i < objText.length && nesting.length > 0; i++) {
                let ch = objText[i];
                if (inString) {
                    cleaned += ch;
                    if (ch == '\\') {
                        // Skip escape char
                        i++;
                        if (i < objText.length) {
                            cleaned += objText[i];
                        } else {
                            // Malformed
                            return undefined;
                        }
                    } else if (ch == '"') {
                        inString = false;
                    }
                } else {
                    switch (ch) {
                        case '"':
                            inString = true;
                            break;
                        case '{':
                            nesting.push('}');
                            break;
                        case '[':
                            nesting.push(']');
                            break;
                        case '}': {
                            const closeObject = nesting.pop();
                            if (closeObject != '}') {
                                // Malformed
                                return undefined;
                            }
                            break;
                        }
                        case ']': {
                            const closeArray = nesting.pop();
                            if (closeArray != ']') {
                                // Malformed
                                return undefined;
                            }
                            break;
                        }
                        case '<':
                            // The model sometimes fails to wrap <some template> with double quotes
                            ch = `"<`;
                            break;
                        case '>':
                            // Catch the tail end of a template param
                            ch = `>"`;
                            break;
                    }

                    cleaned += ch;
                }
            }

            // Is the object incomplete?
            if (nesting.length > 0) {
                // Lets close it and try to parse anyway
                cleaned += nesting.reverse().join('');
            }

            // Parse cleaned up object
            try {
                const obj = JSON.parse(cleaned);
                return Object.keys(obj).length > 0 ? obj : undefined;
            } catch (err) {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    /**
     * Removes any empty fields from an object.
     * @remarks
     * Empty fields include `null`, `undefined`, `[]`, `{}`, and `""`.
     * @param {Record<string, any>} obj The object to clean.
     * @returns {Record<string, any>} A cleaned object.
     */
    public static removeEmptyValuesFromObject(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key in obj) {
            const value = obj[key];
            const type = typeof value;
            switch (type) {
                case 'string':
                    if (value.length == 0) {
                        continue;
                    }
                    break;
                case 'object':
                    if (value == null) {
                        continue;
                    } else if (Array.isArray(value)) {
                        // keep empty arrays
                    } else if (typeof (value as Date).toISOString !== 'function') {
                        const cleaned = this.removeEmptyValuesFromObject(value);
                        if (Object.keys(cleaned).length == 0) {
                            continue;
                        }
                    }
                    break;
                case 'undefined':
                    continue;
            }

            result[key] = value;
        }

        return result;
    }
}
