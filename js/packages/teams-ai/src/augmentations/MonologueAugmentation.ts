/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { ChatCompletionAction, PromptResponse } from "../models";
import { Plan, PredictedCommand, PredictedDoCommand, PredictedSayCommand } from "../planners";
import { Tokenizer } from "../tokenizers";
import { ActionResponseValidator, JSONResponseValidator, Validation } from "../validators";
import { Augmentation } from "./Augmentation";
import { ActionAugmentationSection } from "./ActionAugmentationSection";
import { Schema } from "jsonschema";
import { Message, PromptSection } from "../prompts";
import { Memory } from "../MemoryFork";

export interface InnerMonologue {
    thoughts: {
        thought: string;
        reasoning: string;
        plan: string;
    };
    action: {
        name: string;
        parameters?: Record<string, any>;
    }
}

export const InnerMonologueSchema: Schema = {
    type: "object",
    properties: {
        thoughts: {
            type: "object",
            properties: {
                thought: { type: "string" },
                reasoning: { type: "string" },
                plan: { type: "string" }
            },
            required: ["thought", "reasoning", "plan"]
        },
        action: {
            type: "object",
            properties: {
                name: { type: "string" },
                parameters: { type: "object" }
            },
            required: ["name"]
        }
    },
    required: ["thoughts", "action"]
};

export class MonologueAugmentation implements Augmentation<InnerMonologue|undefined> {
    private readonly _section: ActionAugmentationSection;
    private readonly _monologueValidator: JSONResponseValidator<InnerMonologue> = new JSONResponseValidator(InnerMonologueSchema,  `No valid JSON objects were found in the response. Return a valid JSON object with your thoughts and the next action to perform.`);
    private readonly _actionValidator: ActionResponseValidator;

    public constructor(actions: ChatCompletionAction[]) {
        actions = appendSAYAction(actions);
        this._section = new ActionAugmentationSection(actions, [
            `Return a JSON object with your thoughts and the next action to perform.`,
            `Only respond with the JSON format below and base your plan on the actions above.`,
            `Response Format:`,
            `{"thoughts":{"thought":"<your current thought>","reasoning":"<self reflect on why you made this decision>","plan":"- short bulleted\\n- list that conveys\\n- long-term plan"},"action":{"name":"<action name>","parameters":{"<name>":"<value>"}}}`
        ].join('\n'));
        this._actionValidator = new ActionResponseValidator(actions, true);
    }

    public createPromptSection(): PromptSection|undefined {
        return this._section;
    }

    public async validateResponse(context: TurnContext, memory: Memory, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<InnerMonologue|undefined>> {
        // Validate that we got a well-formed inner monologue
        const validationResult = await this._monologueValidator.validateResponse(context, memory, tokenizer, response, remaining_attempts);
        if (!validationResult.valid) {
            return validationResult;
        }

        // Validate that the action exists and its parameters are valid
        const monologue = validationResult.value as InnerMonologue;
        const parameters = JSON.stringify(monologue.action.parameters ?? {});
        const message: Message = { role: 'assistant', content: undefined, function_call: { name: monologue.action.name, arguments: parameters } };
        const actionValidation = await this._actionValidator.validateResponse(context, memory, tokenizer, { status: 'success', message }, remaining_attempts);
        if (!actionValidation.valid) {
            return actionValidation as any;
        }

        // Return the validated monologue
        return validationResult;
    }

    public createPlanFromResponse(context: TurnContext, memory: Memory, response: PromptResponse<InnerMonologue|undefined>): Promise<Plan> {
        // Identify the action to perform
        let command: PredictedCommand;
        const monologue = response.message!.content as InnerMonologue;
        if (monologue.action.name == 'SAY') {
            command = {
                type: 'SAY',
                response: monologue.action.parameters!.text
            } as PredictedSayCommand;
        } else {
            command = {
                type: 'DO',
                action: monologue.action.name,
                parameters: monologue.action.parameters ?? {}
            } as PredictedDoCommand;
        }
        return Promise.resolve({ type: 'plan', commands: [command] });
    }
}

function appendSAYAction(actions: ChatCompletionAction[]): ChatCompletionAction[] {
    const clone = actions.slice();
    clone.push({
        name: 'SAY',
        description: 'use to ask the user a question or say something',
        parameters: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'text to say or question to ask'
                }
            },
            required: ['text']
        }
    });
    return clone;
}
