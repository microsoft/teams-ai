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
import { TurnState } from '../TurnState';
import { Tokenizer } from "../tokenizers";
import { DataSource } from "../dataSources";

export class DataSourceSection<TState extends TurnState = TurnState> extends PromptSectionBase<TState> {
    private readonly _dataSource: DataSource<TState>;

    public constructor(dataSource: DataSource<TState>, tokens: number) {
        super(tokens, true, '\n\n');
        this._dataSource = dataSource;
    }

    public async renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<string>[]>> {
        // Render data source
        const rendered = await this._dataSource.renderData(context, state, tokenizer, maxTokens);

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