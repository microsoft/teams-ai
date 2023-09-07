import { Message, PromptFunctions, PromptSection, RenderedPromptSection } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { LayoutEngine } from "./LayoutEngine";
import { TurnContext } from "botbuilder";
import { TurnState } from '../TurnState';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { Tokenizer } from "../ai";

/**
 * A group of sections that will rendered as a single message.
 */
export class GroupSection<TState extends TurnState = DefaultTurnState> extends PromptSectionBase<TState> {
    private readonly _layoutEngine: LayoutEngine<TState>;

    public readonly sections: PromptSection<TState>[];
    public readonly role: string;

    /**
     *
     * @param sections List of sections to group together.
     * @param role Optional. Message role to use for this section. Defaults to `system`.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(sections: PromptSection<TState>[], role: string = 'system', tokens: number = -1, required: boolean = true, separator: string = '\n\n', textPrefix?: string) {
        super(tokens, required, separator, textPrefix);
        this._layoutEngine = new LayoutEngine<TState>(sections, tokens, required, separator);
        this.sections = sections;
        this.role = role;
    }

    public async renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Render sections to text
        const { output, length } = await this._layoutEngine.renderAsText(context, state, functions, tokenizer, maxTokens);

        // Return output as a single message
        return this.returnMessages([{ role: this.role, content: output }], length, tokenizer, maxTokens);
    }
}