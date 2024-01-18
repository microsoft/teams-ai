import { Memory } from '../../MemoryFork';

/**
 * @private
 */
const TEMP_SCOPE = 'temp';

/**
 * A test version of the Memory class used by unit tests.
 */
export class TestMemoryFork implements Memory {
    private readonly _fork: Record<string, Record<string, unknown>> = {};

    /**
     * Deletes the value from the original memory.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     */
    public deleteValue(path: string): void {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope) && this._fork[scope].hasOwnProperty(name)) {
            delete this._fork[scope][name];
        }
    }

    /**
     * Checks if the value exists in the original memory.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     */
    public hasValue(path: string): boolean {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope)) {
            return this._fork[scope].hasOwnProperty(name);
        }

        return false;
    }

    /**
     * Retrieves the value from the original memory. Otherwise, returns null if value does not exist.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     */
    public getValue<TValue = unknown>(path: string): TValue {
        const { scope, name } = this.getScopeAndName(path);
        if (this._fork.hasOwnProperty(scope)) {
            if (this._fork[scope].hasOwnProperty(name)) {
                return this._fork[scope][name] as TValue;
            }
        }

        return null as TValue;
    }

    /**
     * Sets the value in the original memory.
     * @param path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
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
