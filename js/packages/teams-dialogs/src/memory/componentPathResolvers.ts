/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as z from 'zod';
import { PathResolver } from './pathResolvers';

/**
 * Interface for declaring path resolvers.
 */
export interface ComponentPathResolvers {
    getPathResolvers(): PathResolver[];
}

const componentPathResolvers = z.custom<ComponentPathResolvers>(
    (val: any) => typeof val.getPathResolvers === 'function',
    { message: 'ComponentPathResolvers' }
);

/**
 * Check if a [ComponentRegistration](xref:botbuilder-core.ComponentRegistration) is
 * [ComponentPathResolvers](xref:botbuilder-dialogs.ComponentPathResolvers) or not.
 *
 * @param {any} component The component registration.
 * @returns {boolean} Type check result.
 */
export function isComponentPathResolvers(component: unknown): component is ComponentPathResolvers {
    return componentPathResolvers.check(component);
}
