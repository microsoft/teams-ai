/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Tokenizer } from './Tokenizer';
import { encode, decode } from 'gpt-tokenizer';

/**
 * Tokenizer that uses GPT's cl100k_base encoding.
 * To use GPT-3 encoding, pass in an instance of GPT3Tokenizer.
 */
export class GPTTokenizer implements Tokenizer {
    public decode(tokens: number[]): string {
        return decode(tokens);
    }

    public encode(text: string): number[] {
        return encode(text);
    }
}
