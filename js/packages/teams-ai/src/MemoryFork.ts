import { PromptMemory, VolatileMemory } from "promptrix";

/**
 * Forks an existing memory.
 * @remarks
 * A memory fork is a memory that is a copy of another memory, but can be modified without
 * affecting the original memory.
 */
export class MemoryFork implements PromptMemory {
    private readonly _fork: VolatileMemory = new VolatileMemory();
    private readonly _memory: PromptMemory;

    /**
     * Creates a new `MemoryFork` instance.
     * @param memory Memory to fork.
     */
    public constructor(memory: PromptMemory) {
        this._memory = memory;
    }

    /**
     * Returns whether the memory contains the specified key.
     * @param key Name of the key to check.
     * @returns True if the memory contains the specified key, false otherwise.
     */
    public has(key: string): boolean {
        return this._fork.has(key) || this._memory.has(key);
    }

    /**
     * Gets the value of the specified key.
     * @param key Key to get the value of.
     * @returns Value of the key or undefined if missing.
     */
    public get<TValue = any|undefined>(key: string): TValue {
        if (this._fork.has(key)) {
            return this._fork.get(key);
        } else {
            return this._memory.get(key);
        }
    }

    /**
     * Sets the value of the specified key.
     * @param key Key to set the value of.
     * @param value Value to set.
     */
    public set<TValue = any>(key: string, value: TValue): void {
        this._fork.set(key, value);
    }

    /**
     * Deletes the specified key.
     * @param key Key to delete.
     */
    public delete(key: string): void {
        if (this._fork.has(key)) {
            this._fork.delete(key);
        }
    }

    /**
     * Clears the memory.
     */
    public clear(): void {
        this._fork.clear();
    }
}