/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { DefaultTempState, DefaultTurnState } from "../DefaultTurnStateManager";
import { PromptManager } from "../Prompts";
import { TurnState } from "../TurnState";
import { Block, BlockTypes } from "./Block";
import { VarBlock } from "./VarBlock";


/**
 * @private
 */
export class CodeBlock extends Block {
    private _validated: boolean = false;

    constructor(content: string) {
        super();
        this.content = content;
    }

    public get type(): BlockTypes {
        return BlockTypes.Code;
    }

    public isValid(): { valid: boolean; error?: string; } {
        let valid = true;
        let error: string;

        const partsToValidate = this.content.split(/[ \t\r\n]+/).filter(x => x.trim() !== "");

        for (let index = 0; index < partsToValidate.length; index++) {
            const part = partsToValidate[index];

            if (index === 0) { // There is only a function name
                if (VarBlock.hasVarPrefix(part)) {
                    error = `Variables cannot be used as function names [\`${part}\`]`;
                    valid = false;
                }

                if (!/^[a-zA-Z0-9_.]*$/.test(part)) {
                    error = `The function name \`${part}\` contains invalid characters`;
                    valid = false;
                }
            } else { // The function has parameters
                if (!VarBlock.hasVarPrefix(part)) {
                    error = `\`${part}\` is not a valid function parameter: parameters must be variables.`;
                    valid = false;
                }

                if (part.length < 2) {
                    error = `\`${part}\` is not a valid variable.`;
                    valid = false;
                }

                if (!VarBlock.isValidVarName(part.substring(1))) {
                    error = `\`${part}\` variable name is not valid.`;
                    valid = false;
                }
            }
        }

        this._validated = true;

        return { valid, error };
    }

    public render(context: TurnContext, state: TurnState): string {
        throw new Error("Code blocks rendering requires IFunctionRegistryReader. Incorrect method call.");
    }

    public async renderCode(context: TurnContext, state: TurnState, promptManager: PromptManager<TurnState>): Promise<string> {
        if (!this._validated) {
            const { valid, error } = this.isValid();
            if (!valid) {
                throw new Error(error);
            }
        }

        const parts = this.content.split(/[ \t\r\n]+/).filter(x => x.trim() !== "");
        const functionName = parts[0];
        const result = await promptManager.invokeFunction(context, state, functionName);
        const output = VarBlock.formatValue(result);

        // Save output to $temp.output and then return
        const temp = (state as DefaultTurnState)?.temp?.value ?? {} as DefaultTempState;
        temp.output = output;
        return output;
    }
}