/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { PromptManager } from '../Prompts';
import { TurnState } from '../TurnState';

export enum BlockTypes {
    Undefined = 0,
    Text = 1,
    Code = 2,
    Variable = 3
}

export abstract class Block {
    public get type(): BlockTypes {
        return BlockTypes.Undefined;
    }

    public content: string = '';

    public renderCode(
        context: TurnContext,
        state: TurnState,
        promptManager: PromptManager<TurnState>
    ): Promise<string> {
        throw new Error(`This block doesn't support code execution`);
    }

    public abstract isValid(): { valid: boolean; error?: string };

    public abstract render(context: TurnContext, state: TurnState): string;
}
