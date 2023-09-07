import { strict as assert } from "assert";
import { Message, FunctionRegistry, GPT3Tokenizer, Prompt, PromptFunctions, PromptMemory, Tokenizer, VolatileMemory } from "promptrix";
import { PromptResponse, PromptResponseValidator, Validation } from "./types";
import { DefaultResponseValidator } from "../DefaultResponseValidator";
import { TestModel } from "../TestModel";
import { AlphaWave } from "../LLMClient";

class TestValidator implements PromptResponseValidator {
    public feedback: string = 'Something is wrong';
    public repairAttempts: number = 0;
    public exception?: Error;
    public clientErrorDuringRepair: boolean = false;
    public returnContent: boolean = false;

    public constructor(public model: TestModel) { }

    public validateResponse(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, response: PromptResponse, remaining_attempts: number): Promise<Validation> {
        if (this.exception) {
            const exception = this.exception;
            this.exception = undefined;
            return Promise.reject(exception);
        }

        if (this.clientErrorDuringRepair && this.repairAttempts == 1) {
            // Simulate a model error on next turn
            this.clientErrorDuringRepair = false;
            this.model.status = 'error';
            this.model.response = 'Some Error';
            return Promise.resolve({ type: 'Validation', valid: false, feedback: this.feedback });
        } else if (this.repairAttempts > 0) {
            this.repairAttempts--;
            return Promise.resolve({ type: 'Validation', valid: false, feedback: this.feedback });
        } else if (this.returnContent) {
            this.returnContent = false;
            return Promise.resolve({ type: 'Validation', valid: true, value: (response.message as Message).content });
        } else {
            return Promise.resolve({ type: 'Validation', valid: true });
        }
    }
}

describe("AlphaWave", () => {
    const model = new TestModel('success', { role: 'assistant', content: 'Hello' });
    const prompt = new Prompt([]);
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();
    const validator = new TestValidator(model);

    describe("constructor", () => {
        it("should create a AlphaWave and use default values", () => {
            const wave = new AlphaWave({ model, prompt });
            assert.notEqual(wave, undefined);
            assert.notEqual(wave.options, undefined);
            assert.equal(wave.options.model, model);
            assert.equal(wave.options.prompt, prompt);
            assert.equal(wave.options.memory instanceof VolatileMemory, true);
            assert.equal(wave.options.functions instanceof FunctionRegistry, true);
            assert.equal(wave.options.tokenizer instanceof GPT3Tokenizer, true);
            assert.equal(wave.options.validator instanceof DefaultResponseValidator, true);
            assert.equal(wave.options.history_variable, 'history');
            assert.equal(wave.options.input_variable, 'input');
            assert.equal(wave.options.max_repair_attempts, 3);
            assert.equal(wave.options.max_history_messages, 10);
        });

        it("should create a AlphaWave and use provided values", () => {
            const wave = new AlphaWave({ model, prompt, memory, functions, tokenizer, validator, history_variable: 'test_history', input_variable: 'test_input', max_repair_attempts: 5, max_history_messages: 20 });
            assert.notEqual(wave, undefined);
            assert.notEqual(wave.options, undefined);
            assert.equal(wave.options.model, model);
            assert.equal(wave.options.prompt, prompt);
            assert.equal(wave.options.memory, memory);
            assert.equal(wave.options.functions, functions);
            assert.equal(wave.options.tokenizer, tokenizer);
            assert.equal(wave.options.validator, validator);
            assert.equal(wave.options.history_variable, 'test_history');
            assert.equal(wave.options.input_variable, 'test_input');
            assert.equal(wave.options.max_repair_attempts, 5);
            assert.equal(wave.options.max_history_messages, 20);
        });
    });

    const wave = new AlphaWave({ model, prompt, memory, functions, tokenizer, validator });
    describe("basic prompt completion", () => {
        it("should complete a prompt and update history", async () => {
            const response = await wave.completePrompt();
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'assistant', content: 'Hello' }]);
            const input = memory.get('input');
            assert.equal(input, undefined);
            memory.clear();
        });

        it("should complete a prompt with input passed in", async () => {
            model.response = 'Hello';
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            const input = memory.get('input');
            assert.equal(input, 'Hi');
            memory.clear();
        });

        it("should complete a prompt with input already in memory", async () => {
            model.response = 'Hello';
            memory.set('input', 'Hi');
            const response = await wave.completePrompt();
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            const input = memory.get('input');
            assert.equal(input, 'Hi');
            memory.clear();
        });

        it("should complete a prompt and update existing history", async () => {
            model.response = 'Sure I can help with that';
            memory.set('history', [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hi! How may I assist you?' }]);
            const response = await wave.completePrompt('book flight');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Sure I can help with that' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hi! How may I assist you?' },{ role: 'user', content: 'book flight' },{ role: 'assistant', content: 'Sure I can help with that' }]);
            memory.clear();
        });

        it("should complete a prompt and update existing history with a max history limit", async () => {
            model.response = 'Hello';
            for (let i = 0; i < 20; i++) {
                const response = await wave.completePrompt();
                assert.equal(response.status, 'success');
                assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            }
            const history = memory.get('history');
            assert.equal(history.length, wave.options.max_history_messages);
            memory.clear();
        });

        it("should complete a prompt and update existing history with a max history limit and input passed in", async () => {
            model.response = 'Hello';
            for (let i = 0; i < 20; i++) {
                const response = await wave.completePrompt('Hi');
                assert.equal(response.status, 'success');
                assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            }
            const history = memory.get('history');
            assert.equal(history.length, wave.options.max_history_messages);
            memory.clear();
        });

        it("should return an empty string for undefined response", async () => {
            model.response = undefined as any;
            const response = await wave.completePrompt();
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: '' });
            memory.clear();
        });

        it("should not update memory if no input_variable configured", async () => {
            const wave = new AlphaWave({ model, prompt, memory, functions, tokenizer, validator, input_variable: '' });
            model.response = 'Hello';
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const input = memory.get('');
            assert.equal(input, undefined);
            memory.clear();
        });

        it("should not update memory if no input_variable configured and no input passed in", async () => {
            const wave = new AlphaWave({ model, prompt, memory, functions, tokenizer, validator, input_variable: '' });
            model.response = 'Hello';
            const response = await wave.completePrompt('');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const input = memory.get('');
            assert.equal(input, undefined);
            memory.clear();
        });

        it("should not update memory if no history_variable configured", async () => {
            const wave = new AlphaWave({ model, prompt, memory, functions, tokenizer, validator, history_variable: '' });
            model.response = 'Hello';
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('');
            assert.equal(history, undefined);
            memory.clear();
        });

        it("should return a model error", async () => {
            model.status = 'error';
            model.response = 'Some Error';
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'error');
            assert.equal(response.message, 'Some Error');
            memory.clear();
        });

        it("should map any exceptions to errors", async () => {
            model.status = 'success';
            model.response = 'Hello';
            validator.exception = new Error('Some Exception');
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'error');
            assert.equal(response.message, 'Some Exception');
            memory.clear();
        });

        it("should map any non Error based exceptions to errors", async () => {
            model.status = 'success';
            model.response = 'Hello';
            validator.exception = 'Some Exception' as any;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'error');
            assert.equal(response.message, 'Some Exception');
            memory.clear();
        });

        it("should return a message object with a parsed content object", async () => {
            model.status = 'success';
            model.response = { role: 'assistant', content: { foo: 'bar'} };
            validator.returnContent = true;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: { foo: 'bar'} });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: { foo: 'bar'} }]);
            memory.clear();
        });
    });

    describe("prompt completion with validation", () => {
        it("should repair an error in one turn", async () => {
            model.response = 'Hello';
            validator.repairAttempts = 1;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            memory.clear();
        });

        it("should repair an error in two turns", async () => {
            model.response = 'Hello';
            validator.repairAttempts = 2;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            memory.clear();
        });

        it("should repair an error in three turns", async () => {
            model.response = 'Hello';
            validator.repairAttempts = 3;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            memory.clear();
        });

        it("should fail to repair an error in four turns", async () => {
            model.response = 'Hello';
            validator.repairAttempts = 4;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'invalid_response');
            assert.equal(response.message, validator.feedback);
            const history = memory.get('history');
            assert.equal(history, undefined);
            memory.clear();
        });

        it("should return model errors while repairing", async () => {
            model.response = 'Hello';
            validator.repairAttempts = 2;
            validator.clientErrorDuringRepair = true;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'error');
            assert.equal(response.message, 'Some Error');
            memory.clear();
        });

        it("should use default feedback when repairing", async () => {
            model.status = 'success';
            model.response = 'Hello';
            validator.repairAttempts = 1;
            validator.feedback = undefined as any;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello' }]);
            memory.clear();
        });

        it("should return an empty string for a repaired response that's undefined", async () => {
            model.status = 'success';
            model.response =  undefined as any;
            validator.repairAttempts = 1;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: '' });
            memory.clear();
        });

        it("should return a message object as a repaired response", async () => {
            model.status = 'success';
            model.response = { role: 'assistant', content: 'Hello World' };
            validator.repairAttempts = 1;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: 'Hello World' });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: 'Hello World' }]);
            memory.clear();
        });

        it("should return a message object with a parsed content object as a repaired response", async () => {
            model.status = 'success';
            model.response = { role: 'assistant', content: { foo: 'bar'} };
            validator.repairAttempts = 1;
            validator.returnContent = true;
            const response = await wave.completePrompt('Hi');
            assert.equal(response.status, 'success');
            assert.deepEqual(response.message, { role: 'assistant', content: { foo: 'bar'} });
            const history = memory.get('history');
            assert.deepEqual(history, [{ role: 'user', content: 'Hi' },{ role: 'assistant', content: { foo: 'bar'} }]);
            memory.clear();
        });
    });
});
