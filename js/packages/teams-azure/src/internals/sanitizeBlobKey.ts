// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BlobsTranscriptStoreOptions } from '../blobsTranscriptStore';

/**
 * Ensures that `key` is a properly sanitized Azure Blob Storage key. It should be URI encoded,
 * no longer than 1024 characters, and contain no more than 254 slash ("/") chars.
 *
 * @param {string} key string blob key to sanitize
 * @param {BlobsTranscriptStoreOptions} options Optional settings for BlobsTranscriptStore
 * @returns {string} sanitized blob key
 */
export function sanitizeBlobKey(key: string, options?: BlobsTranscriptStoreOptions): string {
    if (!key || !key.length) {
        throw new Error('Please provide a non-empty key');
    }

    const sanitized = key.split('/').reduce((acc, part, idx) => (part ? [acc, part].join(idx < 255 ? '/' : '') : acc));

    // Options settings to decode key in order to support previous Blob
    if (options?.decodeTranscriptKey) {
        return decodeURIComponent(sanitized).substr(0, 1024);
    }
    return encodeURIComponent(sanitized).substr(0, 1024);
}
