/**
 * @module botbuilder-azure
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { hashSync } from 'bcrypt';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CosmosDbKeyEscape {
    // Older libraries had a max key length of 255.
    // The limit is now 1023. In this library, 255 remains the default for backwards compat.
    // To override this behavior, and use the longer limit, set cosmosDbPartitionedStorageOptions.compatibilityMode to false.
    // https://docs.microsoft.com/en-us/azure/cosmos-db/concepts-limits#per-item-limits
    const maxKeyLength = 255;
    const illegalKeys: string[] = ['\\', '?', '/', '#', '\t', '\n', '\r', '*'];
    const illegalKeyCharacterReplacementMap: Map<string, string> = illegalKeys.reduce<Map<string, string>>(
        (map: Map<string, string>, c: string) => {
            map.set(c, `*${c.charCodeAt(0).toString(16)}`);

            return map;
        },
        new Map()
    );

    /**
     * Converts the key into a DocumentID that can be used safely with CosmosDB.
     * The following characters are restricted and cannot be used in the Id property: '/', '\', '?', '#'
     * More information at https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.documents.resource.id?view=azure-dotnet#remarks
     *
     * @param key The provided key to be escaped.
     * @param keySuffix The string to add a the end of all RowKeys.
     * @param compatibilityMode True if keys should be truncated in order to support previous CosmosDb
     * max key length of 255.  This behavior can be overridden by setting cosmosDbPartitionedStorageOptions.compatibilityMode to false.
     * @returns An escaped key that can be used safely with CosmosDB.
     */
    export function escapeKey(key: string, keySuffix?: string, compatibilityMode?: boolean): string {
        if (!key) {
            throw new Error("The 'key' parameter is required.");
        }

        const keySplitted: string[] = key.split('');

        const firstIllegalCharIndex: number = keySplitted.findIndex((c: string): boolean =>
            illegalKeys.some((i: string) => i === c)
        );

        // If there are no illegal characters return immediately and avoid any further processing/allocations
        if (firstIllegalCharIndex === -1) {
            return truncateKey(`${key}${keySuffix || ''}`, compatibilityMode);
        }

        const sanitizedKey = keySplitted.reduce(
            (result: string, c: string) =>
                result + (illegalKeyCharacterReplacementMap.has(c) ? illegalKeyCharacterReplacementMap.get(c) : c),
            ''
        );

        return truncateKey(`${sanitizedKey}${keySuffix || ''}`, compatibilityMode);

        /**
         * Truncates the key if it exceeds the max key length to have backwards compatibility with older libraries.
         *
         * @param key The key to be truncated.
         * @param truncateKeysForCompatibility True if keys should be truncated in order to support previous CosmosDb
         * max key length of 255. False to override this behavior using the longer limit.
         * @returns The resulting key.
         */
        function truncateKey(key: string, truncateKeysForCompatibility?: boolean): string {
            if (truncateKeysForCompatibility === false) {
                return key;
            }

            if (key.length > maxKeyLength) {
                const saltRounds = 10;
                key = hashSync(key, saltRounds);
            }
            return key;
        }
    }
}
