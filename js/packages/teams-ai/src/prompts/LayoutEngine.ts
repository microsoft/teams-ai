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
     * @param sections List of sections to layout.
     * @param tokens Sizing strategy for this section.
     * @param required Indicates if this section is required.
     * @param separator Separator to use between sections when rendering as text.
     */
    public constructor(sections: PromptSection[], tokens: number, required: boolean, separator: string) {
        this.sections = sections;
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
    }

    /**
     * @param context
     * @param memory
     * @param functions
     * @param tokenizer
     * @param maxTokens
     * @private
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
     * @param context
     * @param memory
     * @param functions
     * @param tokenizer
     * @param maxTokens
     * @private
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
     * @param sections
     * @param layout
     * @private
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
     * @param layout
     * @param maxTokens
     * @param cbFixed
     * @param cbProportional
     * @param textLayout
     * @param tokenizer
     * @private
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
     * @param layout
     * @param callback
     * @private
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
     * @param layout
     * @param callback
     * @private
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
     * @param layout
     * @param textLayout
     * @param tokenizer
     * @private
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
     * @param layout
     * @private
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
     * @param layout
     * @private
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
