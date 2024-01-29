import assert from 'assert';
import { TestAdapter } from 'botbuilder-core';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPT3Tokenizer } from '../tokenizers';
import { FunctionResponseMessage } from './FunctionResponseMessage';

describe('FunctionResponseMessage', () => {
    const functionName = 'foo';
    const response = 'bar';
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe('constructor', () => {
        it('should create a FunctionResponseMessage', () => {
            const section = new FunctionResponseMessage(functionName, response);

            assert.notEqual(section, undefined);
            assert.equal(section.name, functionName);
            assert.equal(section.response, response);
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n');
            assert.equal(section.textPrefix, 'user: ');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a FunctionResponseMessage', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new FunctionResponseMessage(functionName, response);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);

                assert.deepEqual(rendered.output, [{ role: 'function', name: functionName, content: response }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
