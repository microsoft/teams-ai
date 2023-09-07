import { TurnState } from '../TurnState';
import { PromptManager, PromptManagerOptions } from './PromptManager';
import { PromptTemplate } from './types';

export interface TestPromptManagerOptions extends PromptManagerOptions {
    /**
     * Optional. Map of prompts to load.
     */
    prompts?: Record<string, PromptTemplate>;
}

/**
 * A prompt manager used for testing.
 */
export class TestPromptManager<TState extends TurnState = TurnState> extends PromptManager {
    public constructor(options: Partial<TestPromptManagerOptions> = {}) {
        super(Object.assign({
            promptsFolder: 'test',
        } as PromptManagerOptions, options));

        // Add any pre-defined prompts
        if (options.prompts) {
            for (const key in options.prompts) {
                this.addPrompt(key, options.prompts[key]);
            }
        }
    }

    public override getPrompt(name: string): Promise<PromptTemplate<TState>> {
        if (!this.hasPrompt(name)) {
            throw new Error(`Prompt '${name}' not found.`);
        }
        return super.getPrompt(name);
    }
}

