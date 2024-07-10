/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';

import { Colorize } from '../internals';
import { Memory, MemoryFork } from '../MemoryFork';
import {
    PromptCompletionModel,
    PromptCompletionModelBeforeCompletionEvent,
    PromptCompletionModelChunkReceivedEvent,
    PromptCompletionModelResponseReceivedEvent
} from '../models';
import { ConversationHistory, Message, Prompt, PromptFunctions, PromptTemplate } from '../prompts';
import { StreamingResponse } from '../StreamingResponse';
import { GPTTokenizer, Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';
import { Validation, PromptResponseValidator, DefaultResponseValidator } from '../validators';

/**
 * Options for an LLMClient instance.
 * @template TContent Optional. Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `any`.
 */
export interface LLMClientOptions<TContent = any> {
    /**
     * AI model to use for completing prompts.
     */
    model: PromptCompletionModel;

    /**
     * Prompt to use for the conversation.
     */
    template: PromptTemplate;

    /**
     * Optional. Memory variable used for storing conversation history.
     * @remarks
     * The history will be stored as a `Message[]` and the variable defaults to `conversation.history`.
     */
    history_variable?: string;

    /**
     * Optional. Memory variable used for storing the users input message.
     * @remarks
     * The users input is expected to be a `string` but it's optional and defaults to `temp.input`.
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
     * Optional. Tokenizer to use when rendering the prompt or counting tokens.
     * @remarks
     * If not specified, a new instance of `GPTTokenizer` will be created. GPT3Tokenizer can be passed in for gpt-3 models.
     */
    tokenizer?: Tokenizer;

    /**
     * Optional. Response validator to use when completing prompts.
     * @remarks
     * If not specified a new instance of `DefaultResponseValidator` will be created. The
     * DefaultResponseValidator returns a `Validation` that says all responses are valid.
     */
    validator?: PromptResponseValidator<TContent>;

    /**
     * Optional. If true, any repair attempts will be logged to the console.
     */
    logRepairs?: boolean;

    /**
     * Optional message to send a client at the start of a streaming response.
     */
    startStreamingMessage?: string;
}

/**
 * The configuration of the LLMClient instance.
 */
export interface ConfiguredLLMClientOptions<TContent = any> {
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
     * Maximum number of conversation history messages that will be persisted to memory.
     */
    max_history_messages: number;

    /**
     * Maximum number of automatic repair attempts that will be made.
     */
    max_repair_attempts: number;

    /**
     * Prompt used for the conversation.
     */
    template: PromptTemplate;

    /**
     * Tokenizer used when rendering the prompt or counting tokens.
     */
    tokenizer: Tokenizer;

    /**
     * Response validator used when completing prompts.
     */
    validator: PromptResponseValidator<TContent>;

    /**
     * If true, any repair attempts will be logged to the console.
     */
    logRepairs: boolean;
}

/**
 * LLMClient class that's used to complete prompts.
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
 * @template TContent Optional. Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `any`.
 */
export class LLMClient<TContent = any> {
    private readonly _startStreamingMessage: string | undefined;

    /**
     * Configured options for this LLMClient instance.
     */
    public readonly options: ConfiguredLLMClientOptions<TContent>;

    /**
     * Creates a new `LLMClient` instance.
     * @param {LLMClientOptions<TContent>} options - Options to configure the instance with.
     */
    public constructor(options: LLMClientOptions<TContent>) {
        this.options = Object.assign(
            {
                history_variable: 'conversation.history',
                input_variable: 'temp.input',
                max_history_messages: 10,
                max_repair_attempts: 3,
                logRepairs: false
            },
            options
        ) as ConfiguredLLMClientOptions<TContent>;

        // Create validator to use
        if (!this.options.validator) {
            this.options.validator = new DefaultResponseValidator<TContent>();
        }

        // Create tokenizer to use
        if (!this.options.tokenizer) {
            this.options.tokenizer = new GPTTokenizer();
        }

        this._startStreamingMessage = options.startStreamingMessage;
    }

    /**
     * Adds a result from a `function_call` to the history.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {string} name - Name of the function that was called.
     * @param {any} results - Results returned by the function.
     */
    public addFunctionResultToHistory(memory: Memory, name: string, results: any): void {
        // Convert content to string
        let content = '';
        if (typeof results === 'object') {
            if (typeof results.toISOString == 'function') {
                content = results.toISOString();
            } else {
                content = JSON.stringify(results);
            }
        } else if (results !== undefined && results !== null) {
            content = results.toString();
        }

        // Add result to history
        const { history_variable } = this.options;
        const history: Message[] = memory.getValue(history_variable) ?? [];
        history.push({ role: 'function', name, content });
        if (history.length > this.options.max_history_messages) {
            history.splice(0, history.length - this.options.max_history_messages);
        }
        memory.setValue(history_variable, history);
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
     * @param {TurnContext} context - Current turn context.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {PromptFunctions} functions - Functions to use when rendering the prompt.
     * @returns {Promise<PromptResponse<TContent>>} A `PromptResponse` with the status and message.
     */

    public async completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions
    ): Promise<PromptResponse<TContent>> {
        // Define event handlers
        let isStreaming = false;
        let streamer: StreamingResponse | undefined;
        const beforeCompletion: PromptCompletionModelBeforeCompletionEvent = async (
            ctx,
            memory,
            functions,
            tokenizer,
            template,
            streaming
        ) => {
            // Ignore events for other contexts
            if (context !== ctx) {
                return;
            }

            // Check for a streaming response
            if (streaming) {
                isStreaming = true;

                // Create streamer and send initial message
                streamer = new StreamingResponse(context);
                if (this._startStreamingMessage) {
                    await streamer.sendInformativeUpdate(this._startStreamingMessage);
                }
            }
        };

        const chunkReceived: PromptCompletionModelChunkReceivedEvent = async (ctx, memory, chunk) => {
            // Ignore events for other contexts
            if (context !== ctx || !streamer) {
                return;
            }

            // Send chunk to client
            const text = chunk.delta?.content ?? '';
            if (text.length > 0) {
                await streamer.sendTextChunk(text);
            }
        };

        const responseReceived: PromptCompletionModelResponseReceivedEvent = async (ctx, memory, response) => {
            // Ignore events for other contexts
            if (context !== ctx || !streamer) {
                return;
            }

            // End the stream
            await streamer.endStream();
        };

        // Subscribe to model events
        if (this.options.model.events) {
            this.options.model.events.on('beforeCompletion', beforeCompletion);
            this.options.model.events.on('chunkReceived', chunkReceived);
            this.options.model.events.on('responseReceived', responseReceived);
        }

        try {
            // Complete the prompt
            const response = await this.callCompletePrompt(context, memory, functions);
            if (response.status == 'success' && isStreaming) {
                // Delete message from response to avoid sending it twice
                delete response.message;
            }

            return response;
        } finally {
            // Unsubscribe from model events
            if (this.options.model.events) {
                this.options.model.events.off('beforeCompletion', beforeCompletion);
                this.options.model.events.off('chunkReceived', chunkReceived);
                this.options.model.events.off('responseReceived', responseReceived);
            }
        }
    }

    /**
     * @param {TurnContext} context - Current turn context.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {PromptFunctions} functions - Functions to use when rendering the prompt.
     * @returns {Promise<PromptResponse<TContent>>} A `PromptResponse` with the status and message.
     * @private
     */
    public async callCompletePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions
    ): Promise<PromptResponse<TContent>> {
        const { model, template, tokenizer, validator, max_repair_attempts, history_variable, input_variable } =
            this.options;

        try {
            // Ask client to complete prompt
            const response = (await model.completePrompt(
                context,
                memory,
                functions,
                tokenizer,
                template
            )) as PromptResponse<TContent>;
            if (response.status !== 'success') {
                // The response isn't valid so we don't care that the messages type is potentially incorrect.
                return response;
            }

            // Get input message
            let inputMsg = response.input;
            if (!inputMsg && input_variable) {
                const content = memory.getValue(input_variable) ?? '';
                inputMsg = { role: 'user', content };
            }

            // Validate response
            const validation = await validator.validateResponse(
                context,
                memory,
                tokenizer,
                response as PromptResponse<string>,
                max_repair_attempts
            );
            if (validation.valid) {
                // Update content
                if (Object.prototype.hasOwnProperty.call(validation, 'value')) {
                    response.message!.content = validation.value;
                }

                // Update history and return
                this.addInputToHistory(memory, history_variable, inputMsg!);
                this.addResponseToHistory(memory, history_variable, response.message!);
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
                console.log(Colorize.output(response.message!.content ?? ''));
            }

            // Attempt to repair response
            const repair = await this.repairResponse(
                context,
                fork,
                functions,
                response,
                validation,
                max_repair_attempts
            );

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
                this.addInputToHistory(memory, history_variable, inputMsg!);
                this.addResponseToHistory(memory, history_variable, repair.message!);
            }

            return repair;
        } catch (err: unknown) {
            return {
                status: 'error',
                input: undefined,
                error: err as Error
            };
        }
    }

    /**
     * @param {Memory} memory - Current memory.
     * @param {string} variable - Variable to fetch from memory.
     * @param {Message<any>} input - The current input.
     * @private
     */
    private addInputToHistory(memory: Memory, variable: string, input: Message<any>): void {
        if (variable) {
            const history: Message[] = memory.getValue(variable) ?? [];
            history.push(input);
            if (history.length > this.options.max_history_messages) {
                history.splice(0, history.length - this.options.max_history_messages);
            }
            memory.setValue(variable, history);
        }
    }

    /**
     * @param {Memory} memory - Current memory.
     * @param {string} variable - Variable to fetch value from memory.
     * @param {Message<TContent>} message - The Message to be added to history.
     * @private
     */
    private addResponseToHistory(memory: Memory, variable: string, message: Message<TContent>): void {
        if (variable) {
            const history: Message<TContent>[] = memory.getValue(variable) ?? [];
            history.push(message);
            if (history.length > this.options.max_history_messages) {
                history.splice(0, history.length - this.options.max_history_messages);
            }
            memory.setValue(variable, history);
        }
    }

    /**
     * @param {TurnContext} context - The current TurnContext
     * @param {MemoryFork} fork - The current fork of memory to be repaired.
     * @param {PromptFunctions} functions - Functions to use.
     * @param {PromptResponse<TContent>} response - The response that needs repairing.
     * @param {Validation} validation - The Validation object to be used during repair.
     * @param {number} remaining_attempts - The number of remaining attempts.
     * @returns {Promise<PromptResponse<TContent>>} - The repaired response.
     * @private
     */
    private async repairResponse(
        context: TurnContext,
        fork: MemoryFork,
        functions: PromptFunctions,
        response: PromptResponse<TContent>,
        validation: Validation,
        remaining_attempts: number
    ): Promise<PromptResponse<TContent>> {
        const { model, template, tokenizer, validator, history_variable } = this.options;

        // Add response and feedback to repair history
        const feedback = validation.feedback ?? 'The response was invalid. Try another strategy.';
        this.addResponseToHistory(fork, `${history_variable}-repair`, response.message!);
        this.addInputToHistory(fork, `${history_variable}-repair`, { role: 'user', content: feedback });

        // Append repair history to prompt
        const repairTemplate = Object.assign({}, template, {
            prompt: new Prompt([template.prompt, new ConversationHistory(`${history_variable}-repair`)])
        });

        // Log the repair
        if (this.options.logRepairs) {
            console.log(Colorize.value('feedback', feedback));
        }

        // Ask client to complete prompt
        const repairResponse = (await model.completePrompt(
            context,
            fork,
            functions,
            tokenizer,
            repairTemplate
        )) as PromptResponse<TContent>;
        if (repairResponse.status !== 'success') {
            return repairResponse as PromptResponse<TContent>;
        }

        // Validate response
        validation = await validator.validateResponse(
            context,
            fork,
            tokenizer,
            repairResponse as PromptResponse<string>,
            remaining_attempts
        );
        if (validation.valid) {
            // Update content
            if (Object.prototype.hasOwnProperty.call(validation, 'value')) {
                repairResponse.message!.content = validation.value;
            }

            return repairResponse;
        }

        // Are we out of attempts?
        remaining_attempts--;
        if (remaining_attempts <= 0) {
            return {
                status: 'invalid_response',
                input: undefined,
                error: new Error(
                    `Reached max model response repair attempts. Last feedback given to model: "${feedback}"`
                )
            };
        }

        // Try next attempt
        return await this.repairResponse(context, fork, functions, repairResponse, validation, remaining_attempts);
    }
}
