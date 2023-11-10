import { strict as assert } from "assert";
import { JSONResponseValidator } from "./JSONResponseValidator";
import { Schema } from "jsonschema";
import { TestAdapter } from "botbuilder";
import { GPT3Tokenizer } from "../tokenizers";
import { TestTurnState } from "../TestTurnState";

describe("JSONResponseValidator", () => {
    const adapter = new TestAdapter();
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
    const message = { role: 'assstant', content: '{"foo":"bar"}' };
    const emptyMessage = { role: 'assstant', content: '' };
    const nullMessage = { role: 'assstant', content: undefined };
    const invalidMessage = { role: 'assstant', content:  '{"foo":7}' };
    const multiMessage = { role: 'assstant', content: '{"foo":"taco"}\n{"foo":"bar"}' };
    const invalidMultiMessage = { role: 'assstant', content: '{"foo":1}\n{"foo":"bar"}\n{"foo":3}' };
    const invalidMultiMessage2 = { role: 'assstant', content: '{"bar":"foo"}\n{"foo":3}' };

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
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it("should pass a JSON object passed in as a message", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it("should pass a JSON object with schema", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it("should fail a response with no JSON object", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: emptyMessage }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(response.feedback, 'No valid JSON objects were found in the response. Return a valid JSON object.');
                assert.equal(response.value, undefined);
            });
        });

        it("should fail a response with no JSON object as a message", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: nullMessage }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(response.feedback, 'No valid JSON objects were found in the response. Return a valid JSON object.');
                assert.equal(response.value, undefined);
            });
        });

        it("should fail a JSON object that doesn't match schema", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: invalidMessage }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(response.feedback, `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`);
            });
        });

        it("should validate multiple objects in a response and return the last valid one", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: multiMessage }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it("should validate multiple objects in a response and return the only valid one", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: invalidMultiMessage }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it("should validate multiple objects ", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: invalidMultiMessage2 }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(response.feedback, `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`);
            });
        });
    });
});
