/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TemplateSection } from './TemplateSection';

/**
 * A system message.
 */
export class SystemMessage extends TemplateSection {
    /**
     * Creates a new 'SystemMessage' instance.
     * @param template Template to use for this section.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     */
    public constructor(template: string, tokens: number = -1) {
        super(template, 'system', tokens, true, '\n', '');
    }
}
