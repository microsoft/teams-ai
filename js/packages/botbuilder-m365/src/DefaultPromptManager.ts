/**
 * @module botbuilder-m365
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

export interface DefaultPromptManagerOptions {
    promptsFolder: string;
}

export class DefaultPromptManager<TState extends TurnState = DefaultTurnState> implements PromptManager<TState> {
    private readonly _functions: Map<string, TemplateFunctionEntry<TState>> = new Map();
    private readonly _templates: Map<string, CachedPromptTemplate> = new Map();
    private readonly _options: DefaultPromptManagerOptions;
    private readonly _templateEngine: PromptTemplateEngine<TState>;

    public constructor(options: DefaultPromptManagerOptions | string) {
        this._options = typeof options == 'object' ? Object.assign({}, options) : { promptsFolder: options };
        this._templateEngine = new PromptTemplateEngine(this);
    }

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

    public invokeFunction(context: TurnContext, state: TState, name: string): Promise<any> {
        if (this._functions.has(name)) {
            return this._functions.get(name).handler(context, state);
        } else {
            throw new Error(
                `The DefaultPromptManager.invokeFunction() method was called for an unregistered function named "${name}".`
            );
        }
    }

    public async loadPromptTemplate(name: string): Promise<PromptTemplate> {
        if (!this._templates.has(name)) {
            const entry = {} as CachedPromptTemplate;

            // Load template from disk
            const folder = path.join(this._options.promptsFolder, name);
            const configFile = path.join(folder, 'config.json');
            const promptFile = path.join(folder, 'skprompt.txt');

            // Load prompt config
            try {
                const config = await fs.readFile(configFile, 'utf-8');
                entry.config = JSON.parse(config);
            } catch (err: unknown) {
                throw new Error(
                    `DefaultPromptManager.loadPromptTemplate(): an error occurred while loading '${configFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt text
            try {
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

        return this._templates.get(name);
    }

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

interface TemplateFunctionEntry<TState> {
    handler: (context: TurnContext, state: TState) => Promise<any>;
    allowOverrides: boolean;
}

interface CachedPromptTemplate extends PromptTemplate {
    blocks: Block[];
}
