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
import { DefaultTurnState } from './DefaultTurnStateManager';
import { PromptManager, PromptTemplate } from './Prompts';
import { Block, PromptTemplateEngine } from './PromptTemplateEngine';
import { TurnState } from './TurnState';

/**
 * Options used to configure the default prompt manager.
 */
export interface DefaultPromptManagerOptions {
    /**
     * Path to the filesystem folder containing all the applications prompts.
     */
    promptsFolder: string;
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
 *
 * Prompts can be loaded and used by name and new dynamically defined prompt templates can be
 * registered with the prompt manager.
 * @template TState Optional. Type of the applications turn state.
 */
export class DefaultPromptManager<TState extends TurnState = DefaultTurnState> implements PromptManager<TState> {
    private readonly _functions: Map<string, TemplateFunctionEntry<TState>> = new Map();
    private readonly _templates: Map<string, CachedPromptTemplate> = new Map();
    private readonly _options: DefaultPromptManagerOptions;
    private readonly _templateEngine: PromptTemplateEngine<TState>;

    public constructor(options: DefaultPromptManagerOptions | string) {
        this._options = typeof options == 'object' ? Object.assign({}, options) : { promptsFolder: options };
        this._templateEngine = new PromptTemplateEngine(this);
    }

    /**
     * Adds a custom function to the prompt manager.
     * @summary
     * Functions can be used with a prompt template using a syntax of `{{name}}`. Function
     * arguments are not currently supported.
     * @param {string} name - The name of the function.
     * @param {(context: TurnContext, state: TState) => Promise<any>} handler - Promise to return on function name match.
     * @param {boolean} allowOverrides - Whether to allow overriding an existing function.
     * @returns {this} The prompt manager for chaining.
     */
    public addFunction(
        name: string,
        handler: (context: TurnContext, state: TState) => Promise<any>,
        allowOverrides = false
    ): this {
        if (!this._functions.has(name) || allowOverrides) {
            this._functions.set(name, { handler, allowOverrides });
        } else {
            const entry = this._functions.get(name);
            if (entry!.allowOverrides) {
                entry!.handler = handler;
            } else {
                throw new Error(
                    `The DefaultPromptManager.templateFunction() method was called with a previously registered function named "${name}".`
                );
            }
        }

        return this;
    }

    /**
     * Adds a prompt template to the prompt manager.
     * @summary
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     * @param {string} name - Name of the prompt template.
     * @param {PromptTemplate} template - Prompt template to add.
     * @returns {this} The prompt manager for chaining.
     */
    public addPromptTemplate(name: string, template: PromptTemplate): this {
        if (this._templates.has(name)) {
            throw new Error(
                `The DefaultPromptManager.addPromptTemplate() method was called with a previously registered template named "${name}".`
            );
        }

        const entry = Object.assign({}, template) as CachedPromptTemplate;

        // Parse prompt into blocks
        try {
            entry.blocks = this._templateEngine.extractBlocks(entry.text, true);
        } catch (err: unknown) {
            throw new Error(
                `DefaultPromptManager.addPromptTemplate(): an error occurred while parsing the template for '${name}': ${(
                    err as Error
                ).toString()}`
            );
        }

        // Cache template
        this._templates.set(name, entry);

        return this;
    }

    /**
     * Invokes a function by name.
     * @param {TurnContext} context - Current application turn context.
     * @param {TState} state - Current turn state.
     * @param {string} name - Name of the function to invoke.
     * @returns {Promise<any>} The result returned by the function for insertion into a prompt.
     */
    public invokeFunction(context: TurnContext, state: TState, name: string): Promise<any> {
        if (this._functions && this._functions.has(name)) {
            return Promise.resolve(this._functions.get(name)?.handler(context, state));
        } else {
            throw new Error(
                `The DefaultPromptManager.invokeFunction() method was called for an unregistered function named "${name}".`
            );
        }
    }

    /**
     * Loads a named prompt template from the filesystem.
     * @summary
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     * @param {string} name - Name of the template to load.
     * @returns {Promise<PromptTemplate>} The loaded and parsed prompt template.
     */
    public async loadPromptTemplate(name: string): Promise<PromptTemplate> {
        if (!this._templates.has(name)) {
            const entry = {} as CachedPromptTemplate;

            // Load template from disk
            const folder = path.join(this._options.promptsFolder, name);
            const configFile = path.join(folder, 'config.json');
            const promptFile = path.join(folder, 'skprompt.txt');

            // Load prompt config
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const config = await fs.readFile(configFile, 'utf-8');
                entry.config = JSON.parse(config);
            } catch (err: unknown) {
                throw new Error(
                    `DefaultPromptManager.loadPromptTemplate(): an error occurred while loading '${configFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt text
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                entry.text = await fs.readFile(promptFile, 'utf-8');
            } catch (err: unknown) {
                throw new Error(
                    `DefaultPromptManager.loadPromptTemplate(): an error occurred while loading '${promptFile}'. The file is either invalid or missing.`
                );
            }

            // Parse prompt into blocks
            try {
                entry.blocks = this._templateEngine.extractBlocks(entry.text, true);
            } catch (err: unknown) {
                throw new Error(
                    `DefaultPromptManager.loadPromptTemplate(): an error occurred while parsing '${promptFile}': ${(
                        err as Error
                    ).toString()}`
                );
            }

            // Cache loaded template
            this._templates.set(name, entry);
        }

        return this._templates.get(name) || ({} as CachedPromptTemplate);
    }

    /**
     * Renders a prompt template by name.
     * @summary
     * The prompt will be automatically loaded from disk if needed and cached for future use.
     * @param {TurnContext} context - Current application turn context.
     * @param {TState} state - Current turn state.
     * @param {string | PromptTemplate} nameOrTemplate - Name of the prompt template to render or a prompt template to render.
     * @returns {Promise<PromptTemplate>} The rendered prompt template.
     */
    public async renderPrompt(
        context: TurnContext,
        state: TState,
        nameOrTemplate: string | PromptTemplate
    ): Promise<PromptTemplate> {
        // Load the template if needed
        let template: CachedPromptTemplate;
        if (typeof nameOrTemplate == 'string') {
            template = (await this.loadPromptTemplate(nameOrTemplate)) as CachedPromptTemplate;
        } else if (typeof nameOrTemplate == 'object' && nameOrTemplate.text && nameOrTemplate.config) {
            template = Object.assign({}, nameOrTemplate) as CachedPromptTemplate;
        } else {
            throw new Error(
                `The DefaultPromptManager.renderPrompt() method was passed an invalid or missing template.`
            );
        }

        // Render the prompt
        const text = await this._templateEngine.render(context, state, template.blocks ?? template.text);

        return { text: text, config: template.config };
    }
}

/**
 * @private
 */
interface TemplateFunctionEntry<TState> {
    handler: (context: TurnContext, state: TState) => Promise<any>;
    allowOverrides: boolean;
}

/**
 * @private
 */
interface CachedPromptTemplate extends PromptTemplate {
    blocks: Block[];
}
