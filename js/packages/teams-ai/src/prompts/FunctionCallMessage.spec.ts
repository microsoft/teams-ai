import assert from 'assert';
import { TestAdapter } from 'botbuilder-core';
import { FunctionCallMessage } from './FunctionCallMessage';
import { FunctionCall } from './Message';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPT3Tokenizer } from '../tokenizers';

describe('FunctionCallMessage', () => {
    const functionCall: FunctionCall = {
        name: 'test',
        arguments: '{"foo":"bar"}'
    };
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe('constructor', () => {
        it('should create a FunctionCallMessage', () => {
            const section = new FunctionCallMessage(functionCall);

            assert.notEqual(section, undefined);
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n');
            assert.equal(section.textPrefix, 'assistant: ');
            assert.equal(section.function_call, functionCall);
        });
    });

    describe('renderAsMessages', () => {
        it('should render a FunctionCallMessage', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new FunctionCallMessage(functionCall);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);

                assert.deepEqual(rendered.output, [
                    { role: 'assistant', content: undefined, function_call: functionCall }
                ]);
                assert.equal(rendered.length, 17);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
