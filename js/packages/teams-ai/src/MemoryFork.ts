/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @private
 */
const TEMP_SCOPE = 'temp';

/**
 * Represents a memory.
 * @remarks
 * A memory is a key-value store that can be used to store and retrieve values.
 */
export interface Memory {
    /**
     * Deletes a value from the memory.
     * @param path Path to the value to delete in the form of `[scope].property`. If scope is omitted, the value is deleted from the temporary scope.
     * @returns True if the value was deleted, false otherwise.
     * @throws Error if the path is invalid.
     */
    deleteValue(path: string): void;

    /**
     * Checks if a value exists in the memory.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns True if the value exists, false otherwise.
     */
    hasValue(path: string): boolean;

    /**
     * Retrieves a value from the memory.
     * @param path Path to the value to retrieve in the form of `[scope].property`. If scope is omitted, the value is retrieved from the temporary scope.
     * @returns The value or undefined if not found.
     */
    getValue<TValue = unknown>(path: string): TValue;

    /**
     * Assigns a value to the memory.
     * @param path Path to the value to assign in the form of `[scope].property`. If scope is omitted, the value is assigned to the temporary scope.
     * @param value Value to assign.
     */
    setValue(path: string, value: unknown): void;
}

/**
 * Forks an existing memory.
 * @remarks
 * A memory fork is a memory that is a copy of another memory, but can be modified without
 * affecting the original memory.
 */
export class MemoryFork implements Memory {
    private readonly _fork: Record<string, Record<string, unknown>> = {};
    private readonly _memory: Memory;

    /**
     * Creates a new `MemoryFork` instance.
     * @param memory Memory to fork.
     */
    public constructor(memory: Memory) {
        this._memory = memory;
    }

    /**
     * Deletes a value from the memory.
     * @remarks
     * Only forked values will be deleted.
     * @param path Path to the value to delete in the form of `[scope].property`. If scope is omitted, the value is deleted from the temporary scope.
     */
    public deleteValue(path: string): void {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope) && this._fork[scope].hasOwnProperty(name)) {
            delete this._fork[scope][name];
        }
    }

    /**
     * Checks if a value exists in the memory.
     * @remarks
     * The forked memory is checked first, then the original memory.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns True if the value exists, false otherwise.
     */
    public hasValue(path: string): boolean {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope)) {
            return this._fork[scope].hasOwnProperty(name);
        } else {
            return this._memory.hasValue(path);
        }
    }

    /**
     * Retrieves a value from the memory.
     * @remarks
     * The forked memory is checked first, then the original memory.
     * @param path Path to the value to retrieve in the form of `[scope].property`. If scope is omitted, the value is retrieved from the temporary scope.
     * @returns The value or undefined if not found.
     */
    public getValue<TValue = unknown>(path: string): TValue {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope)) {
            if (this._fork[scope].hasOwnProperty(name)) {
                return this._fork[scope][name] as TValue;
            }
        }

        return this._memory.getValue(path);
    }

    /**
     * Assigns a value to the memory.
     * @remarks
     * The value is assigned to the forked memory.
     * @param path Path to the value to assign in the form of `[scope].property`. If scope is omitted, the value is assigned to the temporary scope.
     * @param value Value to assign.
     */
    public setValue(path: string, value: unknown): void {
        const { scope, name } = this.getScopeAndName(path);
        if (!this._fork.hasOwnProperty(scope)) {
            this._fork[scope] = {};
        }

        this._fork[scope][name] = value;
    }

    /**
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @private
     */
    private getScopeAndName(path: string): { scope: string; name: string } {
        // Get variable scope and name
        const parts = path.split('.');
        if (parts.length > 2) {
            throw new Error(`Invalid state path: ${path}`);
        } else if (parts.length === 1) {
            parts.unshift(TEMP_SCOPE);
        }

        return { scope: parts[0], name: parts[1] };
    }
}
