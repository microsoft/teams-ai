import { PromptSection } from "./types";
import { LayoutEngine } from "./LayoutEngine";
import { TurnState } from '../TurnState';

/**
 * Top level prompt section.
 * @remarks
 * Prompts are compositional such that they can be nested to create complex prompt hierarchies.
 */
export class Prompt<TState extends TurnState = TurnState> extends LayoutEngine<TState> {
    /**
     * Creates a new 'Prompt' instance.
     * @param sections Sections to render.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n\n`.
     */
    public constructor(sections: PromptSection<TState>[], tokens: number = -1, required: boolean = true, separator: string = '\n\n') {
        super(sections, tokens, required, separator);
    }
}
