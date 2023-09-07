import { PromptFunctions, PromptMemory, Tokenizer } from "promptrix";
import { PromptResponse, Validation, PromptResponseValidator } from "./ai/types";

/**
 * Default response validator that always returns true.
 */
export class DefaultResponseValidator implements PromptResponseValidator {
    /**
     * Validates the response.
     * @param memory Memory used to render the prompt.
     * @param functions Functions used to render the prompt.
     * @param tokenizer Tokenizer used to render the prompt.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining validation attempts.
     * @returns A `Validation` with the status and value. The validation is always valid.
     */
    public validateResponse(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<string|null>> {
        return Promise.resolve({
            type: 'Validation',
            valid: true,
            value: typeof response.message == 'object' ? response.message.content : response.message
        });
    }
}