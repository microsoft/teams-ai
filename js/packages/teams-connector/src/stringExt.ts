// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Nil } from './types';

/**
 * Check if a string is nil or empty.
 *
 * @param val a value that may be a string
 * @returns true if the string is nil or empty
 */
export function isNilOrEmpty(val: string | Nil): boolean {
    return val == null || val === '';
}
