/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, PromptFunctions, RenderedPromptSection, PromptSectionBase } from "../prompts";
import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { Tokenizer } from "../tokenizers";
import { ChatCompletionAction } from "../models";
import { Schema } from "jsonschema";
import { stringify } from "yaml";
import { Validation } from "../validators";

/**
 * Base class for all prompt augmentations.
 */
export class AugmentationSectionBase<TState extends TurnState = TurnState> extends PromptSectionBase<TState> {
    private readonly _text: string;
    private _tokens?: number[];
    private readonly _actions: Map<string, ChatCompletionAction> = new Map();

    public constructor(actions: ChatCompletionAction[], callToAction: string) {
        super(-1, true, '\n\n');

        // Convert actions to an ActionList
        const actionList: ActionList = { actions: {} };
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            this._actions.set(action.name, action);
            actionList.actions[action.name] = {};
            if (action.description) {
                actionList.actions[action.name].description = action.description;
            }
            if (action.parameters) {
                const params = action.parameters;
                actionList.actions[action.name].parameters = params.type == 'object' && !params.additionalProperties ? params.properties : params;
            }
        }

        // Build augmentation text
        this._text = `${stringify(actionList)}\n\n${callToAction}`;
    }

    public get actions(): Map<string, ChatCompletionAction> {
        return this._actions;
    }

    public renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>> {
        // Tokenize text on first use
        if (!this._tokens) {
            this._tokens = tokenizer.encode(this._text);
        }

        // Check for max tokens
        if (this._tokens.length > maxTokens) {
            const trimmed = this._tokens.slice(0, maxTokens);
            return Promise.resolve({ output: [{ role: 'system', content: tokenizer.decode(trimmed) }], length: trimmed.length, tooLong: true });
        } else {
            return Promise.resolve({ output: [{ role: 'system', content: this._text }], length: this._tokens.length, tooLong: false });
        }
    }

    protected async validateActionParameters(context: TurnContext, state: TState, tokenizer: Tokenizer, actionName: string, parameters?: string): Promise<Validation<Record<string, any>|null>> {
        // Validate that the action exists
        if (!this.actions.has(actionName)) {
            return {
                type: 'Validation',
                valid: false,
                feedback: `The action "${actionName}" does not exist. Try a different action.`
            };
        }

        // Does the action expect parameters?
        const action = this.actions.get(actionName)!;
        if (!action.parameters) {
            return { type: 'Validation', valid: true, value: null };
        }

        // Validate that we got parameters
        const validator = new JSONResponseValidator(
            action.parameters,
            `No arguments were sent with function call. Call the "${function_call.name}" with required arguments as a valid JSON object.`,
            `The function arguments had errors. Apply these fixes and call "${function_call.name}" function again:`
        );
        const args = function_call.arguments === '{}' ? null : function_call.arguments ?? '{}'
        const message: Message = { role: 'assistant', content: args };
        const result = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message }, remaining_attempts);

    }
}

/**
 * @private
 */
interface ActionList {
    actions: {
        [key: string]: {
            description?: string;
            parameters?: Schema | { [name: string]: Schema; };
        };
    };
}