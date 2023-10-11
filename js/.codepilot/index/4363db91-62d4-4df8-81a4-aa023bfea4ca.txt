import { PromptResponseValidator, Validation, ChatCompletionFunction, PromptResponse } from "./ai/types";
import { PromptMemory, PromptFunctions, Tokenizer, Message } from "promptrix";
import { Schema } from "jsonschema";
import { JSONResponseValidator } from "./JSONResponseValidator";

/**
 * Validates function calls returned by the model.
 *
 * @remarks
 *
 */
export class FunctionResponseValidator implements PromptResponseValidator {
    private readonly _functions: Map<string, ChatCompletionFunction> = new Map();

    /**
     * Creates a new `FunctionResponseValidator` instance.
     * @param functions Optional. List of functions supported for the prompt.
     */
    public constructor(functions?: ChatCompletionFunction[]) {
        if (functions) {
            for (const func of functions) {
                this._functions.set(func.name, func);
            }
        }
    }

    /**
     * Gets a list of the functions configured for the validator.
     */
    public get functions(): ChatCompletionFunction[] {
        const list: ChatCompletionFunction[] = [];
        this._functions.forEach(fn => list.push(fn));
        return list;
    }

    /**
     * Adds a new function to teh validator.
     * @param name Name of the function.
     * @param description Optional. Description of how the model should use the function.
     * @param parameters Optional. JSON Schema for functions parameters.
     * @returns The validator for chaining purposes.
     */
    public addFunction(name: string, parameters: Schema, description?: string): this {
        if (this._functions.has(name)) {
            throw new Error(`FunctionResponseValidator already has an function named "${name}".`);
        }

        this._functions.set(name, { name, description, parameters });
        return this;
    }

    /**
     * Validates the response.
     * @param memory Memory used to render the prompt.
     * @param functions Functions used to render the prompt.
     * @param tokenizer Tokenizer used to render the prompt.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining validation attempts.
     * @returns A `Validation` with the status and value.
     */
    public async validateResponse(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, response: PromptResponse, remaining_attempts: number): Promise<Validation> {
        if (typeof response.message == 'object' && response.message.function_call) {
            // Ensure name is specified
            const function_call = response.message.function_call;
            if (!function_call.name) {
                return {
                    type: 'Validation',
                    valid: false,
                    feedback: `Function name missing. Specify a valid function name.`
                };
            }

            // Ensure name valid
            if (!this._functions.has(function_call.name)) {
                return {
                    type: 'Validation',
                    valid: false,
                    feedback: `Unknown function named "${function_call.name}". Specify a valid function name.`
                };
            }

            // Validate arguments
            const functionDef = this._functions.get(function_call.name);
            if (functionDef) {
                const validator = new JSONResponseValidator(
                    functionDef.parameters,
                    `No arguments were sent with function call. Call the "${function_call.name}" with required arguments as a valid JSON object.`,
                    `The function arguments had errors. Apply these fixes and call "${function_call.name}" function again:`
                );
                const args = function_call.arguments === '{}' ? null : function_call.arguments ?? '{}'
                const message: Message = { role: 'assistant', content: args };
                const result = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message }, remaining_attempts);
                if (!result.valid) {
                    return result;
                }
            }
        }

        return {
            type: 'Validation',
            valid: true
        };
    }
}
