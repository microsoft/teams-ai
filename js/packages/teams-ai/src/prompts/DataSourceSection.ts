/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from "./Message";
import { PromptFunctions } from "./PromptFunctions";
import { RenderedPromptSection } from "./PromptSection";
import { PromptSectionBase } from "./PromptSectionBase";
import { TurnContext } from 'botbuilder';
import { Tokenizer } from "../tokenizers";
import { DataSource } from "../dataSources";
import { Memory } from "../MemoryFork";

export class DataSourceSection extends PromptSectionBase {
    private readonly _dataSource: DataSource;

    public constructor(dataSource: DataSource, tokens: number) {
        super(tokens, true, '\n\n');
        this._dataSource = dataSource;
    }

    public async renderAsMessages(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>> {
        // Render data source
        const rendered = await this._dataSource.renderData(context, memory, tokenizer, maxTokens);

        // Return as a 'system' message
        // - The role will typically end up being ignored because as this section is usually added
        //   to a `GroupSection` which will override the role.
        return {
            output: [{ role: 'system', content: rendered.output }],
            length: rendered.length,
            tooLong: rendered.tooLong
        };
    }
}