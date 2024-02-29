import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPTTokenizer } from '../tokenizers';
import { UserMessage } from './UserMessage';

describe('UserMessage', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();

    describe('constructor', () => {
        it('should create a UserMessage', () => {
            const section = new UserMessage('Hello World');
            assert.equal(section.template, 'Hello World');
            assert.equal(section.role, 'user');
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n');
            assert.equal(section.textPrefix, 'user: ');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a UserMessage to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new UserMessage('Hello World');
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a TemplateSection to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new UserMessage('Hello World');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'user: Hello World');
                assert.equal(rendered.length, 5);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
