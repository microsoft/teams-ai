import { DefaultTurnState } from "./DefaultTurnStateManager";
import { TurnState } from "./TurnState";
import { Tokenizer } from "./ai/types";
import { stringify } from "yaml";

/**
 * Utility functions for manipulating .
 */
export class Utilities {
    /**
     *
     * @param state Current conversation state object.
     * @param path Path to the value in the form of `scope.name` or `name`. If no scope is specified `temp` is assumed.
     * @returns The current value at the specified path. Missing values will have a value of `undefined`.
     */
    public static getStateValue<TValue = unknown, TState extends TurnState = DefaultTurnState>(state: TState, path: string): TValue {
        // Get variable scope and name
        const parts = path.split('.');
        if (parts.length > 2) {
            throw new Error(`Invalid memory key: ${path}`);
        } else if (parts.length === 1) {
            parts.unshift('temp');
        }

        // Validate scope
        const scope = state[parts[0]];
        if (scope === undefined) {
            throw new Error(`Invalid memory scope: ${parts[0]}`);
        }

        // Return value
        return scope.value[parts[1]];
    }

    /**
     * Converts a value to a string.
     * @remarks
     * Dates are converted to ISO strings and Objects are converted to JSON or YAML, whichever is shorter.
     * @param tokenizer Tokenizer to use for encoding.
     * @param value Value to convert.
     * @param asJSON Optional. If true objects will always be converted to JSON instead of YAML. Defaults to false.
     * @returns Converted value.
     */
    public static toString(tokenizer: Tokenizer, value: any, asJSON: boolean = false): string {
        if (value === undefined || value === null) {
            return '';
        } else if (typeof value === "object") {
            if (typeof value.toISOString == "function") {
                return value.toISOString();
            } else if (asJSON) {
                return JSON.stringify(value);
            } else {
                // Return shorter version of object
                const asYaml = stringify(value);
                const asJSON = JSON.stringify(value);
                if (tokenizer.encode(asYaml).length < tokenizer.encode(asJSON).length) {
                    return asYaml;
                } else {
                    return asJSON;
                }
            }
        } else {
            return value.toString();
        }
    }
}