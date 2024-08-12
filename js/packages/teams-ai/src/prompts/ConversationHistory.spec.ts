import { strict as assert } from 'assert';
import { ConversationHistory } from './ConversationHistory';
import { TestAdapter } from 'botbuilder';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { GPTTokenizer } from '../tokenizers';
import { TestTurnState } from '../internals/testing/TestTurnState';

describe('ConversationHistory', () => {
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();
    const conversation = {
        history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi' }
        ],
        longHistory: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi! How can I help you?' },
            { role: 'user', content: "I'd like to book a flight" },
            { role: 'assistant', content: 'Sure, where would you like to go?' }
        ],
        toolHistory: [
            { role: 'tool', content: 'result', action_call_id: '123123' },
            { role: 'assistant', content: 'Hello' }
        ]
    };

    describe('constructor', () => {
        it('should create a ConversationHistory', () => {
            const section = new ConversationHistory('conversation.history');
            assert.equal(section.variable, 'conversation.history');
            assert.equal(section.tokens, 1.0);
            assert.equal(section.required, false);
            assert.equal(section.separator, '\n');
            assert.equal(section.userPrefix, 'user: ');
            assert.equal(section.assistantPrefix, 'assistant: ');
            assert.equal(section.textPrefix, '');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a ConversationHistory to an array of messages', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.history', 100);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi' }
                ]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should truncate its output to match available budget', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.history', 1);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 1);
                assert.deepEqual(rendered.output, [{ role: 'assistant', content: 'Hi' }]);
                assert.equal(rendered.length, 1);
                assert.equal(rendered.tooLong, false);
            });
        });

        it("should render nothing when there's no history", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.nohistory', 100);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, []);
                assert.equal(rendered.length, 0);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render nothing for a long last message', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.longHistory', 100);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 2);
                assert.deepEqual(rendered.output, []);
                assert.equal(rendered.length, 0);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should always render the last message when section is required', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.longHistory', 100, true);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 2);
                assert.deepEqual(rendered.output, [
                    { role: 'assistant', content: 'Sure, where would you like to go?' }
                ]);
                assert.equal(rendered.length, 9);
                assert.equal(rendered.tooLong, true);
            });
        });

        it('should remove messages with role tool correctly', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.toolHistory', 100);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);
                assert.deepEqual(rendered.output, [{ role: 'assistant', content: 'Hello' }]);
                assert.equal(rendered.length, 2);
                assert.equal(rendered.tooLong, false);
            });
        });
    });

    describe('renderAsText', () => {
        it('should render a ConversationHistory to a string', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.history', 100);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, 'user: Hello\nassistant: Hi');
                assert.equal(rendered.length, 7);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should truncate its output to match available budget', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.history', 1);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 4);
                assert.equal(rendered.output, 'assistant: Hi');
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });

        it("should render nothing when there's no history", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.nohistory', 100);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 100);
                assert.equal(rendered.output, '');
                assert.equal(rendered.length, 0);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should render nothing for a long last message', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.longHistory', 100);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 2);
                assert.equal(rendered.output, '');
                assert.equal(rendered.length, 0);
                assert.equal(rendered.tooLong, false);
            });
        });

        it('should always render the last message when section is required', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context, { conversation });
                const section = new ConversationHistory('conversation.longHistory', 100, true);
                const rendered = await section.renderAsText(context, state, functions, tokenizer, 2);
                assert.equal(rendered.output, 'assistant: Sure, where would you like to go?');
                assert.equal(rendered.length, 11);
                assert.equal(rendered.tooLong, true);
            });
        });
    });
});
