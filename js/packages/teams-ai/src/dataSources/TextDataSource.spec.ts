import { strict as assert } from 'assert';
import { TextDataSource } from './TextDataSource';
import { GPTTokenizer } from '../tokenizers';

describe('TextDataSource', () => {
    it('should construct and set the name', () => {
        const textDataSource = new TextDataSource('testname', 'testtext');
        assert.strictEqual(textDataSource.name, 'testname');
    });

    const tokenizer = new GPTTokenizer();
    it('renderData should return the trimmed text', async () => {
        const textDataSource = new TextDataSource('testname', 'Hello World!');
        const section = await textDataSource.renderData({} as any, {} as any, tokenizer, 1);

        assert.strictEqual(section.output, 'Hello');
        assert.strictEqual(section.tooLong, true);
        assert.strictEqual(section.length, 1);
    });

    it('renderData should return the full text when its encoded form does not exceed maxTokens', async () => {
        const textDataSource = new TextDataSource('testname', 'Hello World!');
        const section = await textDataSource.renderData({} as any, {} as any, tokenizer, 100);

        assert.strictEqual(section.output, 'Hello World!');
        assert.strictEqual(section.tooLong, false);
        assert.strictEqual(section.length, 3);
    });
});
