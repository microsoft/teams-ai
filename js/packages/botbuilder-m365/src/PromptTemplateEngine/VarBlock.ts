/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { stringify } from "yaml";
import { TurnState } from "../TurnState";
import { Block, BlockTypes } from "./Block";

/**
 * @private
 */
export class VarBlock extends Block {
    private static readonly Prefix: string = '$';

    public readonly name: string = this.varName();

    constructor(content: string) {
        super();
        this.content = content;
    }

    public get type(): BlockTypes {
        return BlockTypes.Variable;
    }

    public isValid(): { valid: boolean; error?: string; } {
        let valid = true;
        let error: string | undefined;
        // or
        let error: string = '';
        // then in the return object, only return non-empty string

        if (this.content[0] !== VarBlock.Prefix) {
            error = `A variable must start with the symbol ${VarBlock.Prefix}`;
            valid = false;
        } else  if (this.content.length < 2) {
            error = 'The variable name is empty';
            valid = false;
        } else {
            const varName = this.varName();
            if (!VarBlock.isValidVarName(varName)) {
                error = `The variable name '${varName}' contains invalid characters. Only alphanumeric chars, underscore, and dot are allowed.`;
                valid = false;
            } else if (varName.split('.').length > 2) {
                error = `The variable name '${varName}' isn't currently supported. Variables must be of the form '$<property>' or '$<scope>.<property>' and sub properties aren't currently supported.`;
                valid = false;
            }
    
        }

        return { valid, error };
    }

    public render(context: TurnContext, state: TurnState): string {
        const name = this.varName();
        if (!name) {
            throw new Error('Variable rendering failed, the variable name is empty.');
        }

        // Split variable name into parts and validate
        // TODO: Add support for longer dotted path variable names
        const parts = name.trim().split('.');
        if (parts.length == 1) {
            // Assume the var is coming from the 'temp' scope
            parts.unshift('temp');
        } else if (parts.length > 2) {
            throw new Error(`PromptParser: invalid variable name of '${name}' specified.`);
        }

        // Check for special cased variables first
        let value: any;
        switch (parts[0]) {
            case 'activity':
                // Return activity field
                value = this.caseInsensitiveFindValue(context.activity, parts[1]) ?? '';
                break;
            default:
                // Find referenced state entry
                const entry = this.caseInsensitiveFindValue(state, parts[0]);
                if (!entry) {
                    throw new Error(
                        `PromptParser: invalid variable name of '${name}' specified. Couldn't find a state named '${parts[0]}'.`
                    );
                }

                // Return state field
                value = this.caseInsensitiveFindValue(entry.value, parts[1]) ?? '';
                break;
        }

        // Return value
        return VarBlock.formatValue(value);
    }

    public static formatValue(value: any): string {
        return typeof value == 'object' || Array.isArray(value) ? stringify(value) : (value != undefined ? value.toString() : '');
    }

    public static hasVarPrefix(text: string): boolean {
        return !!text && text.length > 0 && text[0] === VarBlock.Prefix;
    }

    public static isValidVarName(text: string): boolean {
        return /^[a-zA-Z0-9_.]*$/.test(text);
    }

    private varName(): string {
        return this.content.length < 2 ? '' : this.content.slice(1);
    }

    private caseInsensitiveFindValue(obj: Record<string, any>, property: string): any {
        if (obj.hasOwnProperty(property)) {
            return obj[property];
        } else {
            const propKey = property.toLowerCase();
            for (const key in obj) {
                if (key.toLowerCase() == propKey) {
                    return obj[key];
                }
            }

            return undefined;
        }
    }
}