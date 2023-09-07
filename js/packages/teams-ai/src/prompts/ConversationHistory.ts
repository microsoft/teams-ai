import { Message, PromptFunctions, RenderedPromptSection } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { Utilities } from "../Utilities";
import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { Tokenizer } from "../ai";

/**
 * A section that renders the conversation history.
 */
export class ConversationHistory<TState extends TurnState = TurnState> extends PromptSectionBase<TState> {
    public readonly variable: string;
    public readonly userPrefix: string;
    public readonly assistantPrefix: string;

    /**
     * Creates a new 'ConversationHistory' instance.
     * @param variable Name of memory variable used to store the histories `Message[]`.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `proportional` with a value of `1.0`.
     * @param required Optional. Indicates if this section is required. Defaults to `false`.
     * @param userPrefix Optional. Prefix to use for user messages when rendering as text. Defaults to `user: `.
     * @param assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(variable: string, tokens: number = 1.0, required: boolean = false, userPrefix: string = 'user: ', assistantPrefix: string = 'assistant: ', separator: string = '\n') {
        super(tokens, required, separator);
        this.variable = variable;
        this.userPrefix = userPrefix;
        this.assistantPrefix = assistantPrefix;
    }

    public async renderAsText(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
      // Get messages from memory
      const history: Message[] = (state.getValue<Message[]>(this.variable) ?? []).slice();

      // Populate history and stay under the token budget
      let tokens = 0;
      const budget = this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
      const separatorLength = tokenizer.encode(this.separator).length;
      const lines: string[] = [];
      for (let i = history.length - 1; i >= 0; i--) {
          const msg = history[i];
            const message: Message = { role: msg.role, content: Utilities.toString(tokenizer, msg.content) };
          const prefix = message.role === 'user' ? this.userPrefix : this.assistantPrefix;
          const line = prefix + message.content;
          const length = tokenizer.encode(line).length + (lines.length > 0 ? separatorLength : 0);

          // Add initial line if required
          if (lines.length === 0 && this.required) {
              tokens += length;
              lines.unshift(line);
              continue;
          }

          // Stop if we're over the token budget
          if (tokens + length > budget) {
              break;
          }

          // Add line
          tokens += length;
          lines.unshift(line);
      }

      return { output: lines.join(this.separator), length: tokens, tooLong: tokens > maxTokens };
   }

    public async renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Get messages from memory
        const history: Message[] = (state.getValue<Message[]>(this.variable) ?? []).slice();

        // Populate messages and stay under the token budget
        let tokens = 0;
        const budget = this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
        const messages: Message[] = [];
        for (let i = history.length - 1; i >= 0; i--) {
            // Clone message
            const msg = history[i];
            const message: Message = Object.assign({}, msg);
            if (msg.content !== null) {
                message.content = Utilities.toString(tokenizer, msg.content);
            }

            // Get message length
            const length = tokenizer.encode(PromptSectionBase.getMessageText(message)).length;

            // Add initial message if required
            if (messages.length === 0 && this.required) {
                tokens += length;
                messages.unshift(message);
                continue;
            }

            // Stop if we're over the token budget
            if (tokens + length > budget) {
                break;
            }

            // Add message
            tokens += length;
            messages.unshift(message);
        }

        return { output: messages, length: tokens, tooLong: tokens > maxTokens };
    }
}