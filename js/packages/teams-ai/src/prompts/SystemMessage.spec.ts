import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPT3Tokenizer } from '../tokenizers';
import { SystemMessage } from './SystemMessage';

describe('SystemMessage', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe('constructor', () => {
        it('should create a SystemMessage', () => {
            const section = new SystemMessage('Hello World');
            assert.equal(section.template, 'Hello World');
            assert.equal(section.role, 'system');
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a SystemMessage to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new SystemMessage('Hello World');
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a TemplateSection to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new SystemMessage('Hello World');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
