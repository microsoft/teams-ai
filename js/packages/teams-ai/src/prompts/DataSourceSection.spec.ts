import assert from 'assert';
import { TestAdapter } from 'botbuilder-core';
import { DataSourceSection } from './DataSourceSection';
import { TextDataSource } from '../dataSources/TextDataSource';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { GPTTokenizer } from '../tokenizers';

describe('DataSourceSection', () => {
    const textDataSource = new TextDataSource('testname', 'Hello World!');
    const adapter = new TestAdapter();
    const functions = new TestPromptManager();
    const tokenizer = new GPTTokenizer();

    describe('constructor', () => {
        it('should create a DataSourceSection', () => {
            const section = new DataSourceSection(textDataSource, -2);
            assert.notEqual(section, undefined);
            assert.equal(section.tokens, -2);
            assert.equal(section.required, true);
            assert.equal(section.separator, '\n\n');
            assert.equal(section.textPrefix, '');
        });
    });

    describe('renderAsMessages', () => {
        it('should render a DataSourceSection', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const section = new DataSourceSection(textDataSource, -2);
                const rendered = await section.renderAsMessages(context, state, functions, tokenizer, 100);

                assert.deepEqual(rendered.output, [{ role: 'system', content: 'Hello World!' }]);
                assert.equal(rendered.length, 3);
                assert.equal(rendered.tooLong, false);
            });
        });
    });
});
