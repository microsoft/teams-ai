import { TemplateSection } from "./TemplateSection";
import { TurnState } from '../TurnState';

/**
 * A message sent by the assistant.
 */
export class AssistantMessage<TState extends TurnState = TurnState> extends TemplateSection<TState> {
    /**
     * Creates a new 'AssistantMessage' instance.
     * @param template Template to use for this section.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(template: string, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(template, 'assistant', tokens, true, '\n', assistantPrefix);
    }
}