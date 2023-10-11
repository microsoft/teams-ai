import { strict as assert } from "assert";
import { FunctionRegistry, GPT3Tokenizer, VolatileMemory } from "promptrix";
import { DefaultResponseValidator } from "./DefaultResponseValidator";


describe("DefaultResponseValidator", () => {
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a DefaultResponseValidator", () => {
            const validator = new DefaultResponseValidator();
            assert.notEqual(validator, undefined);
        });
    });

    describe("validateResponse", () => {
        it("should return isValid === true", async () => {
            const validator = new DefaultResponseValidator();
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: 'Hello World' }, 3);
            assert.notDeepEqual(response, undefined);
            assert.equal(response.valid, true);
        });
    });
});
