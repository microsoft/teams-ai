/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, MessageContentParts } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';
import { InputFile } from '../InputFileDownloader';

/**
 * A section capable of rendering user input text and images as a user message.
 */
export class UserInputMessage extends PromptSectionBase {
    private readonly _inputVariable: string;
    private readonly _filesVariable: string;

    /**
     * Creates a new 'UserInputMessage' instance.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param inputVariable Optional. Name of the variable containing the user input text. Defaults to `input`.
     * @param filesVariable Optional. Name of the variable containing the user input files. Defaults to `inputFiles`.
     */
    public constructor(tokens: number = -1, inputVariable = 'input', filesVariable = 'inputFiles') {
        super(tokens, true, '\n', 'user: ');
        this._inputVariable = inputVariable;
        this._filesVariable = filesVariable;
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
    ): Promise<RenderedPromptSection<Message<any>[]>> {
        // Get input text & images
        const inputText: string = memory.getValue(this._inputVariable) ?? '';
        const inputFiles: InputFile[] = memory.getValue(this._filesVariable) ?? [];

        // Create message
        const message: Message<MessageContentParts[]> = {
            role: 'user',
            content: []
        };

        // Append text content part
        let length = 0;
        let budget = this.getTokenBudget(maxTokens);
        if (inputText.length > 0) {
            const encoded = tokenizer.encode(inputText);
            if (encoded.length <= budget) {
                message.content!.push({ type: 'text', text: inputText });
                length += encoded.length;
                budget -= encoded.length;
            } else {
                message.content!.push({ type: 'text', text: tokenizer.decode(encoded.slice(0, budget)) });
                length += budget;
                budget = 0;
            }
        }

        // Append image content parts
        const images = inputFiles.filter((f) => f.contentType.startsWith('image/'));
        for (const image of images) {
            // Check for budget to add image
            // TODO: This accounts for low detail images but not high detail images.
            // Additional work is needed to account for high detail images.
            if (budget < 85) {
                break;
            }

            // Add image
            const url = `data:${image.contentType};base64,${image.content.toString('base64')}`;
            message.content!.push({ type: 'image_url', image_url: { url } });
            length += 85;
            budget -= 85;
        }

        // Return output
        return { output: [message], length, tooLong: false };
    }
}
