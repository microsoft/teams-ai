/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { ChatCompletionAction, PromptResponse } from "../models";
import { Plan, PredictedSayCommand } from "../planners";
import { Tokenizer } from "../tokenizers";
import { Validation } from "../validators";
import { Augmentation } from "./Augmentation";
import { PromptSection } from "../prompts";
import { Memory } from "../MemoryFork";

export class SequenceAugmentation implements Augmentation<string> {
    public constructor(actions: ChatCompletionAction[]) {
    }

    public createPromptSection(): PromptSection|undefined {
        return undefined;
    }

    public validateResponse(context: TurnContext, memory: Memory, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<string>> {
        return Promise.resolve({
            type: 'Validation',
            valid: true,
        });
    }

    public createPlanFromResponse(context: TurnContext, memory: Memory, response: PromptResponse<string>): Promise<Plan> {
        return Promise.resolve({
            type: 'plan',
            commands: [
                {
                    type: 'SAY',
                    response: response.message!.content ?? ''
                } as PredictedSayCommand
            ]
        });
    }
}
