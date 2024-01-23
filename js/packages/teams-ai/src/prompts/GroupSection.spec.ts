import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPT3Tokenizer } from '../tokenizers';
import { GroupSection } from './GroupSection';
import { TextSection } from './TextSection';

describe('GroupSection', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe('constructor', () => {
        it('should create a GroupSection', () => {
            const section = new GroupSection([new TextSection('Hello World', 'user')]);
            assert.equal(section.sections.length, 1);
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n\n');
        });

        it('should create a GroupSection with a custom params', () => {
            const section = new GroupSection([new TextSection('Hello World', 'user')], 'user', 100, false, ' ');
            assert.equal(section.sections.length, 1);
            assert.equal(section.role, 'user');
            assert.equal(section.tokens, 100);
            assert.equal(section.required, false);
            assert.equal(section.separator, ' ');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a TextSection to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello World', 'user')]);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello World', 'user')]);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 1);
                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should render multiple TextSections as a single messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello', 'user'), new TextSection('World', 'user')]);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello\n\nWorld' }]);
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a hierarchy of sections to a single message', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([
                    new GroupSection([new TextSection('Hello', 'user')]),
                    new TextSection('World', 'user')
                ]);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello\n\nWorld' }]);
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a TextSection to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello World', 'user')]);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a text output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello World', 'user')]);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 1);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should render multiple TextSections to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([new TextSection('Hello', 'user'), new TextSection('World', 'user')]);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a hierarchy of sections to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new GroupSection([
                    new GroupSection([new TextSection('Hello', 'user')]),
                    new TextSection('World', 'user')
                ]);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
