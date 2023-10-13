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

/**
 * Base class for all prompt augmentations.
 */
export class AugmentationSection<TState extends TurnState = TurnState> extends PromptSectionBase<TState> {
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