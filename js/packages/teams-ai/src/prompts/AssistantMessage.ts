/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TemplateSection } from './TemplateSection';

/**
 * A message sent by the assistant.
 */
export class AssistantMessage extends TemplateSection {
    /**
     * Creates a new 'AssistantMessage' instance.
     * @param {string} template - Template to use for this section.
     * @param {number} tokens - Optional. Sizing strategy for this section. Defaults to -1, `auto`.
     * @param {string} assistantPrefix -  Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(template: string, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(template, 'assistant', tokens, true, '\n', assistantPrefix);
    }
}
