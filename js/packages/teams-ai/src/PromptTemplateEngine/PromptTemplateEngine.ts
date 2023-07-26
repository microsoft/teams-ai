/* eslint-disable security/detect-object-injection */
/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from '@microsoft/teams-core';
import { PromptManager } from '../Prompts';
import { TurnState } from '../TurnState';
import { Block, BlockTypes } from './Block';
import { CodeBlock } from './CodeBlock';
import { TextBlock } from './TextBlock';
import { VarBlock } from './VarBlock';

/**
 * @private
 */
export class PromptTemplateEngine<TState extends TurnState> {
    private readonly _promptManager: PromptManager<TState>;

    public constructor(promptManager: PromptManager<TState>) {
        this._promptManager = promptManager;
    }

    public extractBlocks(templateText?: string, validate = true): Block[] {
        const blocks = this.tokenizeInternal(templateText);
        if (validate) {
            this.validateBlocksSyntax(blocks);
        }

        return blocks;
    }

    public async render(context: TurnContext, state: TState, textOrBlocks: string | Block[]): Promise<string> {
        if (typeof textOrBlocks == 'string') {
            const blocks = this.extractBlocks(textOrBlocks);
            return await this.render(context, state, blocks);
        } else {
            let result = '';
            for (const block of textOrBlocks) {
                switch (block.type) {
                    case BlockTypes.Text:
                        result += block.content;
                        break;

                    case BlockTypes.Variable:
                        result += block.render(context, state);
                        break;

                    case BlockTypes.Code:
                        result += await block.renderCode(context, state, this._promptManager);
                        break;

                    case BlockTypes.Undefined:
                    default:
                        throw new Error(`Invalid bock of type "${block.type}" encountered.`);
                }
            }

            // TODO: good time to count tokens, though that depends on the model used
            return result;
        }
    }

    public renderVariables(context: TurnContext, state: TState, blocks: Block[]): Block[] {
        return blocks.map((block) => {
            return block.type != BlockTypes.Variable ? block : new TextBlock(block.render(context, state));
        });
    }

    public async renderCode(context: TurnContext, state: TState, blocks: Block[]): Promise<Block[]> {
        const updatedBlocks: Block[] = [];
        for (const block of blocks) {
            if (block.type != BlockTypes.Code) {
                updatedBlocks.push(block);
            } else {
                const codeResult = await block.renderCode(context, state, this._promptManager);
                updatedBlocks.push(new TextBlock(codeResult));
            }
        }

        return updatedBlocks;
    }

    // Blocks delimitation
    private readonly starter: string = '{';
    private readonly ender: string = '}';

    private tokenizeInternal(template?: string): Block[] {
        // An empty block consists of 4 chars: "{{}}"
        const EMPTY_CODE_BLOCK_LENGTH = 4;
        // A block shorter than 5 chars is either empty or invalid, e.g. "{{ }}" and "{{$}}"
        const MIN_CODE_BLOCK_LENGTH = EMPTY_CODE_BLOCK_LENGTH + 1;

        // Render NULL to ""
        // Since the template is a string, all `template` instances can have non-null assertion
        if (template === null) {
            return [new TextBlock('')];
        }

        // If the template is "empty" return the content as a text block
        if (template!.length < MIN_CODE_BLOCK_LENGTH) {
            return [new TextBlock(template!)];
        }

        const blocks: Block[] = [];

        let cursor = 0;
        let endOfLastBlock = 0;

        let startPos = 0;
        let startFound = false;

        while (cursor < template!.length - 1) {
            // When "{{" is found
            if (template![cursor] === this.starter && template![cursor + 1] === this.starter) {
                startPos = cursor;
                startFound = true;
            }
            // When "}}" is found
            else if (startFound && template![cursor] === this.ender && template![cursor + 1] === this.ender) {
                // If there is plain text between the current var/code block and the previous one, capture that as a TextBlock
                if (startPos > endOfLastBlock) {
                    blocks.push(new TextBlock(template!, endOfLastBlock, startPos));
                }

                // Skip ahead to the second "}" of "}}"
                cursor++;

                // Extract raw block
                const contentWithDelimiters = template!.substring(startPos, cursor + 1);

                // Remove "{{" and "}}" delimiters and trim empty chars
                const contentWithoutDelimiters = contentWithDelimiters
                    .substring(2, contentWithDelimiters.length - 2)
                    .trim();

                if (contentWithoutDelimiters.length === 0) {
                    // If what is left is empty, consider the raw block a Text Block
                    blocks.push(new TextBlock(contentWithDelimiters));
                } else {
                    // If the block starts with "$" it's a variable
                    if (VarBlock.hasVarPrefix(contentWithoutDelimiters)) {
                        // Note: validation is delayed to the time VarBlock is rendered
                        blocks.push(new VarBlock(contentWithoutDelimiters));
                    } else {
                        // Note: validation is delayed to the time CodeBlock is rendered
                        blocks.push(new CodeBlock(contentWithoutDelimiters));
                    }
                }

                endOfLastBlock = cursor + 1;
                startFound = false;
            }

            cursor++;
        }

        // If there is something left after the last block, capture it as a TextBlock
        if (endOfLastBlock < template!.length) {
            blocks.push(new TextBlock(template!, endOfLastBlock, template!.length));
        }

        return blocks;
    }

    private validateBlocksSyntax(blocks: Block[]): void {
        blocks.forEach((block) => {
            const { valid, errorMessage: error } = block.isValid();
            if (!valid || error) {
                throw new Error(`Prompt template syntax error: ${error?.toString() ?? 'unknown'}`);
            }
        });
    }
}
