import { strict as assert } from "assert";
import { ActionResponseValidator } from "./ActionResponseValidator";
import { TestAdapter } from "botbuilder";
import { GPT3Tokenizer } from "../tokenizers";
import { TestTurnState } from "../TestTurnState";
import { ChatCompletionAction } from "../models";
import { Message } from "../prompts";

describe("ActionResponseValidator", () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPT3Tokenizer();
    const actions: ChatCompletionAction[] = [
        {
            name: 'test',
            description: 'test action',
            parameters: {
                type: 'object',
                properties: {
                    foo: {
                        type: 'string'
                    }
                },
                required: ['foo']
            }
        },
        {
            name: 'empty',
            description: 'empty test action'
        }
    ];
    const valid_test_call: Message = {
        role: 'assistant',
        content: null,
        function_call: {
            name: 'test',
            arguments: '{"foo":"bar"}'
        }
    };
    const invalid_test_call: Message = {
        role: 'assistant',
        content: null,
        function_call: {
            name: 'test'
        }
    };
    const empty_call: Message = {
        role: 'assistant',
        content: null,
        function_call: {
            name: 'empty'
        }
    };
    const text_message: Message = {
        role: 'assistant',
        content: 'test'
    };
    const invalid_action_call: Message = {
        role: 'assistant',
        content: null,
        function_call: {
            name: 'invalid'
        }
    };

    describe("constructor", () => {
        it("should create a ActionResponseValidator", () => {
            const validator = new ActionResponseValidator(actions, false);
            assert.notEqual(validator, undefined);
            assert.deepEqual(validator.actions, actions);
        });
    });

    describe("validateResponse", () => {
        it("should pass a valid function with correct params", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, false);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: valid_test_call }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.equal(response.feedback, undefined);
                assert.deepEqual(response.value, { name: 'test', parameters: { foo: 'bar' } });
            });
        });

        it("should fail a valid function with incorrect params", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, false);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: invalid_test_call }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.notEqual(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });

        it("should pass an empty function call", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, false);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: empty_call }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { name: 'empty', parameters: {} });
            });
        });

        it("should pass a text message with isRequired = false", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, false);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: text_message }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.equal(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });

        it("should fail a text message with isRequired = true", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, true);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: text_message }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.notEqual(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });

        it("should fail an invalid function call", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new ActionResponseValidator(actions, false);
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: invalid_action_call }, 3);
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.notEqual(response.feedback, undefined);
                assert.equal(response.value, undefined);
            });
        });
    });
});
