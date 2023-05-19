/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { PromptManager } from '../Prompts';
import { TurnState } from '../TurnState';

/**
 * @private
 */
export enum BlockTypes {
    Undefined = 0,
    Text = 1,
    Code = 2,
    Variable = 3
}

/**
 * @private
 */
export abstract class Block {
    public get type(): BlockTypes {
        return BlockTypes.Undefined;
    }

    public content = '';

    public renderCode(
        context: TurnContext,
        state: TurnState,
        promptManager: PromptManager<TurnState>
    ): Promise<string> {
        throw new Error(`This block doesn't support code execution`);
    }

    public abstract isValid(): { valid: boolean; errorMessage?: string };

    public abstract render(context: TurnContext, state: TurnState): string;
}
