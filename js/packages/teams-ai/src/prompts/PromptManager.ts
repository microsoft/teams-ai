/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import * as fs from 'fs/promises';
import * as path from 'path';

import { MonologueAugmentation, SequenceAugmentation } from '../augmentations';
import { DataSource } from '../dataSources';
import { Memory } from '../MemoryFork';
import { Tokenizer } from '../tokenizers';
import { CompletionConfig } from '../types';

import { ConversationHistory } from './ConversationHistory';
import { PromptTemplate } from './PromptTemplate';
import { DataSourceSection } from './DataSourceSection';
import { GroupSection } from './GroupSection';
import { Prompt } from './Prompt';
import { PromptFunctions, PromptFunction } from './PromptFunctions';
import { PromptSection } from './PromptSection';
import { TemplateSection } from './TemplateSection';
import { UserInputMessage } from './UserInputMessage';
import { UserMessage } from './UserMessage';

/**
 * Options used to configure the prompt manager.
 */
export interface PromptManagerOptions {
    /**
     * Path to the filesystem folder containing all the application's prompts.
     */
    promptsFolder: string;

    /**
     * Optional. Message role to use for loaded prompts.
     * @remarks
     * Defaults to 'system'.
     */
    role?: string;

    /**
     * Optional. Maximum number of tokens of conversation history to include in prompts.
     * @remarks
     * The default is to let conversation history consume the remainder of the prompts
     * `max_input_tokens` budget. Setting this to a value greater than 1 will override that and
     * all prompts will use a fixed token budget.
     */
    max_conversation_history_tokens?: number;

    /**
     * Optional. Maximum number of messages to use when rendering conversation_history.
     * @remarks
     * This controls the automatic pruning of the conversation history that's done by the planners
     * LLMClient instance. This helps keep your memory from getting too big and defaults to a value
     * of `10` (or 5 turns.)
     */
    max_history_messages?: number;

    /**
     * Optional. Maximum number of tokens user input to include in prompts.
     * @remarks
     * This defaults to unlimited but can be set to a value greater than `1` to limit the length of
     * user input included in prompts. For example, if set to `100` then the any user input over
     * 100 tokens in length will be truncated.
     */
    max_input_tokens?: number;
}

/**
 * The configured PromptManager options.
 */
export interface ConfiguredPromptManagerOptions {
    /**
     * Path to the filesystem folder containing all the applications prompts.
     */
    promptsFolder: string;

    /**
     * Message role to use for loaded prompts.
     */
    role: string;

    /**
     * Maximum number of tokens of conversation history to include in prompts.
     */
    max_conversation_history_tokens: number;

    /**
     * Maximum number of messages to use when rendering conversation_history.
     */
    max_history_messages: number;

    /**
     * Maximum number of tokens of user input to include in prompts.
     */
    max_input_tokens: number;
}

/**
 * A filesystem based prompt manager.
 * @remarks
 * The default prompt manager uses the file system to define prompts that are compatible with
 * Microsoft's Semantic Kernel SDK (see: https://github.com/microsoft/semantic-kernel)
 *
 * Each prompt is a separate folder under a root prompts folder. The folder should contain the following files:
 *
 * - "config.json": Required. Contains the prompts configuration and is a serialized instance of `PromptTemplateConfig`.
 * - "skprompt.txt": Required. Contains the text of the prompt and supports Semantic Kernels prompt template syntax.
 * - "actions.json": Optional. Contains a list of actions that can be called by the prompt.
 *
 * Prompts can be loaded and used by name and new dynamically defined prompt templates can be
 * registered with the prompt manager.
 * @template TState Optional. Type of the applications turn state.
 */
export class PromptManager implements PromptFunctions {
    private readonly _options: ConfiguredPromptManagerOptions;
    private readonly _dataSources: Map<string, DataSource> = new Map();
    private readonly _functions: Map<string, PromptFunction> = new Map();
    private readonly _prompts: Map<string, PromptTemplate> = new Map();

    /**
     * Creates a new 'PromptManager' instance.
     * @param {PromptManagerOptions} options - Options used to configure the prompt manager.
     * @returns {PromptManager} A new prompt manager instance.
     */
    public constructor(options: PromptManagerOptions) {
        this._options = Object.assign(
            {
                role: 'system',
                max_conversation_history_tokens: 1.0,
                max_history_messages: 10,
                max_input_tokens: -1
            },
            options as ConfiguredPromptManagerOptions
        );
    }

    /**
     * Gets the configured prompt manager options.
     * @returns {ConfiguredPromptManagerOptions} The configured prompt manager options.
     */
    public get options(): ConfiguredPromptManagerOptions {
        return this._options;
    }

    /**
     * Registers a new data source with the prompt manager.
     * @param {DataSource} dataSource - Data source to add.
     * @returns {this} The prompt manager for chaining.
     */
    public addDataSource(dataSource: DataSource): this {
        if (this._dataSources.has(dataSource.name)) {
            throw new Error(`DataSource '${dataSource.name}' already exists.`);
        }

        this._dataSources.set(dataSource.name, dataSource);

        return this;
    }

    /**
     * Looks up a data source by name.
     * @param {string} name - Name of the data source to lookup.
     * @returns {DataSource} The data source.
     */
    public getDataSource(name: string): DataSource {
        const dataSource = this._dataSources.get(name);
        if (!dataSource) {
            throw new Error(`DataSource '${name}' not found.`);
        }

        return dataSource;
    }

    /**
     * Checks for the existence of a named data source.
     * @param {string} name - Name of the data source to lookup.
     * @returns {boolean} True if the data source exists.
     */
    public hasDataSource(name: string): boolean {
        return this._dataSources.has(name);
    }

    /**
     * Registers a new prompt template function with the prompt manager.
     * @param {string} name - Name of the function to add.
     * @param {PromptFunction} fn - Function to add.
     * @returns {this} - The prompt manager for chaining.
     */
    public addFunction(name: string, fn: PromptFunction): this {
        if (this._functions.has(name)) {
            throw new Error(`Function '${name}' already exists.`);
        }

        this._functions.set(name, fn);

        return this;
    }

    /**
     * Looks up a prompt template function by name.
     * @param {string} name - Name of the function to lookup.
     * @returns {PromptFunction} The function.
     */
    public getFunction(name: string): PromptFunction {
        const fn = this._functions.get(name);
        if (!fn) {
            throw new Error(`Function '${name}' not found.`);
        }

        return fn;
    }

    /**
     * Checks for the existence of a named prompt template function.
     * @param {string} name Name of the function to lookup.
     * @returns {boolean} True if the function exists.
     */
    public hasFunction(name: string): boolean {
        return this._functions.has(name);
    }

    /**
     * Invokes a prompt template function by name.
     * @param {string} name - Name of the function to invoke.
     * @param {TurnContext} context - Turn context for the current turn of conversation with the user.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {Tokenizer} tokenizer - Tokenizer to use when rendering the prompt.
     * @param {string[]} args - Arguments to pass to the function.
     * @returns {Promise<any>} Value returned by the function.
     */
    public invokeFunction(
        name: string,
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        args: string[]
    ): Promise<any> {
        const fn = this.getFunction(name);
        return fn(context, memory as any, this as any, tokenizer, args);
    }

    /**
     * Registers a new prompt template with the prompt manager.
     * @param {PromptTemplate} prompt - Prompt template to add.
     * @returns {this} The prompt manager for chaining.
     */
    public addPrompt(prompt: PromptTemplate): this {
        if (this._prompts.has(prompt.name)) {
            throw new Error(
                `The PromptManager.addPrompt() method was called with a previously registered prompt named "${prompt.name}".`
            );
        }

        // Clone and cache prompt
        const clone = Object.assign({}, prompt);
        this._prompts.set(prompt.name, clone);

        return this;
    }

    /**
     * Loads a named prompt template from the filesystem.
     * @remarks
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     *
     * Any augmentations will also be added to the template.
     * @param {string} name - Name of the prompt to load.
     * @returns {Promise<PromptTemplate>} The loaded and parsed prompt template.
     */
    public async getPrompt(name: string): Promise<PromptTemplate> {
        if (!this._prompts.has(name)) {
            const template = { name } as PromptTemplate;

            // Load template from disk
            const folder = path.join(this._options.promptsFolder, name);
            const configFile = path.join(folder, 'config.json');
            const promptFile = path.join(folder, 'skprompt.txt');
            const actionsFile = path.join(folder, 'actions.json');

            // Load prompt config
            try {
                const config = await fs.readFile(configFile, 'utf-8');
                template.config = JSON.parse(config);
            } catch (err: unknown) {
                throw new Error(
                    `PromptManager.getPrompt(): an error occurred while loading '${configFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt text
            let sections: PromptSection[] = [];
            try {
                const role = this._options.role || 'system';
                const prompt = await fs.readFile(promptFile, 'utf-8');
                sections.push(new TemplateSection(prompt, role));
            } catch (err: unknown) {
                throw new Error(
                    `PromptManager.getPrompt(): an error occurred while loading '${promptFile}'. The file is either invalid or missing.`
                );
            }

            // Load optional actions
            try {
                const actions = await fs.readFile(actionsFile, 'utf-8');
                template.actions = JSON.parse(actions);
            } catch (err: unknown) {
                // Ignore missing actions file
            }

            // Update the templates config file with defaults and migrate as needed
            this.updateConfig(template);

            // Add augmentations
            this.appendAugmentations(template, sections);

            // Group everything into a system message
            sections = [new GroupSection(sections, 'system')];

            // Include conversation history
            // - The ConversationHistory section will use the remaining tokens from
            //   max_input_tokens.
            if (template.config.completion.include_history) {
                sections.push(
                    new ConversationHistory(
                        `conversation.${template.name}_history`,
                        this.options.max_conversation_history_tokens
                    )
                );
            }

            // Include user input
            if (template.config.completion.include_images) {
                sections.push(new UserInputMessage(this.options.max_input_tokens));
            } else if (template.config.completion.include_input) {
                sections.push(new UserMessage('{{$temp.input}}', this.options.max_input_tokens));
            }

            // Create prompt
            template.prompt = new Prompt(sections);

            // Cache loaded template
            this._prompts.set(name, template);
        }

        return this._prompts.get(name)!;
    }

    /**
     * Checks for the existence of a named prompt.
     * @param {string} name - Name of the prompt to load.
     * @returns {boolean} True if the prompt exists.
     */
    public async hasPrompt(name: string): Promise<boolean> {
        if (!this._prompts.has(name)) {
            const folder = path.join(this._options.promptsFolder, name);
            const promptFile = path.join(folder, 'skprompt.txt');

            // Check for prompt existence
            try {
                await fs.access(promptFile);
            } catch (err: unknown) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {PromptTemplate} template - The prompt template to update.
     * @private
     */
    private updateConfig(template: PromptTemplate): void {
        // Set config defaults
        template.config.completion = Object.assign(
            {
                frequency_penalty: 0.0,
                include_history: true,
                include_input: true,
                include_images: false,
                max_tokens: 150,
                max_input_tokens: 2048,
                presence_penalty: 0.0,
                temperature: 0.0,
                top_p: 0.0,
                include_tools: false,
                tool_choice: 'auto',
                parallel_tool_calls: true
            } as CompletionConfig,
            template.config.completion
        );

        // Migrate old schema
        if (template.config.schema === 1) {
            template.config.schema = 1.1;
            if (Array.isArray(template.config.default_backends) && template.config.default_backends.length > 0) {
                template.config.completion.model = template.config.default_backends[0];
            }
        }
    }

    /**
     * @param {PromptTemplate} template - The prompt template to append augmentations to.
     * @param {PromptSection[]} sections - The prompt sections to append augmentations to.
     * @private
     */
    private appendAugmentations(template: PromptTemplate, sections: PromptSection[]): void {
        // Check for augmentation
        const augmentation = template.config.augmentation;
        if (augmentation) {
            // First append data sources
            // - We're using a minimum of 2 tokens for each data source to prevent
            //   any sort of prompt rendering conflicts between sources and conversation history.
            // - If we wanted to let users specify a percentage% for a data source we would need
            //   to track the percentage they gave the data source(s) and give the remaining to
            //   the ConversationHistory section.
            const data_sources = augmentation.data_sources ?? {};
            for (const name in data_sources) {
                if (!this.hasDataSource(name)) {
                    throw new Error(`DataSource '${name}' not found for prompt '${template.name}'.`);
                }
                const dataSource = this.getDataSource(name);
                const tokens = Math.max(data_sources[name], 2);
                sections.push(new DataSourceSection(dataSource, tokens));
            }

            // Next create augmentation
            switch (augmentation.augmentation_type) {
                default:
                case 'none':
                    // No augmentation needed
                    break;
                case 'monologue':
                    template.augmentation = new MonologueAugmentation(template.actions ?? []);
                    break;
                case 'sequence':
                    template.augmentation = new SequenceAugmentation(template.actions ?? []);
                    break;
            }

            // Append the augmentations prompt section
            if (template.augmentation) {
                const section = template.augmentation.createPromptSection();
                if (section) {
                    sections.push(section);
                }
            }
        }
    }
}
