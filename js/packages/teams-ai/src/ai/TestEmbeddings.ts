import { EmbeddingsModel, EmbeddingsResponse, EmbeddingsResponseStatus  } from "./types";

/**
 * A test model that can be used to test the prompt completion system.
 */
export class TestEmbeddings implements EmbeddingsModel {
    public static TEST_OUTPUT = [[1,2,3,4,5]];
    /**
     *
     * @param status Optional. Status of the embeddings response. Defaults to `success`.
     * @param output Optional. Embeddings to generate. Defaults to `[[1,2,3,4,5]]`.
     * @param message Optional. Message to return with response.
     */
    public constructor(status: EmbeddingsResponseStatus = 'success', output: number[][]|undefined = TestEmbeddings.TEST_OUTPUT, message?: string) {
        this.status = status;
        this.output = output;
    }

    /**
     * Status of the embeddings response.
     */
    public status: EmbeddingsResponseStatus;

    /**
     * Generated embeddings.
     */
    public output: number[][]|undefined;

    /**
     * Message to return with response.
     */
    public message?: string;

    /**
     * Returns a generated set of test embeddings
     * @param inputs Input to generate embeddings for.
     */
    public createEmbeddings(inputs: string | string[]): Promise<EmbeddingsResponse> {
        // Validate inputs
        if (typeof inputs == 'string') {
            if (inputs.trim().length == 0) {
                return Promise.resolve({ status: 'error', message: `Empty string passed to createEmbeddings()` });
            }
        } else if (Array.isArray(inputs)) {
            if (inputs.length == 0) {
                return Promise.resolve({ status: 'error', message: `Empty array passed to createEmbeddings()` });
            }
        } else {
            return Promise.resolve({ status: 'error', message: `Invalid inputs of type '${typeof inputs}' passed to createEmbeddings()` });
        }

        // Return expected response
        const response: EmbeddingsResponse = { status: this.status };
        if (this.output) {
            response.output = this.output;
        }
        if (this.message) {
            response.message = this.message;
        }

        return Promise.resolve(response);
    }
}