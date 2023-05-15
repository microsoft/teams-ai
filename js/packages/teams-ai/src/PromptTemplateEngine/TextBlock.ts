/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { Block, BlockTypes } from './Block';

/**
 * @private
 */
export class TextBlock extends Block {
    constructor(content: string, startIndex?: number, endIndex?: number) {
        super();
        if (typeof startIndex == 'number') {
            this.content = content.substring(startIndex, endIndex);
        } else {
            this.content = content;
        }
    }

    public get type(): BlockTypes {
        return BlockTypes.Text;
    }

    public isValid(): { valid: boolean; error: string } {
        return {
            valid: true,
            error: ''
        };
    }

    public render(context: TurnContext, state: TurnState): string {
        return this.content;
    }
}
