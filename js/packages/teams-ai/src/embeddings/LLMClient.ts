import { ConversationHistory, FunctionRegistry, GPT3Tokenizer, Message, Prompt, PromptFunctions, PromptMemory, PromptSection, Tokenizer, Utilities, VolatileMemory } from "promptrix";
import { PromptResponse, Validation, PromptResponseValidator, PromptCompletionModel } from "./ai/types";
import { DefaultResponseValidator } from "./DefaultResponseValidator";
import { MemoryFork } from "./MemoryFork";
import { Colorize } from "./internals";
import { OpenAIModel } from "../models/OpenAIModel";
import { FunctionResponseValidator } from "./FunctionResponseValidator";

/**
 * Options for an LLMClient instance.
 */
export interface LLMClientOptions {
    /**
     * AI model to use for completing prompts.
     */
    model: PromptCompletionModel;

    /**
     * Prompt to use for the conversation.
     */
    prompt: PromptSection;

    /**
     * Optional. FunctionRegistry to use when expanding prompt template sections.
     * @remarks
     * An empty `FunctionRegistry` instance will be created by default
     */
    functions?: PromptFunctions;

    /**
     * Optional. Memory variable used for storing conversation history.
     * @remarks
     * The history will be stored as a `Message[]` and the variable defaults to `conversation`.
     */
    history_variable?: string;

    /**
     * Optional. Memory variable used for storing the users input message.
     * @remarks
     * The users input is expected to be a `string` but it's optional and defaults to `input`.
     */
    input_variable?: string;

    /**
     * Optional. Maximum number of conversation history messages to maintain.
     * @remarks
     * The number of tokens worth of history included in the prompt is controlled by the
     * `ConversationHistory` section of the prompt. This controls the automatic pruning of the
     * conversation history that's done by the LLMClient instance. This helps keep your memory from
     * getting too big and defaults to a value of `10` (or 5 turns.)
     */
    max_history_messages?: number;

    /**
     * Optional. Maximum number of automatic repair attempts the LLMClient instance will make.
     * @remarks
     * This defaults to a value of `3` and can be set to `0` if you wish to disable repairing of bad responses.
     */
    max_repair_attempts?: number;

    /**
     * Optional. Memory the LLMClient instance should use for rendering the prompt and persisting conversation history.
     * @remarks
     * If not specified a new instance of `VolatileMemory` will be created. Keep in mind that by using
     * VolatileMemory, any conversation history will be deleted when the LLMClient instance is deleted.
     */
    memory?: PromptMemory;

    /**
     * Optional. Tokenizer to use when rendering the prompt or counting tokens.
     * @remarks
     * If not specified a new instance of `GPT3Tokenizer` will be created.
     */
    tokenizer?: Tokenizer;

    /**
     * Optional. Response validator to use when completing prompts.
     * @remarks
     * If not specified a new instance of `DefaultResponseValidator` will be created. The
     * DefaultResponseValidator returns a `Validation` that says all responses are valid.
     */
    validator?: PromptResponseValidator;

    /**
     * Optional. If true, any repair attempts will be logged to the console.
     */
    logRepairs?: boolean;
}

/**
 * The configuration of the LLMClient instance.
 */
export interface ConfiguredLLMClientOptions {
    /**
     * AI model used for completing prompts.
     */
    model: PromptCompletionModel;

    /**
     * Memory variable used for storing conversation history.
     */
    history_variable: string;

    /**
     * Memory variable used for storing the users input message.
     */
    input_variable: string;

    /**
     *  FunctionRegistry used when expanding prompt template sections.
     */
    functions: PromptFunctions;

    /**
     * Maximum number of conversation history messages that will be persisted to memory.
     */
    max_history_messages: number;

    /**
     * Maximum number of automatic repair attempts that will be made.
     */
    max_repair_attempts: number;

    /**
     * Memory used for rendering the prompt and persisting conversation history.
     */
    memory: PromptMemory;

    /**
     * Prompt used for the conversation.
     */
    prompt: PromptSection;

    /**
     * Tokenizer used when rendering the prompt or counting tokens.
     */
    tokenizer: Tokenizer;

    /**
     * Response validator used when completing prompts.
     */
    validator: PromptResponseValidator;

    /**
     * If true, any repair attempts will be logged to the console.
     */
    logRepairs: boolean;
}

/**
 * LLMClient class that's used to complete prompts.
 *
 * @remarks
 * Each wave, at a minimum needs to be configured with a `client`, `prompt`, and `prompt_options`.
 *
 * Configuring the wave to use a `validator` is optional but recommended. The primary benefit to
 * using LLMClient is it's response validation and automatic response repair features. The
 * validator acts as guard and guarantees that you never get an malformed response back from the
 * model. At least not without it being flagged as an `invalid_response`.
 *
 * Using the `JSONResponseValidator`, for example, guarantees that you only ever get a valid
 * object back from `completePrompt()`. In fact, you'll get back a fully parsed object and any
 * additional response text from the model will be dropped. If you give the `JSONResponseValidator`
 * a JSON Schema, you will get back a strongly typed and validated instance of an object in
 * the returned `response.message.content`.
 *
 * When a validator detects a bad response from the model, it gives the model "feedback" as to the
 * problem it detected with its response and more importantly an instruction that tells the model
 * how it should repair the problem. This puts the wave into a special repair mode where it first
 * forks the memory for the conversation and then has a side conversation with the model in an
 * effort to get it to repair its response. By forking the conversation, this isolates the bad
 * response and prevents it from contaminating the main conversation history. If the response can
 * be repaired, the wave will un-fork the memory and use the repaired response in place of the
 * original bad response. To the model it's as if it never made a mistake which is important for
 * future turns with the model. If the response can't be repaired, a response status of
 * `invalid_response` will be returned.
 *
 * When using a well designed validator, like the `JSONResponseValidator`, the wave can typically
 * repair a bad response in a single additional model call. Sometimes it takes a couple of calls
 * to effect a repair and occasionally it won't be able to repair it at all. If your prompt is
 * well designed and you only occasionally see failed repair attempts, I'd recommend just calling
 * the wave a second time. Given the stochastic nature of these models, there's a decent chance
 * it won't make the same mistake on the second call. A well designed prompt coupled with a well
 * designed validator should get the reliability of calling these models somewhere close to 99%
 * reliable.
 *
 * This "feedback" technique works with all the GPT-3 generation of models and I've tested it with
 * `text-davinci-003`, `gpt-3.5-turbo`, and `gpt-4`. There's a good chance it will work with other
 * open source models like `LLaMA` and Googles `Bard` but I have yet to test it with those models.
 *
 * LLMClient supports OpenAI's functions feature and can validate the models response against the
 * schema for the supported functions. When an LLMClient is configured with both a `OpenAIModel`
 * and a `FunctionResponseValidator`, the model will be cloned and configured to send the
 * validators configured list of functions with the request. There's no need to separately
 * configure the models `functions` list, but if you do, the models functions list will be sent
 * instead.
 */
export class LLMClient extends (EventEmitter as { new(): LLMClientEmitter }) {
    /**
     * Configured options for this LLMClient instance.
     */
    public readonly options: ConfiguredLLMClientOptions;

    /**
     * Creates a new `LLMClient` instance.
     * @param options Options to configure the instance with.
     */
    public constructor(options: LLMClientOptions) {
        super();
        this.options = Object.assign({
            functions: new FunctionRegistry(),
            history_variable: 'history',
            input_variable: 'input',
            max_history_messages: 10,
            max_repair_attempts: 3,
            memory: new VolatileMemory(),
            tokenizer: new GPT3Tokenizer(),
            logRepairs: false
        }, options) as ConfiguredLLMClientOptions;

        // Create validator to use
        if (!this.options.validator) {
            // Check for an OpenAI model using functions
            if (this.options.model instanceof OpenAIModel && this.options.model.options.functions) {
                this.options.validator = new FunctionResponseValidator(this.options.model.options.functions);
            } else {
                this.options.validator = new DefaultResponseValidator();
            }
        }
    }

    /**
     * Adds a result from a `function_call` to the history.
     * @param name Name of the function that was called.
     * @param results Results returned by the function.
     */
    public addFunctionResultToHistory(name: string, results: any): void {
        // Convert content to string
        let content = '';
        if (typeof results === "object") {
            if (typeof results.toISOString == "function") {
                content = results.toISOString();
            } else {
                content = JSON.stringify(results);
            }
        } else if (results !== undefined && results !== null) {
            content = results.toString();
        }

        // Add result to history
        const { memory, history_variable } = this.options;
        const history: Message[] = memory.get(history_variable) ?? [];
        history.push({ role: 'function', name, content });
        if (history.length > this.options.max_history_messages) {
            history.splice(0, history.length - this.options.max_history_messages);
        }
        memory.set(history_variable, history);
    }

    /**
     * Completes a prompt.
     * @remarks
     * The `input` parameter is optional but if passed in, will be assigned to memory using the
     * configured `input_variable`. If it's not passed in an attempt will be made to read it
     * from memory so passing it in or assigning to memory works. In either case, the `input`
     * variable is only used when constructing a user message that, will be added to the
     * conversation history and formatted like `{ role: 'user', content: input }`.
     *
     * It's important to note that if you want the users input sent to the model as part of the
     * prompt, you will need to add a `UserMessage` section to your prompt. The wave does not do
     * anything to modify your prompt, except when performing repairs and those changes are
     * temporary.
     *
     * When the model successfully returns a valid (or repaired) response, a 'user' message (if
     * input was detected) and 'assistant' message will be automatically added to the conversation
     * history. You can disable that behavior by setting `max_history_messages` to `0`.
     *
     * The response returned by `completePrompt()` will be strongly typed by the validator you're
     * using. The `DefaultResponseValidator` returns a `string` and the `JSONResponseValidator`
     * will return either an `object` or if a JSON Schema is provided, an instance of `TContent`.
     * When using a custom validator, the validator is return any type of content it likes.
     *
     * A successful response is indicated by `response.status == 'success'` and the content can be
     * accessed via `response.message.content`.  If a response is invalid it will have a
     * `response.status == 'invalid_response'` and the `response.message` will be a string containing
     * the validator feedback message.  There are other status codes for various errors and in all
     * cases except `success` the `response.message` will be of type `string`.
     * @template TContent Optional. Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `any`.
     * @param input Optional. Input text to use for the user message.
     * @returns A strongly typed response object.
     */
    public async completePrompt<TContent = any>(input?: string): Promise<PromptResponse<TContent>> {
        const { prompt, memory, functions, tokenizer, validator, max_repair_attempts, history_variable, input_variable } = this.options;
        let { model } = this.options;

        // Check for OpenAI model being used with a function validator
        if (model instanceof OpenAIModel && validator instanceof FunctionResponseValidator && !model.options.functions) {
            // Create a clone of the model that's configured to use the validators functions
            model = model.clone({ functions: validator.functions })
        }

        // Update/get user input
        if (input_variable) {
            if (typeof input === 'string') {
                memory.set(input_variable, input);
            } else {
                input = memory.has(input_variable) ? memory.get(input_variable) : ''
            }
        } else if (!input) {
            input = '';
        }

        try {
            // Ask client to complete prompt
            this.emit('beforePrompt', memory, functions, tokenizer, prompt);
            const response = await model.completePrompt(memory, functions, tokenizer, prompt);
            this.emit('afterPrompt', memory, functions, tokenizer, prompt, response);
            if (response.status !== 'success') {
                return response;
            }

            // Ensure response is a message
            if (typeof response.message !== 'object') {
                response.message = { role: 'assistant', content: response.message ?? '' };
            }

            // Validate response
            this.emit('beforeValidation', memory, functions, tokenizer, response, max_repair_attempts);
            const validation = await validator.validateResponse(memory, functions, tokenizer, response, max_repair_attempts);
            this.emit('afterValidation', memory, functions, tokenizer, response, max_repair_attempts, validation);
            if (validation.valid) {
                // Update content
                if (validation.hasOwnProperty('value')) {
                    response.message.content = validation.value;
                }

                // Update history and return
                this.addInputToHistory(memory, history_variable, input!);
                this.addResponseToHistory(memory, history_variable, response.message);
                return response;
            }

            // Bail out if we're not repairing
            if (max_repair_attempts <= 0) {
                return response;
            }

            // Fork the conversation history
            const fork = new MemoryFork(memory);

            // Log repair attempts
            if (this.options.logRepairs) {
                console.log(Colorize.title('REPAIRING RESPONSE:'));
                console.log(Colorize.output(response.message.content));
            }

            // Attempt to repair response
            this.emit('beforeRepair', fork, functions, tokenizer, response, max_repair_attempts, validation);
            const repair = await this.repairResponse(fork, functions, tokenizer, response, validation, max_repair_attempts);
            this.emit('afterRepair', fork, functions, tokenizer, response, max_repair_attempts, validation);

            // Log repair success
            if (this.options.logRepairs) {
                if (repair.status === 'success') {
                    console.log(Colorize.success('Response Repaired'));
                } else {
                    console.log(Colorize.error('Response Repair Failed'));
                }
            }

            // Update history with repaired response if successful.
            // - conversation history will be left unchanged if the repair failed.
            // - we never want to save an invalid response to conversation history.
            // - the caller can take further corrective action, including simply re-trying.
            if (repair.status === 'success') {
                this.addInputToHistory(memory, history_variable, input!);
                this.addResponseToHistory(memory, history_variable, repair.message as Message);
            }

            return repair;
        } catch (err: unknown) {
            return {
                status: 'error',
                message: err instanceof Error ? err.message : `${err}`
            };
        }
    }

    /**
     * @private
     */
    private addInputToHistory(memory: PromptMemory, variable: string, input: string): void {
        if (variable && input.length > 0) {
            const history: Message[] = memory.get(variable) ?? [];
            history.push({ role: 'user', content: input });
            if (history.length > this.options.max_history_messages) {
                history.splice(0, history.length - this.options.max_history_messages);
            }
            memory.set(variable, history);
        }
    }

    /**
     * @private
     */
    private addResponseToHistory(memory: PromptMemory, variable: string, message: Message): void {
        if (variable) {
            const history: Message[] = memory.get(variable) ?? [];
            history.push(message);
            if (history.length > this.options.max_history_messages) {
                history.splice(0, history.length - this.options.max_history_messages);
            }
            memory.set(variable, history);
        }
    }

    /**
     * @private
     */
    private async repairResponse(fork: MemoryFork, functions: PromptFunctions, tokenizer: Tokenizer, response: PromptResponse, validation: Validation, remaining_attempts: number): Promise<PromptResponse> {
        const { model, prompt, validator } = this.options;

        // Add response and feedback to repair history
        const feedback = validation.feedback ?? 'The response was invalid. Try another strategy.';
        this.addResponseToHistory(fork, `${this.options.history_variable}-repair`, response.message as Message);
        this.addInputToHistory(fork, `${this.options.history_variable}-repair`, feedback);

        // Append repair history to prompt
        const repairPrompt = new Prompt([
            prompt,
            new ConversationHistory(`${this.options.history_variable}-repair`)
        ]);

        // Log the repair
        if (this.options.logRepairs) {
            console.log(Colorize.value('feedback', feedback));
        }

        // Ask client to complete prompt
        this.emit('beforePrompt', fork, functions, tokenizer, prompt);
        const repairResponse = await model.completePrompt(fork, functions, tokenizer, repairPrompt);
        this.emit('afterPrompt', fork, functions, tokenizer, prompt, repairResponse);
        if (repairResponse.status !== 'success') {
            return repairResponse;
        }

        // Ensure response is a message
        if (typeof repairResponse.message !== 'object') {
            repairResponse.message = { role: 'assistant', content: repairResponse.message ?? '' };
        }

        // Validate response
        this.emit('beforeValidation', fork, functions, tokenizer, repairResponse, remaining_attempts);
        validation = await validator.validateResponse(fork, functions, tokenizer, repairResponse, remaining_attempts);
        this.emit('afterValidation', fork, functions, tokenizer, repairResponse, remaining_attempts, validation);
        if (validation.valid) {
            // Update content
            if (validation.hasOwnProperty('value')) {
                repairResponse.message.content = validation.value;
            }

            return repairResponse;
        }

        // Are we out of attempts?
        remaining_attempts--;
        if (remaining_attempts <= 0) {
            return {
                status: 'invalid_response',
                message: validation.feedback ?? 'The response was invalid. Try another strategy.'
            };
        }

        // Try next attempt
        this.emit('nextRepair', fork, functions, tokenizer, repairResponse, remaining_attempts, validation);
        return await this.repairResponse(fork, functions, tokenizer, repairResponse, validation, remaining_attempts);
    }
}
