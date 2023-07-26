const assert = require('assert');
const { CosmosDbKeyEscape } = require('../');

describe('CosmosDbKeyEscape', function () {
    it('should fail with null key', function () {
        assert.throws(
            () => new CosmosDbKeyEscape(),
            Error,
            'constructor should have thrown error about missing key parameter.'
        );
    });

    it('should fail with empty key', function () {
        assert.throws(
            () => new CosmosDbKeyEscape(''),
            Error,
            'constructor should have thrown error about missing key parameter.'
        );
    });

    it('should fail with white spaces key', function () {
        assert.throws(
            () => new CosmosDbKeyEscape('   '),
            Error,
            'constructor should have thrown error about missing key parameter.'
        );
    });

    it('should not change a valid key', function () {
        const validKey = 'Abc12345';
        const sanitizedKey = CosmosDbKeyEscape.escapeKey(validKey);
        assert.equal(validKey, sanitizedKey, `${validKey} should be equal to ${sanitizedKey}`);
    });

    it("should escape illegal characters - case with '?'", function () {
        // Ascii code of "?" is "3f"
        const sanitizedKey = CosmosDbKeyEscape.escapeKey('?test?');
        assert.equal(sanitizedKey, '*3ftest*3f');
    });

    it("should escape illegal characters - case with '/'", function () {
        // Ascii code of "/" is "2f"
        const sanitizedKey = CosmosDbKeyEscape.escapeKey('/test/');
        assert.equal(sanitizedKey, '*2ftest*2f');
    });

    it("should escape illegal characters - case with '\\'", function () {
        // Ascii code of "\" is "5c"
        const sanitizedKey = CosmosDbKeyEscape.escapeKey('\\test\\');
        assert.equal(sanitizedKey, '*5ctest*5c');
    });

    it("should escape illegal characters - case with '#'", function () {
        // Ascii code of "#" is "23"
        const sanitizedKey = CosmosDbKeyEscape.escapeKey('#test#');
        assert.equal(sanitizedKey, '*23test*23');
    });

    it("should escape illegal characters - case with '*'", function () {
        // Ascii code of "*" is "2a".
        const sanitizedKey = CosmosDbKeyEscape.escapeKey('*test*');
        assert.equal(sanitizedKey, '*2atest*2a');
    });

    it('should escape illegal characters - compound key', function () {
        // Check a compound key
        const compoundSanitizedKey = CosmosDbKeyEscape.escapeKey('?#/');
        assert.equal(compoundSanitizedKey, '*3f*23*2f');
    });

    it('should handle possible collisions', function () {
        const validKey1 = '*2atest*2a';
        const validKey2 = '*test*';

        const escaped1 = CosmosDbKeyEscape.escapeKey(validKey1);
        const escaped2 = CosmosDbKeyEscape.escapeKey(validKey2);

        assert.notEqual(escaped1, escaped2, `${escaped1} should be different that ${escaped2}`);
    });

    it('should truncate longer keys', function () {
        // create an extra long key
        // limit is 255
        const longKey = new Array(300).join('x');
        const fixed = CosmosDbKeyEscape.escapeKey(longKey);

        assert(fixed.length <= 255, 'long key was not properly truncated');
    });

    it('should not truncate short key', function () {
        // create a short key
        const shortKey = new Array(16).join('x');
        const fixed2 = CosmosDbKeyEscape.escapeKey(shortKey);

        assert(fixed2.length === 15, 'short key was truncated improperly');
    });

    it('should create sufficiently different truncated keys of similar origin', function () {
        // create 2 very similar extra long key where the difference will definitely be trimmed off by truncate function
        const longKey = new Array(300).join('x') + '1';
        const longKey2 = new Array(300).join('x') + '2';

        const fixed = CosmosDbKeyEscape.escapeKey(longKey);
        const fixed2 = CosmosDbKeyEscape.escapeKey(longKey2);

        assert(fixed.length !== fixed2, 'key truncation failed to create unique key');
    });

    it('should properly truncate keys with special chars', function () {
        // create a short key
        const longKey = new Array(300).join('*');
        const fixed = CosmosDbKeyEscape.escapeKey(longKey);

        assert(fixed.length <= 255, 'long key with special char was truncated improperly');

        // create a short key
        const shortKey = new Array(16).join('#');
        const fixed2 = CosmosDbKeyEscape.escapeKey(shortKey);

        assert(fixed2.length <= 255, 'short key with special char was truncated improperly');
    });
});
