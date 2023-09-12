/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Tokenizer } from './Tokenizer';
import { encode, decode } from 'gpt-3-encoder';

/**
 * Tokenizer that uses GPT-3's encoder.
 */
export class GPT3Tokenizer implements Tokenizer {
    public decode(tokens: number[]): string {
        return decode(tokens);
    }

    public encode(text: string): number[] {
        return encode(text);
    }
}
