/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, PromptFunctions, RenderedPromptSection, PromptSectionBase } from '../prompts';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { ChatCompletionAction } from '../models';
import { Schema } from 'jsonschema';
import { stringify } from 'yaml';
import { Memory } from '../MemoryFork';

/**
 * A prompt section that renders a list of actions to the prompt.
 */
export class ActionAugmentationSection extends PromptSectionBase {
    private readonly _text: string;
    private _tokens?: number[];
    private readonly _actions: Map<string, ChatCompletionAction> = new Map();

    /**
     * Creates a new `ActionAugmentationSection` instance.
     * @param actions List of actions to render.
     * @param callToAction Text to display after the list of actions.
     */
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
                actionList.actions[action.name].parameters =
                    params.type == 'object' && !params.additionalProperties ? params.properties : params;
            }
        }

        // Build augmentation text
        this._text = `${stringify(actionList)}\n\n${callToAction}`;
    }

    /**
     * Map of action names to actions.
     */
    public get actions(): Map<string, ChatCompletionAction> {
        return this._actions;
    }

    /**
     * Renders the prompt section as a list of `Message` objects.
     * @param context Context for the current turn of conversation.
     * @param memory Interface for accessing state variables.
     * @param functions Functions for rendering prompts.
     * @param tokenizer Tokenizer to use for encoding/decoding text.
     * @param maxTokens Maximum number of tokens allowed for the rendered prompt.
     * @returns The rendered prompt section.
     */
    public renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message<string>[]>> {
        // Tokenize text on first use
        if (!this._tokens) {
            this._tokens = tokenizer.encode(this._text);
        }

        // Check for max tokens
        if (this._tokens.length > maxTokens) {
            const trimmed = this._tokens.slice(0, maxTokens);
            return Promise.resolve({
                output: [{ role: 'system', content: tokenizer.decode(trimmed) }],
                length: trimmed.length,
                tooLong: true
            });
        } else {
            return Promise.resolve({
                output: [{ role: 'system', content: this._text }],
                length: this._tokens.length,
                tooLong: false
            });
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
            parameters?: Schema | { [name: string]: Schema };
        };
    };
}
