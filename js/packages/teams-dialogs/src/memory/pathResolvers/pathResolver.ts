/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface PathResolver {
    /**
     * Transform the path
     *
     * @param path Path to inspect.
     * @returns Transformed path
     */
    transformPath(path: string): string;
}
