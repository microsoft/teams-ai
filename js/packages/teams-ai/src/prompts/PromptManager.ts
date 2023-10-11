/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptFunctions, PromptFunction } from "./PromptFunctions";
import { PromptTemplate } from "./PromptTemplate";
import { TurnState } from '../TurnState';
import { Tokenizer } from "../tokenizers";
import { TurnContext } from "botbuilder";
import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateSection } from "./TemplateSection";
import { CompletionConfig } from "./PromptTemplate";
import { DataSource } from "../dataSources";
import { PromptSection } from "./PromptSection";
//import { DataSourceSection } from "./DataSourceSection";

/**
 * Options used to configure the prompt manager.
 */
export interface PromptManagerOptions {
    /**
     * Path to the filesystem folder containing all the applications prompts.
     */
    promptsFolder: string;

    /**
     * Optional. Message role to use for loaded prompts. Defaults to 'system'.
     */
    role?: string;
}

/**
 * A filesystem based prompt manager.
 * @summary
 * The default prompt manager uses the file system to define prompts that are compatible with
 * Microsoft's Semantic Kernel SDK (see: https://github.com/microsoft/semantic-kernel)
 *
 * Each prompt is a separate folder under a root prompts folder. The folder should contain 2 files:
 *
 * - "config.json": contains the prompts configuration and is a serialized instance of `PromptTemplateConfig`.
 * - "skprompt.txt": contains the text of the prompt and supports Semantic Kernels prompt template syntax.
 * - "functions.json": Optional. Contains a list of functions that can be invoked by the prompt.
 *
 * Prompts can be loaded and used by name and new dynamically defined prompt templates can be
 * registered with the prompt manager.
 * @template TState Optional. Type of the applications turn state.
 */
export class PromptManager<TState extends TurnState = TurnState> implements PromptFunctions<TState> {
    private readonly _options: PromptManagerOptions;
    private readonly _dataSources: Map<string, DataSource<TState>> = new Map();
    private readonly _functions: Map<string, PromptFunction<TState>> = new Map();
    private readonly _prompts: Map<string, PromptTemplate<TState>> = new Map();

    /**
     * Creates a new 'PromptManager' instance.
     * @param options Options used to configure the prompt manager.
     */
    public constructor(options: PromptManagerOptions) {
        this._options = Object.assign({}, options);
    }

    /**
     * Registers a new data source with the prompt manager.
     * @param dataSource Data source to add.
     * @returns The prompt manager for chaining.
     */
    public addDataSource(dataSource: DataSource<TState>): this {
        if (this._dataSources.has(dataSource.name)) {
            throw new Error(`DataSource '${dataSource.name}' already exists.`);
        }

        this._dataSources.set(dataSource.name, dataSource);

        return this;
    }

    /**
     * Looks up a data source by name.
     * @param name Name of the data source to lookup.
     * @returns The data source.
     */
    public getDataSource(name: string): DataSource<TState> {
        const dataSource = this._dataSources.get(name);
        if (!dataSource) {
            throw new Error(`DataSource '${name}' not found.`);
        }

        return dataSource;
    }

    /**
     * Checks for the existence of a named data source.
     * @param name Name of the data source to lookup.
     * @returns True if the data source exists.
     */
    public hasDataSource(name: string): boolean {
        return this._dataSources.has(name);
    }

    /**
     * Registers a new prompt template function with the prompt manager.
     * @param name Name of the function to add.
     * @param fn Function to add.
     * @returns The prompt manager for chaining.
     */
    public addFunction(name: string, fn: PromptFunction<TState>): this {
        if (this._functions.has(name)) {
            throw new Error(`Function '${name}' already exists.`);
        }

        this._functions.set(name, fn);

        return this;
    }

    /**
     * Looks up a prompt template function by name.
     * @param name Name of the function to lookup.
     * @returns The function.
     */
    public getFunction(name: string): PromptFunction<TState> {
        const fn = this._functions.get(name);
        if (!fn) {
            throw new Error(`Function '${name}' not found.`);
        }

        return fn;
    }

    /**
     * Checks for the existence of a named prompt template function.
     * @param name Name of the function to lookup.
     * @returns True if the function exists.
     */
    public hasFunction(name: string): boolean {
        return this._functions.has(name);
    }

    /**
     * Invokes a prompt template function by name.
     * @param name Name of the function to invoke.
     * @param context Turn context for the current turn of conversation with the user.
     * @param state Turn state for the current turn of conversation with the user.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param args Arguments to pass to the function.
     * @returns Value returned by the function.
     */
    public invokeFunction(name: string, context: TurnContext, state: TState, tokenizer: Tokenizer, args: string[]): Promise<any> {
        const fn = this.getFunction(name);
        return fn(context, state as any, this as any, tokenizer, args);
    }

    /**
     * Registers a new prompt template with the prompt manager.
     * @param prompt Prompt template to add.
     * @returns The prompt manager for chaining.
     */
    public addPrompt(prompt: PromptTemplate<TState>): this {
        if (this._prompts.has(prompt.name)) {
            throw new Error(
                `The PromptManager.addPrompt() method was called with a previously registered prompt named "${name}".`
            );
        }

        // Clone and cache prompt
        const clone = Object.assign({}, prompt);
        this._prompts.set(prompt.name, clone);

        return this;
    }

    /**
     * Loads a named prompt template from the filesystem.
     * @summary
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     *
     * Any augmentations will also be added to the template.
     * @param name Name of the prompt to load.
     * @returns The loaded and parsed prompt template.
     */
    public async getPrompt(name: string): Promise<PromptTemplate<TState>> {
        if (!this._prompts.has(name)) {
            const template = { name } as PromptTemplate<TState>;

            // Load template from disk
            const folder = path.join(this._options.promptsFolder, name);
            const configFile = path.join(folder, 'config.json');
            const promptFile = path.join(folder, 'skprompt.txt');
            const actionsFile = path.join(folder, 'actions.json');

            // Load prompt config
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const config = await fs.readFile(configFile, 'utf-8');
                template.config = JSON.parse(config);
            } catch (err: unknown) {
                throw new Error(
                    `PromptManager.getPrompt(): an error occurred while loading '${configFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt text
            const sections: PromptSection[] = [];
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
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
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const actions = await fs.readFile(actionsFile, 'utf-8');
                template.actions = JSON.parse(actions);
            } catch (err: unknown) {
                // Ignore missing actions file
            }

            // Update the templates config file with defaults and migrate as needed
            this.updateConfig(template);

            // Add augmentations

            // Cache loaded template
            this._prompts.set(name, template);
        }

        return this._prompts.get(name)!;
    }

    /**
     * Checks for the existence of a named prompt.
     * @param name Name of the prompt to load.
     * @returns True if the prompt exists.
     */
    public async hasPrompt(name: string): Promise<boolean> {
        if (!this._prompts.has(name)) {
            const folder = path.join(this._options.promptsFolder, name);
            const promptFile = path.join(folder, 'skprompt.txt');

            // Check for prompt existence
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                await fs.access(promptFile);
            } catch (err: unknown) {
                return false;
            }
        }

        return true;
    }

    private updateConfig(template: PromptTemplate<TState>): void {
        // Set config defaults
        template.config.completion = Object.assign({
            frequency_penalty: 0.0,
            include_history: true,
            max_tokens: 150,
            max_input_tokens: 2048,
            presence_penalty: 0.0,
            temperature: 0.0,
            top_p: 0.0
        } as CompletionConfig, template.config.completion);

        // Migrate old schema
        if (template.config.schema === 1) {
            template.config.schema = 1.1;
            if (Array.isArray(template.config.default_backends) && template.config.default_backends.length > 0) {
                template.config.completion.model = template.config.default_backends[0];
            }
        }
    }

    // private appendAugmentations(template: PromptTemplate<TState>, sections: PromptSection[]): void {
    //     // Check for augmentation
    //     const augmentation = template.config.augmentation;
    //     if (augmentation) {
    //         // First append data sources
    //         for (const source in augmentation.data_sources ?? {}) {

    //         }

    //         // Finally append augmentation
    //         switch (augmentation.augmentation_type) {
    //             default:
    //             case 'none':
    //             case 'functions':
    //                 // No augmentation needed
    //                 break;


    //         }
    //     }
    // }
}