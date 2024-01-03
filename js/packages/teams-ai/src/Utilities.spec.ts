import { strict as assert } from 'assert';
import { Utilities } from './Utilities';
import { GPT3Tokenizer } from './tokenizers';

describe('Utilities', () => {
    const tokenizer = new GPT3Tokenizer();
    describe('toString', () => {
        it('should convert a number to a string', () => {
            const result = Utilities.toString(tokenizer, 1);
            assert.equal(result, '1');
        });

        it('should convert a string to a string', () => {
            const result = Utilities.toString(tokenizer, '1');
            assert.equal(result, '1');
        });

        it('should convert a boolean to a string', () => {
            const result = Utilities.toString(tokenizer, true);
            assert.equal(result, 'true');
        });

        it('should convert a simple object to yaml', () => {
            const result = Utilities.toString(tokenizer, { a: 1 });
            assert.equal(result, 'a: 1\n');
        });

        it('should convert a deep object to JSON', () => {
            const result = Utilities.toString(tokenizer, { a: { b: { c: { d: 1 } } } });
            assert.equal(result, `{"a":{"b":{"c":{"d":1}}}}`);
        });

        it('should convert a date to a string', () => {
            const result = Utilities.toString(tokenizer, new Date('2021-01-01'));
            assert.equal(result, '2021-01-01T00:00:00.000Z');
        });

        it('should return an empty string for undefined', () => {
            const result = Utilities.toString(tokenizer, undefined);
            assert.equal(result, '');
        });

        it('should return an empty string for null', () => {
            const result = Utilities.toString(tokenizer, null);
            assert.equal(result, '');
        });
    });
});
