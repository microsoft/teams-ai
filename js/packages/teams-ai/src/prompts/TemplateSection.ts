/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';
import { Utilities } from '../Utilities';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * A template section that will be rendered as a message.
 * @remarks
 * This section type is used to render a template as a message. The template can contain
 * parameters that will be replaced with values from memory or call functions to generate
 * dynamic content.
 *
 * Template syntax:
 * - `{{$memoryKey}}` - Renders the value of the specified memory key.
 * - `{{functionName}}` - Calls the specified function and renders the result.
 * - `{{functionName arg1 arg2 ...}}` - Calls the specified function with the provided list of arguments.
 *
 * Function arguments are optional and separated by spaces. They can be quoted using `'`, `"`, or `\`` delimiters.
 */
export class TemplateSection extends PromptSectionBase {
    private _parts: PartRenderer[] = [];

    public readonly template: string;
    public readonly role: string;

    /**
     * Creates a new 'TemplateSection' instance.
     * @param template Template to use for this section.
     * @param role Message role to use for this section.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(
        template: string,
        role: string,
        tokens: number = -1,
        required: boolean = true,
        separator: string = '\n',
        textPrefix?: string
    ) {
        super(tokens, required, separator, textPrefix);
        this.template = template;
        this.role = role;
        this.parseTemplate();
    }

    /**
     * @param context
     * @param memory
     * @param functions
     * @param tokenizer
     * @param maxTokens
     * @private
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message[]>> {
        // Render parts in parallel
        const renderedParts = await Promise.all(
            this._parts.map((part) => part(context, memory, functions, tokenizer, maxTokens))
        );

        // Join all parts
        const text = renderedParts.join('');
        const length = tokenizer.encode(text).length;

        // Return output
        const messages: Message<string>[] = length > 0 ? [{ role: this.role, content: text }] : [];
        return this.returnMessages(messages, length, tokenizer, maxTokens);
    }

    /**
     * @private
     */
    private parseTemplate(): void {
        // Parse template
        let part = '';
        let state = ParseState.inText;
        let stringDelim = '';
        for (let i = 0; i < this.template.length; i++) {
            const char = this.template[i];
            switch (state) {
                case ParseState.inText:
                    if (char === '{' && this.template[i + 1] === '{') {
                        if (part.length > 0) {
                            this._parts.push(this.createTextRenderer(part));
                            part = '';
                        }

                        state = ParseState.inParameter;
                        i++;
                    } else {
                        part += char;
                    }
                    break;
                case ParseState.inParameter:
                    if (char === '}' && this.template[i + 1] === '}') {
                        if (part.length > 0) {
                            part = part.trim();
                            if (part[0] === '$') {
                                this._parts.push(this.createVariableRenderer(part.substring(1)));
                            } else {
                                this._parts.push(this.createFunctionRenderer(part));
                            }
                            part = '';
                        }

                        state = ParseState.inText;
                        i++;
                    } else if (["'", '"', '`'].includes(char)) {
                        stringDelim = char;
                        state = ParseState.inString;
                        part += char;
                    } else {
                        part += char;
                    }
                    break;
                case ParseState.inString:
                    part += char;
                    if (char === stringDelim) {
                        state = ParseState.inParameter;
                    }
                    break;
            }
        }

        // Ensure we ended in the correct state
        if (state !== ParseState.inText) {
            throw new Error(`Invalid template: ${this.template}`);
        }

        // Add final part
        if (part.length > 0) {
            this._parts.push(this.createTextRenderer(part));
        }
    }

    /**
     * @param text
     * @private
     */
    private createTextRenderer(text: string): PartRenderer {
        return (
            context: TurnContext,
            memory: Memory,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            maxTokens: number
        ): Promise<string> => {
            return Promise.resolve(text);
        };
    }

    /**
     * @param name
     * @private
     */
    private createVariableRenderer(name: string): PartRenderer {
        return (
            context: TurnContext,
            memory: Memory,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            maxTokens: number
        ): Promise<string> => {
            const value = memory.getValue(name);
            return Promise.resolve(Utilities.toString(tokenizer, value));
        };
    }

    /**
     * @param param
     * @private
     */
    private createFunctionRenderer(param: string): PartRenderer {
        let name = '';
        const args: string[] = [];
        /**
         *
         */
        function savePart() {
            if (part.length > 0) {
                if (!name) {
                    name = part;
                } else {
                    args.push(part);
                }
                part = '';
            }
        }

        // Parse function name and args
        let part = '';
        let state = ParseState.inText;
        let stringDelim = '';
        for (let i = 0; i < param.length; i++) {
            const char = param[i];
            switch (state) {
                case ParseState.inText:
                    if (["'", '"', '`'].includes(char)) {
                        savePart();
                        stringDelim = char;
                        state = ParseState.inString;
                    } else if (char == ' ') {
                        savePart();
                    } else {
                        part += char;
                    }
                    break;
                case ParseState.inString:
                    if (char === stringDelim) {
                        savePart();
                        state = ParseState.inText;
                    } else {
                        part += char;
                    }
                    break;
            }
        }

        // Add final part
        savePart();

        // Return renderer
        return async (
            context: TurnContext,
            memory: Memory,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            maxTokens: number
        ): Promise<string> => {
            const value = await functions.invokeFunction(name, context, memory, tokenizer, args);
            return Utilities.toString(tokenizer, value);
        };
    }
}

/**
 * @private
 */
type PartRenderer = (
    context: TurnContext,
    memory: Memory,
    functions: PromptFunctions,
    tokenizer: Tokenizer,
    maxTokens: number
) => Promise<string>;

/**
 * @private
 */
enum ParseState {
    inText,
    inParameter,
    inString
}
