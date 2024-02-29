import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import { Prompt } from './Prompt';
import { TextSection } from './TextSection';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPTTokenizer } from '../tokenizers';

describe('Prompt', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();

    describe('constructor', () => {
        it('should create a Prompt', () => {
            const prompt = new Prompt([new TextSection('Hello World', 'user')]);
            assert.equal(prompt.sections.length, 1);
            assert.equal(prompt.tokens, -1);
            assert.equal(prompt.required, true);
            assert.equal(prompt.separator, '\n\n');
        });

        it('should create a Prompt with a custom params', () => {
            const prompt = new Prompt([new TextSection('Hello World', 'user')], 100, false, ' ');
            assert.equal(prompt.sections.length, 1);
            assert.equal(prompt.tokens, 100);
            assert.equal(prompt.required, false);
            assert.equal(prompt.separator, ' ');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a TextSection to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello World', 'user')]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello World', 'user')]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 1);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should render multiple TextSections to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello', 'user'), new TextSection('World', 'user')]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'user', content: 'World' }
                ]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a hierarchy of prompts to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new Prompt([new TextSection('Hello', 'user')]),
                    new TextSection('World', 'user')
                ]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'user', content: 'World' }
                ]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a TextSection to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello World', 'user')]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a text output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello World', 'user')]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 1);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should render multiple TextSections to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([new TextSection('Hello', 'user'), new TextSection('World', 'user')]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a hierarchy of prompts to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new Prompt([new TextSection('Hello', 'user')]),
                    new TextSection('World', 'user')
                ]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('proportional rendering', () => {
        it('should render both fixed and proportional sections as messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('There Big', 'user', 1.0, false),
                    new TextSection('World', 'user', 10, true)
                ]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'user', content: 'There Big' },
                    { role: 'user', content: 'World' }
                ]);
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render both fixed and proportional sections as text', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('There Big', 'user', 1.0, false),
                    new TextSection('World', 'user', 10, true)
                ]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello\n\nThere Big\n\nWorld');
                assert.equal(rendered.length, 6);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render only fixed sections', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('World', 'user', 10, true)
                ]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 2);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'user', content: 'World' }
                ]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should drop optional sections as needed', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('There Big', 'user', 0.5, false),
                    new TextSection('World', 'user', 0.5, true)
                ]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 4);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should drop multiple optional sections as needed', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('There', 'user', 10, false),
                    new TextSection('Big', 'user', 10, false),
                    new TextSection('World', 'user', 10, true)
                ]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 2);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'user', content: 'World' }
                ]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should keep required sections even if too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello', 'user', 10, true),
                    new TextSection('There Big', 'user', 0.5, false),
                    new TextSection('World', 'user', 0.5, true)
                ]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 2);
                assert.equal(rendered.output, 'Hello\n\nWorld');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should skip rendering proportional sections if fixed sections too big', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello There', 'user', 10, true),
                    new TextSection('Big', 'user', 0.5, true),
                    new TextSection('World', 'user', 0.5, true)
                ]);
                const rendered = await prompt.renderAsText(context, state, functions, tokenizer, 1);
                assert.equal(rendered.output, 'Hello There');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should skip rendering proportional sections if fixed sections too big for messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const prompt = new Prompt([
                    new TextSection('Hello There', 'user', 10, true),
                    new TextSection('Big', 'user', 0.5, true),
                    new TextSection('World', 'user', 0.5, true)
                ]);
                const rendered = await prompt.renderAsMessages(context, state, functions, tokenizer, 1);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello There' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });
    });
});
