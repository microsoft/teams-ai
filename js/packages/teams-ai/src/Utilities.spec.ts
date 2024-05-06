import { strict as assert } from 'assert';

import { ClientCitation } from './actions';
import { GPTTokenizer } from './tokenizers';
import { Utilities } from './Utilities';

describe('Utilities', () => {
    const tokenizer = new GPTTokenizer();

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

    describe('snippet', () => {
        it('should return the text if it is shorter than the max length', () => {
            const result = Utilities.snippet('hello world', 20);
            assert.equal(result, 'hello world');
        });

        it('should clip the text to the max length', () => {
            const result = Utilities.snippet('hello world', 5);
            assert.equal(result, 'hell...');
        });

        it('should clip the text to the max length at the last whole word', () => {
            const result = Utilities.snippet('hello world', 6);
            assert.equal(result, 'hello...');
        });
    });

    describe('formatCitationsResponse', () => {
        it('should replace citation tags with numbers', () => {
            const result = Utilities.formatCitationsResponse('hello [doc1] world [docs2]');
            assert.equal(result, 'hello [1] world [2]');
        });
        it('should replace citation tags with higher numbers', () => {
            const result = Utilities.formatCitationsResponse('hello [doc19] world [docs200]');
            assert.equal(result, 'hello [19] world [200]');
        });
    });

    describe('getUsedCitations', () => {
        it('should return an empty array if there are no citations', () => {
            const result = Utilities.getUsedCitations('hello world', []);
            assert.equal(result, undefined);
        });

        it('should return an array of used citations', () => {
            const citations = [
                {
                    '@type': 'Claim',
                    position: '1',
                    appearance: {
                        '@type': 'DigitalDocument',
                        name: 'the title',
                        abstract: 'some citation text...'
                    }
                },
                {
                    '@type': 'Claim',
                    position: '2',
                    appearance: {
                        '@type': 'DigitalDocument',
                        name: 'the title',
                        abstract: 'some citation other text...'
                    }
                }
            ] as ClientCitation[];
            const result = Utilities.getUsedCitations('hello [1] world', citations);
            assert.deepEqual(result, [citations[0]]);
        });
    });
});
