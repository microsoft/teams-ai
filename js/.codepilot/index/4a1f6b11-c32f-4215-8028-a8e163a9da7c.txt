import { PromptFunctions, PromptFunction, PromptTemplate } from "./types";
import { TurnState } from '../TurnState';
import { Tokenizer } from "../ai";
import { TurnContext } from "botbuilder";
import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateSection } from "./TemplateSection";

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
    private readonly _functions: Map<string, PromptFunction<TState>> = new Map();
    private readonly _prompts: Map<string, PromptTemplate<TState>> = new Map();

    /**
     * Creates a new 'PromptManager' instance.
     * @param options Options used to configure the prompt manager.
     */
    public constructor(options: PromptManagerOptions) {
        this._options = Object.assign({}, options);
    }

    public addFunction(name: string, value: PromptFunction<TState>): void {
        if (this._functions.has(name)) {
            throw new Error(`Function '${name}' already exists.`);
        }

        this._functions.set(name, value);
    }

    public getFunction(name: string): PromptFunction<TState> {
        const fn = this._functions.get(name);
        if (!fn) {
            throw new Error(`Function '${name}' not found.`);
        }

        return fn;
    }

    public hasFunction(name: string): boolean {
        return this._functions.has(name);
    }

    public invokeFunction(name: string, context: TurnContext, state: TState, tokenizer: Tokenizer, args: string[]): Promise<any> {
        const fn = this.getFunction(name);
        return fn(context, state as any, this as any, tokenizer, args);
    }

    /**
     * Registers a new prompt template with the prompt manager.
     * @summary
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     * @param name Unique name of the prompt template.
     * @param prompt Prompt template to add.
     * @returns The prompt manager for chaining.
     */
    public addPrompt(name: string, prompt: PromptTemplate<TState>): this {
        if (this._prompts.has(name)) {
            throw new Error(
                `The PromptManager.addPromptTemplate() method was called with a previously registered prompt named "${name}".`
            );
        }

        // Clone and cache prompt
        const clone = Object.assign({}, prompt);
        this._prompts.set(name, clone);

        return this;
    }

    /**
     * Loads a named prompt template from the filesystem.
     * @summary
     * The template will be pre-parsed and cached for use when the template is rendered by name.
     * @param name Name of the prompt to load.
     * @returns The loaded and parsed prompt template.
     */
    public async getPrompt(name: string): Promise<PromptTemplate<TState>> {
        if (!this._prompts.has(name)) {
            const entry = {} as PromptTemplate<TState>;

            // Load template from disk
            const folder = path.join(this._options.promptsFolder, name);
            const configFile = path.join(folder, 'config.json');
            const promptFile = path.join(folder, 'skprompt.txt');
            const functionsFile = path.join(folder, 'functions.json');

            // Load prompt config
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const config = await fs.readFile(configFile, 'utf-8');
                entry.config = JSON.parse(config);
            } catch (err: unknown) {
                throw new Error(
                    `PromptManager.loadPromptTemplate(): an error occurred while loading '${configFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt text
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const role = this._options.role || 'system';
                const template = await fs.readFile(promptFile, 'utf-8');
                entry.prompt = new TemplateSection(template, role);
            } catch (err: unknown) {
                throw new Error(
                    `DefaultPromptManager.loadPromptTemplate(): an error occurred while loading '${promptFile}'. The file is either invalid or missing.`
                );
            }

            // Load prompt functions
            try {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                const functions = await fs.readFile(functionsFile, 'utf-8');
                entry.functions = JSON.parse(functions);
            } catch (err: unknown) {
                // Ignore missing functions file
            }

            // Cache loaded template
            this._prompts.set(name, entry);
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
}