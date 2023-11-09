/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An AI model that can be used to create embeddings.
 */
export interface EmbeddingsModel {
    /**
     * Creates embeddings for the given inputs.
     * @param inputs Text inputs to create embeddings for.
     * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    createEmbeddings(inputs: string|string[]): Promise<EmbeddingsResponse>;
}

/**
 * Status of the embeddings response.
 * @remarks
 * `success` - The embeddings were successfully created.
 * `error` - An error occurred while creating the embeddings.
 * `rate_limited` - The request was rate limited.
 */
export type EmbeddingsResponseStatus = 'success' | 'error' | 'rate_limited';

/**
 * Response returned by a `EmbeddingsClient`.
 */
export interface EmbeddingsResponse {
    /**
     * Status of the embeddings response.
     */
    status: EmbeddingsResponseStatus;

    /**
     * Optional. Embeddings for the given inputs.
     */
    output?: number[][];

    /**
     * Optional. Message when status is not equal to `success`.
     */
    message?: string;
}
