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
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     */
    public deleteValue(path: string): void {
        const { scope, name } = this.getScopeAndName(path);
        if (
            Object.prototype.hasOwnProperty.call(this._fork, scope) &&
            Object.prototype.hasOwnProperty.call(this._fork[scope], name)
        ) {
            delete this._fork[scope][name];
        }
    }

    /**
     * Checks if the value exists in the original memory.
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns {boolean} True if the value exists. Otherwise, false.
     */
    public hasValue(path: string): boolean {
        const { scope, name } = this.getScopeAndName(path);
        if (Object.prototype.hasOwnProperty.call(this._fork, scope)) {
            return Object.prototype.hasOwnProperty.call(this._fork[scope], name);
        }

        return false;
    }

    /**
     * @template TValue
     * Retrieves the value from the original memory. Otherwise, returns null if value does not exist.
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns {TValue} Value.
     */
    public getValue<TValue = unknown>(path: string): TValue {
        const { scope, name } = this.getScopeAndName(path);
        if (Object.prototype.hasOwnProperty.call(this._fork, scope)) {
            if (Object.prototype.hasOwnProperty.call(this._fork[scope], name)) {
                return this._fork[scope][name] as TValue;
            }
        }

        return null as TValue;
    }

    /**
     * Sets the value in the original memory.
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @param {unknown} value Value to assign.
     * @returns {void}
     */
    public setValue(path: string, value: unknown): void {
        const { scope, name } = this.getScopeAndName(path);
        if (!Object.prototype.hasOwnProperty.call(this._fork, scope)) {
            this._fork[scope] = {};
        }

        this._fork[scope][name] = value;
    }

    /**
     * @private
     * @param {string} path Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.
     * @returns {{ scope: string; name: string }} Scope and name.
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
