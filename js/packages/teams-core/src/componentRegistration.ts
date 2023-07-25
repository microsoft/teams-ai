/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * ComponentRegistration is a signature class for discovering assets from components.
 */
export class ComponentRegistration {
    private static readonly _components: Map<string, ComponentRegistration> = new Map<string, ComponentRegistration>();

    /**
     * Gets list of all ComponentRegistration objects registered.
     *
     * @returns A list of ComponentRegistration objects.
     */
    static get components(): ComponentRegistration[] {
        return Array.from(ComponentRegistration._components.values());
    }

    /**
     * Add a component, only one instance per type is allowed for components.
     *
     * @param componentRegistration The component to be registered.
     */
    static add(componentRegistration: ComponentRegistration): void {
        const name = componentRegistration.constructor.name;
        ComponentRegistration._components.set(name, componentRegistration);
    }
}
