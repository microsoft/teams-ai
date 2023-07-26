/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as z from 'zod';
import { MemoryScope } from './scopes';

/**
 * Interface for enumerating memory scopes.
 */
export interface ComponentMemoryScopes {
    getMemoryScopes(): MemoryScope[];
}

const componentMemoryScopes = z.custom<ComponentMemoryScopes>((val: any) => typeof val.getMemoryScopes === 'function', {
    message: 'ComponentMemoryScopes',
});

/**
 * Check if a [ComponentRegistration](xref:botbuilder-core.ComponentRegistration) is
 * [ComponentMemoryScopes](xref:botbuilder-dialogs.ComponentMemoryScopes) or not.
 *
 * @param {any} component The component registration.
 * @returns {boolean} Type check result.
 */
export function isComponentMemoryScopes(component: unknown): component is ComponentMemoryScopes {
    return componentMemoryScopes.check(component);
}
