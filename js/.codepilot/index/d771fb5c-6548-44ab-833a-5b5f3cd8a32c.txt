import { strict as assert } from "assert";
import { FunctionRegistry, GPT3Tokenizer, Prompt, VolatileMemory } from "promptrix";
import { TestModel } from "./TestModel";


describe("TestModel", () => {
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();
    const prompt = new Prompt([]);

    describe("constructor", () => {
        it("should create a TestModel with default params", () => {
            const client = new TestModel();
            assert.equal(client.status, 'success');
            assert.deepEqual(client.response, { role: 'assistant', content: 'Hello World' });
        });

        it("should create a TestModel with custom params", () => {
            const client = new TestModel('error', 'Hello Error');
            assert.equal(client.status, 'error');
            assert.equal(client.response, 'Hello Error');
        });
    });

    describe("completePrompt", () => {
        it("should return a success response", async () => {
            const client = new TestModel();
            const response = await client.completePrompt(memory, functions, tokenizer, prompt);
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello World' });
        });
    });
});
