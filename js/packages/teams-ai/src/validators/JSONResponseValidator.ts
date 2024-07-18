import { TurnContext } from 'botbuilder';
import { Validator, Schema, ValidationError } from 'jsonschema';

import { Memory } from '../MemoryFork';
import { Validation, PromptResponseValidator } from './PromptResponseValidator';
import { Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';

import { Response } from './Response';

/**
 * Parses any JSON returned by the model and optionally verifies it against a JSON schema.
 * @template TValue Optional. Type of the validation value returned. Defaults to `Record<string, any>`.
 */
export class JSONResponseValidator<TValue = Record<string, any>> implements PromptResponseValidator<TValue> {
    /**
     * Creates a new `JSONResponseValidator` instance.
     * @param {Schema} schema Optional. JSON schema to validate the response against.
     * @param {string} missingJsonFeedback Optional. Custom feedback to give when no JSON is returned.
     * @param {string} errorFeedback Optional. Custom feedback prefix to use when schema errors are detected.
     */
    public constructor(schema?: Schema, missingJsonFeedback?: string, errorFeedback?: string) {
        this.schema = schema;
        this.missingJsonFeedback =
            missingJsonFeedback ?? 'No valid JSON objects were found in the response. Return a valid JSON object.';
        this.errorFeedback = errorFeedback ?? 'The JSON returned had errors. Apply these fixes:';
    }

    /**
     * Feedback prefix given when schema errors are detected.
     */
    public errorFeedback: string;

    /**
     * Feedback given when no JSON is returned.
     */
    public missingJsonFeedback: string;

    /**
     * JSON schema to validate the response against.
     */
    public readonly schema?: Schema;

    /**
     * Validates a response to a prompt.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Memory} memory An interface for accessing state values.
     * @param {Tokenizer} tokenizer Tokenizer to use for encoding and decoding text.
     * @param {PromptResponse<string>} response Response to validate.
     * @param {number} remaining_attempts Number of remaining attempts to validate the response.
     * @returns {Promise<Validation<TValue>>} A `Validation` object.
     */
    public validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<TValue>> {
        const message = response.message!;
        const text = message.content ?? '';

        // Parse the response text
        const parsed = Response.parseAllObjects(text);
        if (parsed.length == 0) {
            return Promise.resolve({
                type: 'Validation',
                valid: false,
                feedback: this.missingJsonFeedback
            });
        }

        // Validate the response against the schema
        if (this.schema) {
            let errors: ValidationError[] | undefined;
            const validator = new Validator();
            for (let i = parsed.length - 1; i >= 0; i--) {
                const obj = Response.removeEmptyValuesFromObject(parsed[i]);
                const result = validator.validate(obj, this.schema);
                if (result.valid) {
                    return Promise.resolve({
                        type: 'Validation',
                        valid: true,
                        value: obj as TValue
                    });
                } else if (!errors) {
                    errors = result.errors;
                }
            }

            return Promise.resolve({
                type: 'Validation',
                valid: false,
                feedback: `${this.errorFeedback}\n${errors!.map((e) => this.getErrorFix(e)).join('\n')}`
            });
        } else {
            // Return the last object
            return Promise.resolve({
                type: 'Validation',
                valid: true,
                value: parsed[parsed.length - 1] as TValue
            });
        }
    }

    /**
     * @private
     * @param {ValidationError} error Error in the JSON object
     * @returns {string} How to fix the given error.
     */
    private getErrorFix(error: ValidationError): string {
        // Get argument as a string
        let arg: string;
        if (Array.isArray(error.argument)) {
            arg = error.argument.join(',');
        } else if (typeof error.argument === 'object') {
            arg = JSON.stringify(error.argument);
        } else {
            arg = error.argument.toString();
        }

        switch (error.name) {
            case 'type':
                // field is of the wrong type
                return `convert "${error.property}" to a ${arg}`;
            case 'anyOf':
                // field is not one of the allowed types
                return `convert "${error.property}" to one of the allowed types in the provided schema.`;
            case 'additionalProperties':
                // field has an extra property
                return `remove the "${arg}" property from ${
                    error.property == 'instance' ? 'the JSON object' : `"${error.property}"`
                }`;
            case 'required':
                // field is missing a required property
                return `add the "${arg}" property to ${
                    error.property == 'instance' ? 'the JSON object' : `"${error.property}"`
                }`;
            // TODO: jsonschema does not validate formats by default. https://github.com/microsoft/teams-ai/issues/1080
            case 'format':
                // field is not in the correct format
                return `change the "${error.property}" property to be a ${arg}`;
            case 'uniqueItems':
                // field has duplicate items
                return `remove all duplicate items from "${error.property}"`;
            case 'enum':
                // field is not one of the allowed values
                arg = error.message.split(':')[1].trim();
                return `change the "${error.property}" property to be one of these values: ${arg}`;
            case 'const':
                // field is not the correct value
                return `change the "${error.property}" property to be ${arg}`;
            default:
                return `"${error.property}" ${error.message}. Fix that`;
        }
    }
}
