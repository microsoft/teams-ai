const assert = require('assert');
const { StringUtils } = require('../');

const test1 = 'asdlfkjasdflkjasdlfkjasldkfjasdf';
const test2 = 'alskjdf lksjfd laksjdf lksjdfasdlfkjasdflkjasdlfkjasldkfjasdf';

describe('StringUtils', function () {
    this.timeout(5000);

    it('test hash', function () {
        let hash1 = StringUtils.hash(test1);
        let hash2 = StringUtils.hash(test1);
        assert(hash1);
        assert(hash2);
        assert.notEqual(test1, hash1, 'hash should be different');
        assert.equal(hash1, hash2, 'hashes for same strings should be same');

        hash1 = StringUtils.hash(test1);
        hash2 = StringUtils.hash(test2);
        assert(hash1);
        assert(hash2);
        assert.notEqual(test1, hash1, 'hash should be different');
        assert.notEqual(test2, hash1, 'hash should be different');
        assert.notEqual(hash1, hash2, 'hashes for different strings should be different');

        hash1 = StringUtils.hash(test1.toUpperCase());
        hash2 = StringUtils.hash(test1);
        assert(hash1);
        assert(hash2);
        assert.notEqual(hash1, hash2, 'case changes string should be different');
    });

    it('test ellipsis', function () {
        assert.equal(StringUtils.ellipsis(test1, 0), '...');
        assert.equal(StringUtils.ellipsis(test1, 5), `${test1.substr(0, 5)}...`);
        assert.equal(StringUtils.ellipsis(test1, 1000), test1);
    });

    it('test ellipsis hash', function () {
        const hash1 = StringUtils.hash(test1);
        assert.equal(StringUtils.ellipsisHash(test1, 0), `...${hash1}`);
        assert.equal(StringUtils.ellipsisHash(test1, 5), `${test1.substr(0, 5)}...${hash1}`);
        assert.equal(StringUtils.ellipsisHash(test1, 1000), test1);
    });
});
