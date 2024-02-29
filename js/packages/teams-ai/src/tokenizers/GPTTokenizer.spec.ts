import { strict as assert } from 'assert';
import { GPTTokenizer } from './GPTTokenizer';

describe('GPTTokenizer', () => {
    describe('constructor', () => {
        it('should create a GPTTokenizer', () => {
            const tokenizer = new GPTTokenizer();
            assert.notEqual(tokenizer, null);
        });
    });

    let encoded: number[] = [];
    describe('encode', () => {
        it('should encode a string', async () => {
            const tokenizer = new GPTTokenizer();
            encoded = await tokenizer.encode('Hello World');
            assert.equal(encoded.length, 2);
            assert.equal(typeof encoded[0], 'number');
        });
    });

    describe('decode', () => {
        it('should decode an array of numbers', async () => {
            const tokenizer = new GPTTokenizer();
            const decoded = await tokenizer.decode(encoded);
            assert.equal(decoded, 'Hello World');
        });
    });
});
