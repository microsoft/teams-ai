/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TemplateSection } from "./TemplateSection";

/**
 * A user message.
 */
export class UserMessage extends TemplateSection {
    /**
     * Creates a new 'UserMessage' instance.
     * @param template Template to use for this section.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param userPrefix Optional. Prefix to use for user messages when rendering as text. Defaults to `user: `.
     */
    public constructor(template: string, tokens: number = -1, userPrefix: string = 'user: ') {
        super(template, 'user', tokens, true, '\n', userPrefix);
    }
}