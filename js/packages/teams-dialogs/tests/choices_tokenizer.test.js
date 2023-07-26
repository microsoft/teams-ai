const assert = require('assert');
const { defaultTokenizer } = require('../');

function assertToken(token, start, end, text, normalized) {
    assert(token.start === start, `Invalid token.start of '${token.start}' for '${text}' token.`);
    assert(token.end === end, `Invalid token.end of '${token.end}' for '${text}' token.`);
    assert(token.text === text, `Invalid token.text of '${token.text}' for '${text}' token.`);
    assert(
        token.normalized === normalized || text,
        `Invalid token.normalized of '${token.normalized}' for '${text}' token.`
    );
}

describe('defaultTokenizer()', function () {
    this.timeout(5000);

    it('should break on spaces.', function () {
        const tokens = defaultTokenizer('how now brown cow');
        assert(tokens.length === 4);
        assertToken(tokens[0], 0, 2, 'how');
        assertToken(tokens[1], 4, 6, 'now');
        assertToken(tokens[2], 8, 12, 'brown');
        assertToken(tokens[3], 14, 16, 'cow');
    });

    it('should break on punctuation.', function () {
        const tokens = defaultTokenizer('how-now.brown:cow?');
        assert(tokens.length === 4);
        assertToken(tokens[0], 0, 2, 'how');
        assertToken(tokens[1], 4, 6, 'now');
        assertToken(tokens[2], 8, 12, 'brown');
        assertToken(tokens[3], 14, 16, 'cow');
    });

    it('should tokenize single character tokens.', function () {
        const tokens = defaultTokenizer('a b c d');
        assert(tokens.length === 4);
        assertToken(tokens[0], 0, 0, 'a');
        assertToken(tokens[1], 2, 2, 'b');
        assertToken(tokens[2], 4, 4, 'c');
        assertToken(tokens[3], 6, 6, 'd');
    });

    it('should return a single token.', function () {
        const tokens = defaultTokenizer('food');
        assert(tokens.length === 1);
        assertToken(tokens[0], 0, 3, 'food');
    });

    it('should return no tokens.', function () {
        const tokens = defaultTokenizer('.?;-()');
        assert(tokens.length === 0);
    });

    it('should return a the normalized and original text for a token.', function () {
        const tokens = defaultTokenizer('fOoD');
        assert(tokens.length === 1);
        assertToken(tokens[0], 0, 3, 'fOoD', 'food');
    });

    it('should break on emojis.', function () {
        const tokens = defaultTokenizer('food 💥👍😀');
        assert(tokens.length === 4);
        assertToken(tokens[0], 0, 3, 'food');
        assertToken(tokens[1], 5, 6, '💥');
        assertToken(tokens[2], 7, 8, '👍');
        assertToken(tokens[3], 9, 10, '😀');
    });
});
