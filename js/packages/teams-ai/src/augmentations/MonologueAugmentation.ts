/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { TurnState } from "../TurnState";
import { ChatCompletionAction, PromptResponse } from "../models";
import { Plan } from "../planners";
import { Tokenizer } from "../tokenizers";
import { JSONResponseValidator, Validation } from "../validators";
import { Augmentation } from "./Augmentation";
import { AugmentationSectionBase } from "./AugmentationSectionBase";
import { Schema } from "jsonschema";

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

export class MonologueAugmentation<TState extends TurnState = TurnState>
    extends AugmentationSectionBase<TState>
    implements Augmentation<TState, InnerMonologue|null>
{
    private readonly _monologueValidator: JSONResponseValidator<TState, InnerMonologue> = new JSONResponseValidator(InnerMonologueSchema,  `No valid JSON objects were found in the response. Return a valid JSON object with your thoughts and the next action to perform.`);

    public constructor(actions: ChatCompletionAction[]) {
        super(actions, [
            `Return a JSON object with your thoughts and the next action to perform.`,
            `Only respond with the JSON format below and based your plan on the actions above.`,
            `Response Format:`,
            `{"thoughts":{"thought":"<your current thought>","reasoning":"<self reflect on why you made this decision>","plan":"- short bulleted\\n- list that conveys\\n- long-term plan"},"action":{"name":"<action name>","parameters":{"<name>":"<value>"}}}`
        ].join('\n'));
    }

    public async validateResponse(context: TurnContext, state: TState, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<InnerMonologue|null>> {
        // Validate that we got a well-formed inner monologue
        const validationResult = await this._monologueValidator.validateResponse(context, state, tokenizer, response, remaining_attempts);
        if (!validationResult.valid) {
            return validationResult;
        }

        // Validate that the action exists and its parameters are valid
        const monologue = validationResult.value as InnerMonologue;
        const parameters = JSON.stringify(monologue.action.parameters ?? {});
        const actionValidation = await this.validateActionParameters(context, state, tokenizer, monologue.action.name, parameters);
        if (!actionValidation.valid) {
            return actionValidation as any;
        }

        // Return the validated monologue
        return validationResult;
    }

    public createPlanFromResponse(context: TurnContext, state: TState, validation: Validation<InnerMonologue|null>): Promise<Plan> {
        throw new Error("Method not implemented.");
    }
}