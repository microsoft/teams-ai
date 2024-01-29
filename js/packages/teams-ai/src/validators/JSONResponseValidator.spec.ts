import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import { TestAdapter } from 'botbuilder';

import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPT3Tokenizer } from '../tokenizers';
import { JSONResponseValidator } from './JSONResponseValidator';
import { Schema, ValidationError } from 'jsonschema';

describe('JSONResponseValidator', () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPT3Tokenizer();
    const schema: Schema = {
        type: 'object',
        properties: {
            foo: {
                type: 'string'
            }
        },
        required: ['foo']
    };
    const message = { role: 'assistant', content: '{"foo":"bar"}' };

    describe('constructor', () => {
        it('should create a JSONResponseValidator', () => {
            const validator = new JSONResponseValidator();
            assert.notEqual(validator, undefined);
        });

        it('should create a JSONResponseValidator with schema', () => {
            const validator = new JSONResponseValidator(schema);
            assert.notEqual(validator, undefined);
        });
    });

    describe('validateResponse', () => {
        it('should pass a JSON object with no schema', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it('should pass a JSON object passed in as a message', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it('should pass a JSON object with schema', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it('should fail a response with no JSON object', async () => {
            const emptyMessage = { role: 'assistant', content: '' };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: emptyMessage },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    'No valid JSON objects were found in the response. Return a valid JSON object.'
                );
                assert.equal(response.value, undefined);
            });
        });

        it('should fail a response with no JSON object as a message', async () => {
            const nullMessage = { role: 'assistant', content: undefined };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator();
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: nullMessage },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    'No valid JSON objects were found in the response. Return a valid JSON object.'
                );
                assert.equal(response.value, undefined);
            });
        });

        it("should fail a JSON object that doesn't match schema", async () => {
            const invalidMessage = { role: 'assistant', content: '{"foo":7}' };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: invalidMessage },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`
                );
            });
        });

        it('should validate multiple objects in a response and return the last valid one', async () => {
            const multiMessage = { role: 'assistant', content: '{"foo":"taco"}\n{"foo":"bar"}' };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: multiMessage },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it('should validate multiple objects in a response and return the only valid one', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const invalidMultiMessage = { role: 'assistant', content: '{"foo":1}\n{"foo":"bar"}\n{"foo":3}' };

                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: invalidMultiMessage },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, true);
                assert.deepEqual(response.value, { foo: 'bar' });
            });
        });

        it('should validate multiple objects ', async () => {
            const invalidMultiMessage2 = { role: 'assistant', content: '{"bar":"foo"}\n{"foo":3}' };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: invalidMultiMessage2 },
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to a string`
                );
            });
        });

        it('should trigger `additionalProperties` error ', async () => {
            const schemaError = {
                type: 'object',
                properties: {
                    message: {
                        type: 'string'
                    }
                },
                additionalProperties: false
            };
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schemaError as Schema);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: message, foo: 'bar' } as any,
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The JSON returned had errors. Apply these fixes:\nremove the "foo" property from the JSON object`
                );
            });
        });

        it('triggers anyOf error', async () => {
            const messageFailsAnyOf = { role: 'assistant', content: '{"foo":true, "boo": "ahh!"}' };
            const schemaAnyOf = {
                type: 'object',
                properties: {
                    foo: {
                        anyOf: [{ type: 'string' }, { type: 'number' }]
                    },
                    boo: {
                        type: 'string'
                    }
                },
                required: ['foo', 'boo']
            };

            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schemaAnyOf);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    {
                        status: 'success',
                        message: messageFailsAnyOf
                    } as any,
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    `The JSON returned had errors. Apply these fixes:\nconvert "instance.foo" to one of the allowed types in the provided schema.`
                );
            });
        });

        it('triggers required error', async () => {
            const schemaRequired = {
                type: 'object',
                properties: {
                    foo: { type: 'string' }
                },
                required: ['foo', 'boo']
            };

            await adapter.sendTextToBot('test', async (context) => {
                const messageLacksRequired = { role: 'assistant', content: '{"fooz": "bar", "boo": "ahh!"}' };
                const state = await TestTurnState.create(context);
                const validator = new JSONResponseValidator(schemaRequired);
                const response = await validator.validateResponse(
                    context,
                    state,
                    tokenizer,
                    { status: 'success', message: messageLacksRequired } as any,
                    3
                );
                assert.notEqual(response, undefined);
                assert.equal(response.valid, false);
                assert.equal(
                    response.feedback,
                    'The JSON returned had errors. Apply these fixes:\nadd the "foo" property to the JSON object'
                );
                assert.equal(response.value, undefined);
            });
        });

        it('should stringify error.argument when it is an object', async () => {
            const schema = {
                type: 'object',
                properties: {
                    foo: { type: 'string' }
                },
                required: ['foo']
            };

            await adapter.sendTextToBot('test', async (context) => {
                const validator = new JSONResponseValidator(schema);
                const spy = sinon.spy(validator, 'getErrorFix' as any);
                const stringifySpy = sinon.spy(JSON, 'stringify');
                const state = await TestTurnState.create(context);

                await validator.validateResponse(context, state, tokenizer, { status: 'success', message: message }, 3);
                const error = new ValidationError();
                error.argument = { foo: { bar: 'baz' } };

                spy.call(validator, error);
                assert(stringifySpy.calledWith({ foo: { bar: 'baz' } }));
            });
        });
    });
});
