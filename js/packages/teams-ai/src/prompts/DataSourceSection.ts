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

/**
 * A section that renders a data source to a prompt.
 */
export class DataSourceSection extends PromptSectionBase {
    private readonly _dataSource: DataSource;

    /**
     * Creates a new `DataSourceSection` instance.
     * @param dataSource The data source to render.
     * @param tokens Desired number of tokens to render.
     */
    public constructor(dataSource: DataSource, tokens: number) {
        super(tokens, true, '\n\n');
        this._dataSource = dataSource;
    }

    /**
     * @private
     */
    public async renderAsMessages(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>> {
        // Render data source
        const budget = this.getTokenBudget(maxTokens);
        const rendered = await this._dataSource.renderData(context, memory, tokenizer, budget);

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