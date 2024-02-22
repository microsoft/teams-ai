import assert from 'assert';
import { Colorize } from './Colorize';

describe('Colorize', () => {
    describe('error', () => {
        it('should return the error message in red color', () => {
            const error = new Error('Test error');
            const result = Colorize.error(error);
            assert.equal(result, '\x1b[31;1mTest error\x1b[0m');
        });

        it('should return the string error in red color', () => {
            const error = 'Test error';
            const result = Colorize.error(error);
            assert.equal(result, '\x1b[31;1mTest error\x1b[0m');
        });
    });

    describe('output', () => {
        it('should return the string output in green color', () => {
            const output = 'Test output';
            const result = Colorize.output(output);
            assert.equal(result, '\x1b[32mTest output\x1b[0m');
        });
    });

    describe('success', () => {
        it('should return the success message in green color', () => {
            const message = 'Test success';
            const result = Colorize.success(message);
            assert.equal(result, '\x1b[32;1mTest success\x1b[0m');
        });
    });

    describe('title', () => {
        it('should return the title in magenta color', () => {
            const title = 'Test title';
            const result = Colorize.title(title);
            assert.equal(result, '\x1b[35;1mTest title\x1b[0m');
        });
    });

    describe('value', () => {
        it('should return the field and value with proper formatting', () => {
            const field = 'Name';
            const value = 'John';
            const units = 'kg';
            const result = Colorize.value(field, value, units);
            assert.equal(result, 'Name: \x1b[32m"John"\x1b[0m');
        });
    });

    describe('warning', () => {
        it('should return the warning message in yellow color', () => {
            const warning = 'Test warning';
            const result = Colorize.warning(warning);
            assert.equal(result, '\x1b[33mTest warning\x1b[0m');
        });
    });
});
