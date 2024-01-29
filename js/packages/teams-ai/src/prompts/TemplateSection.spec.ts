import { strict as assert } from 'assert';
import { TemplateSection } from './TemplateSection';
import { TestAdapter } from 'botbuilder';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPT3Tokenizer } from '../tokenizers';

describe('TemplateSection', () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPT3Tokenizer();
    const functions = new TestPromptManager()
        .addFunction('test', async (context, state, functions, tokenizer, args) => 'Hello World')
        .addFunction('test2', async (context, state, functions, tokenizer, args) => args[0])
        .addFunction('test3', async (context, state, functions, tokenizer, args) => args.join(' '));
    const conversation = {
        foo: 'bar'
    };

    describe('constructor', () => {
        it('should create a TemplateSection', async () => {
            const section = new TemplateSection('Hello World', 'user');
            assert.equal(section.template, 'Hello World');
            assert.equal(section.role, 'user');
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n');
        });

        it('should create a TemplateSection with other params', async () => {
            const section = new TemplateSection('Hello World', 'system', 2.0, false);
            assert.equal(section.template, 'Hello World');
            assert.equal(section.role, 'system');
            assert.equal(section.tokens, 2.0);
            assert.equal(section.required, false);
            assert.equal(section.separator, '\n');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a TemplateSection to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello World', 'user');
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello World', 'user');
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 1);
                assert.deepEqual(rendered.output, [{ role: 'user', content: 'Hello World' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a TemplateSection to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello World', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should identify a text output as being too long', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello World', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 1);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, true);
            });
        });
    });

    describe('template syntax', () => {
        it('should render a template with a {{$variable}}', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new TemplateSection('Hello {{$conversation.foo}}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello bar');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{ $variable }} - even with white space inbetween the parameter', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new TemplateSection('Hello {{ $conversation.foo }}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello bar');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{$variable}} and a {{function}}', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new TemplateSection('Hello {{$conversation.foo}} {{test}}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello bar Hello World');
                assert.equal(rendered.length, 4);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{function}} and arguments', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello {{test2 World}}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{ function }} and arguments - even with white space inbetween the parameter', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello {{ test2 World }}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello World');
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{function}} and quoted arguments', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection("Hello {{test2 'Big World'}}", 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello Big World');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{function}} and backtick arguments', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('Hello {{test2 `Big World`}}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello Big World');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render a template with a {{function}} and multiple arguments', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection("Hello {{test3 'Big' World}}", 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'Hello Big World');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should skip {{}} empty template params', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new TemplateSection('{{}}', 'user');
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, '');
                assert.equal(rendered.length, 0);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should throw an error for an invalid template', () => {
            try {
                new TemplateSection("Hello {{test3 'Big' World}", 'user');
                assert.fail('Should have thrown an error');
            } catch (e: unknown) {
                assert.equal((e as Error).message, "Invalid template: Hello {{test3 'Big' World}");
            }
        });

        it("should throw an error for an invalid {{function 'arg}}", () => {
            try {
                new TemplateSection("Hello {{test3 'Big}}", 'user');
                assert.fail('Should have thrown an error');
            } catch (e: unknown) {
                assert.equal((e as Error).message, "Invalid template: Hello {{test3 'Big}}");
            }
        });
    });
});
