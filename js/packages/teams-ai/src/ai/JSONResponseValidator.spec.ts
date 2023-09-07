import { strict as assert } from "assert";
import { FunctionRegistry, GPT3Tokenizer, VolatileMemory } from "promptrix";
import { JSONResponseValidator } from "./JSONResponseValidator";
import { Schema } from "jsonschema";


describe("JSONResponseValidator", () => {
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();
    const schema: Schema = {
        type: "object",
        properties: {
            foo: {
                type: "string"
            }
        },
        required: ["foo"]
    };

    describe("constructor", () => {
        it("should create a JSONResponseValidator", () => {
            const validator = new JSONResponseValidator();
            assert.notEqual(validator, undefined);
        });

        it("should create a JSONResponseValidator with schema", () => {
            const validator = new JSONResponseValidator(schema);
            assert.notEqual(validator, undefined);
        });
    });

    describe("validateResponse", () => {
        it("should pass a JSON object with no schema", async () => {
            const validator = new JSONResponseValidator();
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"foo":"bar"}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, true);
            assert.deepEqual(response.value, { foo: 'bar' });
        });

        it("should pass a JSON object passed in as a message", async () => {
            const validator = new JSONResponseValidator();
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: { role: 'assstant', content: '{"foo":"bar"}' } }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, true);
            assert.deepEqual(response.value, { foo: 'bar' });
        });

        it("should pass a JSON object with schema", async () => {
            const validator = new JSONResponseValidator(schema);
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"foo":"bar"}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, true);
            assert.deepEqual(response.value, { foo: 'bar' });
        });

        it("should fail a response with no JSON object", async () => {
            const validator = new JSONResponseValidator();
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, false);
            assert.equal(response.feedback, 'No valid JSON objects were found in the response. Return a valid JSON object.');
            assert.equal(response.value, undefined);
        });

        it("should fail a response with no JSON object as a message", async () => {
            const validator = new JSONResponseValidator();
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: { role: 'assistant', content: undefined } }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, false);
            assert.equal(response.feedback, 'No valid JSON objects were found in the response. Return a valid JSON object.');
            assert.equal(response.value, undefined);
        });

        it("should fail a JSON object that doesn't match schema", async () => {
            const validator = new JSONResponseValidator(schema);
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"foo":7}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, false);
            assert.equal(response.feedback, `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`);
        });

        it("should validate multiple objects in a response and return the last valid one", async () => {
            const validator = new JSONResponseValidator(schema);
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"foo":"taco"}\n{"foo":"bar"}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, true);
            assert.deepEqual(response.value, { foo: 'bar' });
        });

        it("should validate multiple objects in a response and return the only valid one", async () => {
            const validator = new JSONResponseValidator(schema);
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"foo":1}\n{"foo":"bar"}\n{"foo":3}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, true);
            assert.deepEqual(response.value, { foo: 'bar' });
        });

        it("should validate multiple objects ", async () => {
            const validator = new JSONResponseValidator(schema);
            const response = await validator.validateResponse(memory, functions, tokenizer, { status: 'success', message: '{"bar":"foo"}\n{"foo":3}' }, 3);
            assert.notEqual(response, undefined);
            assert.equal(response.valid, false);
            assert.equal(response.feedback, `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`);
        });
    });
});
