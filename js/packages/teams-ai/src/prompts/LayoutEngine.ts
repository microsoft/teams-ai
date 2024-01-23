/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection, PromptSection } from './PromptSection';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * Base layout engine that renders a set of `auto`, `fixed`, or `proportional` length sections.
 * @remarks
 * This class is used internally by the `Prompt` and `GroupSection` classes to render their sections.
 */
export class LayoutEngine implements PromptSection {
    public readonly sections: PromptSection[];
    public readonly required: boolean;
    public readonly tokens: number;
    public readonly separator: string;

    /**
     *
     * @param {PromptSection[]} sections List of sections to layout.
     * @param {number} tokens Sizing strategy for this section.
     * @param {boolean} required Indicates if this section is required.
     * @param {string} separator Separator to use between sections when rendering as text.
     */
    public constructor(sections: PromptSection[], tokens: number, required: boolean, separator: string) {
        this.sections = sections;
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
    }

    /**
     * @private
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Memory} memory The current memory.
     * @param {PromptFunctions} functions The functions available to use in the prompt.
     * @param {Tokenizer} tokenizer Tokenizer to use when rendering as text.
     * @param {number} maxTokens Maximum number of tokens allowed.
     * @returns {Promise<RenderedPromptSection<string>>} Rendered section.
     */
    public async renderAsText(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<string>> {
        // Start a new layout
        // - Adds all sections from the current LayoutEngine hierarchy to a flat array
        const layout: PromptSectionLayout<string>[] = [];
        this.addSectionsToLayout(this.sections, layout);

        // Layout sections
        const remaining = await this.layoutSections(
            layout,
            maxTokens,
            (section) => section.renderAsText(context, memory, functions, tokenizer, maxTokens),
            (section, remaining) => section.renderAsText(context, memory, functions, tokenizer, remaining),
            true,
            tokenizer
        );

        // Build output
        const output: string[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.layout) {
                output.push(section.layout.output);
            }
        }

        const text = output.join(this.separator);
        return { output: text, length: tokenizer.encode(text).length, tooLong: remaining < 0 };
    }

    /**
     * @private
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Memory} memory The current memory.
     * @param {PromptFunctions} functions The functions available to use in the prompt.
     * @param {Tokenizer} tokenizer Tokenizer to use when rendering as text.
     * @param {number} maxTokens Maximum number of tokens allowed.
     * @returns {Promise<RenderedPromptSection<Message[]>>} Rendered section.
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message[]>> {
        // Start a new layout
        // - Adds all sections from the current LayoutEngine hierarchy to a flat array
        const layout: PromptSectionLayout<Message[]>[] = [];
        this.addSectionsToLayout(this.sections, layout);

        // Layout sections
        const remaining = await this.layoutSections(
            layout,
            maxTokens,
            (section) => section.renderAsMessages(context, memory, functions, tokenizer, maxTokens),
            (section, remaining) => section.renderAsMessages(context, memory, functions, tokenizer, remaining)
        );

        // Build output
        const output: Message[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.layout) {
                output.push(...section.layout.output);
            }
        }

        return { output: output, length: this.getLayoutLength(layout), tooLong: remaining < 0 };
    }

    /**
     * @private
     * @template T
     * @param {PromptSection[]} sections Sections to add to the layout.
     * @param {PromptSectionLayout<T>[]} layout Layout to add the sections to.
     */
    private addSectionsToLayout<T>(sections: PromptSection[], layout: PromptSectionLayout<T>[]): void {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (section instanceof LayoutEngine) {
                this.addSectionsToLayout(section.sections, layout);
            } else {
                layout.push({ section: section });
            }
        }
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to render.
     * @param {number} maxTokens Maximum number of tokens allowed.
     * @param {Function} cbFixed Callback to render a fixed section.
     * @param {Function} cbProportional Callback to render a proportional section.
     * @param {boolean} textLayout Indicates if the layout is being rendered as text.
     * @param {Tokenizer} tokenizer Tokenizer to use when rendering as text.
     * @returns {Promise<number>} Number of tokens remaining.
     */
    private async layoutSections<T>(
        layout: PromptSectionLayout<T>[],
        maxTokens: number,
        cbFixed: (section: PromptSection) => Promise<RenderedPromptSection<T>>,
        cbProportional: (section: PromptSection, remaining: number) => Promise<RenderedPromptSection<T>>,
        textLayout: boolean = false,
        tokenizer?: Tokenizer
    ): Promise<number> {
        // Layout fixed sections
        await this.layoutFixedSections(layout, cbFixed);

        // Get tokens remaining and drop optional sections if too long
        let remaining = maxTokens - this.getLayoutLength(layout, textLayout, tokenizer);
        while (remaining < 0 && this.dropLastOptionalSection(layout)) {
            remaining = maxTokens - this.getLayoutLength(layout, textLayout, tokenizer);
        }

        // Layout proportional sections
        if (this.needsMoreLayout(layout) && remaining > 0) {
            // Layout proportional sections
            await this.layoutProportionalSections(layout, (section) => cbProportional(section, remaining));

            // Get tokens remaining and drop optional sections if too long
            remaining = maxTokens - this.getLayoutLength(layout, textLayout, tokenizer);
            while (remaining < 0 && this.dropLastOptionalSection(layout)) {
                remaining = maxTokens - this.getLayoutLength(layout, textLayout, tokenizer);
            }
        }

        return remaining;
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to render.
     * @param {Function} callback Callback to render a fixed section of the layout.
     */
    private async layoutFixedSections<T>(
        layout: PromptSectionLayout<T>[],
        callback: (section: PromptSection) => Promise<RenderedPromptSection<T>>
    ): Promise<void> {
        const promises: Promise<RenderedPromptSection<T>>[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.section.tokens < 0 || section.section.tokens > 1.0) {
                promises.push(callback(section.section).then((output) => (section.layout = output)));
            }
        }

        await Promise.all(promises);
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to render.
     * @param {Function} callback Callback to render a proportional section of the layout.
     */
    private async layoutProportionalSections<T>(
        layout: PromptSectionLayout<T>[],
        callback: (section: PromptSection) => Promise<RenderedPromptSection<T>>
    ): Promise<void> {
        const promises: Promise<RenderedPromptSection<T>>[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.section.tokens >= 0.0 && section.section.tokens <= 1.0) {
                promises.push(callback(section.section).then((output) => (section.layout = output)));
            }
        }

        await Promise.all(promises);
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to get the length of.
     * @param {boolean} textLayout Indicates if the layout is being rendered as text.
     * @param {Tokenizer} tokenizer Tokenizer to use when rendering as text.
     * @returns {number} Length of the layout.
     */
    private getLayoutLength<T>(
        layout: PromptSectionLayout<T>[],
        textLayout: boolean = false,
        tokenizer?: Tokenizer
    ): number {
        if (textLayout && tokenizer) {
            const output: string[] = [];
            for (let i = 0; i < layout.length; i++) {
                const section = layout[i];
                if (section.layout) {
                    output.push(section.layout.output as string);
                }
            }
            return tokenizer.encode(output.join(this.separator)).length;
        } else {
            let length = 0;
            for (let i = 0; i < layout.length; i++) {
                const section = layout[i];
                if (section.layout) {
                    length += section.layout.length;
                }
            }

            return length;
        }
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to drop the last optional section from.
     * @returns {boolean} True if an optional section was dropped, false otherwise.
     */
    private dropLastOptionalSection<T>(layout: PromptSectionLayout<T>[]): boolean {
        for (let i = layout.length - 1; i >= 0; i--) {
            const section = layout[i];
            if (!section.section.required) {
                layout.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * @private
     * @template T
     * @param {PromptSectionLayout<T>[]} layout Layout to check.
     * @returns {boolean} True if the layout needs more rendering, false otherwise.
     */
    private needsMoreLayout<T>(layout: PromptSectionLayout<T>[]): boolean {
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (!section.layout) {
                return true;
            }
        }

        return false;
    }
}

/**
 * @private
 */
interface PromptSectionLayout<T> {
    section: PromptSection;
    layout?: RenderedPromptSection<T>;
}
