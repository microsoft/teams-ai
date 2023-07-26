/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ComponentRegistration } from '@microsoft/teams-core';
import { ServiceCollection, noOpConfiguration } from 'botbuilder-dialogs-adaptive-runtime-core';
import { DialogsBotComponent } from './dialogsBotComponent';
import { ComponentMemoryScopes, ComponentPathResolvers, MemoryScope, PathResolver } from './memory';

/**
 * Makes dialogs component available to the system registering functionality.
 */
export class DialogsComponentRegistration
    extends ComponentRegistration
    implements ComponentMemoryScopes, ComponentPathResolvers {
    private readonly services = new ServiceCollection({
        memoryScopes: [],
        pathResolvers: [],
    });

    /**
     * Creates an instance of the [DialogsComponentRegistration](xref:botbuilder-dialogs.DialogsComponentRegistration) class.
     */
    constructor() {
        super();

        new DialogsBotComponent().configureServices(this.services, noOpConfiguration);
    }

    /**
     * Gets the dialogs memory scopes.
     *
     * @returns {MemoryScope[]} A list of [MemoryScope](xref:botbuilder-dialogs.MemoryScope).
     */
    getMemoryScopes(): MemoryScope[] {
        return this.services.mustMakeInstance<MemoryScope[]>('memoryScopes');
    }

    /**
     * Gets the dialogs path resolvers.
     *
     * @returns {PathResolver[]} A list of [PathResolver](xref:botbuilder-dialogs.PathResolver).
     */
    getPathResolvers(): PathResolver[] {
        return this.services.mustMakeInstance<PathResolver[]>('pathResolvers');
    }
}
