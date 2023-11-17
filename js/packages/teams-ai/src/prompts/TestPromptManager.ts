/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptManager, PromptManagerOptions } from './PromptManager';
import { PromptTemplate } from './PromptTemplate';

/**
 * Options used to configure a `TestPromptManager` instance.
 */
export interface TestPromptManagerOptions extends PromptManagerOptions {
    /**
     * Optional. List of prompts to pre-load.
     */
    prompts?: PromptTemplate[];
}

/**
 * A prompt manager used for testing.
 */
export class TestPromptManager extends PromptManager {
    /**
     * Creates a new `TestPromptManager` instance.
     * @param options Optional. Options used to configure the prompt manager.
     */
    public constructor(options: Partial<TestPromptManagerOptions> = {}) {
        super(Object.assign({
            promptsFolder: 'test',
        } as PromptManagerOptions, options));

        // Add any pre-defined prompts
        if (Array.isArray(options.prompts)) {
            options.prompts.forEach((prompt) => this.addPrompt(prompt));
        }
    }

    /**
     * @private
     */
    public override getPrompt(name: string): Promise<PromptTemplate> {
        if (!this.hasPrompt(name)) {
            throw new Error(`Prompt '${name}' not found.`);
        }
        return super.getPrompt(name);
    }
}

