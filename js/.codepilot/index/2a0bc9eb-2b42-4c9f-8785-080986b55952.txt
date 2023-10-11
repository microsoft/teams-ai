import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { ChatCompletionFunction, Tokenizer } from '../ai';

export interface PromptSection<TState extends TurnState = TurnState> {
    /**
     * If true the section is mandatory otherwise it can be safely dropped.
     */
    readonly required: boolean;

    /**
     * The requested token budget for this section.
     * - Values between 0.0 and 1.0 represent a percentage of the total budget and the section will be layed out proportionally to all other sections.
     * - Values greater than 1.0 represent the max number of tokens the section should be allowed to consume.
     */
    readonly tokens: number;

    /**
     * Renders the section as a string of text.
     * @param context Context for the current turn of conversation with the user.
     * @param state Current turn state.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsText(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>>;

    /**
     * Renders the section as a list of messages.
     * @param context Context for the current turn of conversation with the user.
     * @param state Current turn state.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;
}

export interface RenderedPromptSection<T> {
    /**
     * The section that was rendered.
     */
    output: T;

    /**
     * The number of tokens that were rendered.
     */
    length: number;

    /**
     * If true the section was truncated because it exceeded the maxTokens budget.
     */
    tooLong: boolean;
}

export interface Message<TContent = string> {
    /**
     * The messages role. Typically 'system', 'user', 'assistant', 'function'.
     */
    role: string;

    /**
     * Text of the message.
     */
    content: TContent|null;

    /**
     * Optional. A named function to call.
     */
    function_call?: FunctionCall;

    /**
     * Optional. Name of the function that was called.
     */
    name?: string;
}

export interface FunctionCall {
    name?: string;
    arguments?: string;
}

export interface PromptFunctions<TState extends TurnState = TurnState> {
    hasFunction(name: string): boolean;
    getFunction(name: string): PromptFunction<TState>;
    invokeFunction(name: string, context: TurnContext, state: TState, tokenizer: Tokenizer, args: string[]): Promise<any>;
}

export type PromptFunction<TState extends TurnState = TurnState, TArgs = any> = (context: TurnContext, state: TState, functions: PromptFunctions, tokenizer: Tokenizer, args: TArgs) => Promise<any>;

/**
 * Interface for the completion configuration portion of a prompt template.
 */
export interface CompletionConfig {
    /**
     * The models temperature as a number between 0 and 1.
     */
    temperature: number;

    /**
     * The models top_p as a number between 0 and 1.
     */
    top_p: number;

    /**
     * The models presence_penalty as a number between 0 and 1.
     */
    presence_penalty: number;

    /**
     * The models frequency_penalty as a number between 0 and 1.
     */
    frequency_penalty: number;

    /**
     * The maximum number of tokens to generate.
     */
    max_tokens: number;

    /**
     * Optional. Array of stop sequences that when hit will stop generation.
     */
    stop_sequences?: string[];
}

/**
 * Serialized prompt template configuration.
 */
export interface PromptTemplateConfig {
    /**
     * The schema version of the prompt template. Should always be '1'.
     */
    schema: number;

    /**
     * Type of prompt template. Should always be 'completion'.
     */
    type: 'completion';

    /**
     * Description of the prompts purpose.
     */
    description: string;

    /**
     * Completion settings for the prompt.
     */
    completion: CompletionConfig;

    /**
     * Optional. Array of backends (models) to use for the prompt.
     * @summary
     * Passing the name of a model to use here will override the default model used by a planner.
     */
    default_backends?: string[];
}

/**
 * Prompt template cached by the prompt manager.
 */
export interface PromptTemplate<TState extends TurnState = TurnState> {
    /**
     * Text of the prompt template.
     */
    prompt: PromptSection<TState>;

    /**
     * Configuration settings for the prompt template.
     */
    config: PromptTemplateConfig;

    /**
     * Optional list of functions the model may generate JSON inputs for.
     */
    functions?: ChatCompletionFunction[];
}
