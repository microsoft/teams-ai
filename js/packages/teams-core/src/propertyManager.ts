/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StatePropertyAccessor } from './botStatePropertyAccessor';

/**
 * Interface implemented by classes capable of factoring property accessors.
 */
export interface PropertyManager {
    /**
     * Creates a new property accessor for reading and writing an individual property to the bots
     * state management system.
     *
     * @param T (Optional) type of property to create. Defaults to `any` type.
     * @param name Name of the property being created.
     */
    createProperty<T = any>(name: string): StatePropertyAccessor<T>;
}
