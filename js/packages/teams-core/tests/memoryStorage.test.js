const assert = require('assert');
const { MemoryStorage } = require('../');
const { StorageBaseTests } = require('../../botbuilder-core/tests/storageBaseTests');

function testStorage(storage) {
    it('return empty object when reading unknown key', async function () {
        const testRan = await StorageBaseTests.returnEmptyObjectWhenReadingUnknownKey(storage);

        assert.strictEqual(testRan, true);
    });

    it('throws when reading null keys', async function () {
        const testRan = await StorageBaseTests.handleNullKeysWhenReading(storage);

        assert.strictEqual(testRan, true);
    });

    it('throws when writing null keys', async function () {
        const testRan = await StorageBaseTests.handleNullKeysWhenWriting(storage);

        assert.strictEqual(testRan, true);
    });

    it('does not throw when writing no items', async function () {
        const testRan = await StorageBaseTests.doesNotThrowWhenWritingNoItems(storage);

        assert.strictEqual(testRan, true);
    });

    it('create an object', async function () {
        const testRan = await StorageBaseTests.createObject(storage);

        assert.strictEqual(testRan, true);
    });

    it('handle crazy keys', async function () {
        const testRan = await StorageBaseTests.handleCrazyKeys(storage);

        assert.strictEqual(testRan, true);
    });

    it('update an object', async function () {
        const testRan = await StorageBaseTests.updateObject(storage);

        assert.strictEqual(testRan, true);
    });

    it('delete an object', async function () {
        const testRan = await StorageBaseTests.deleteObject(storage);

        assert.strictEqual(testRan, true);
    });

    it('does not throw when deleting an unknown object', async function () {
        const testRan = await StorageBaseTests.deleteUnknownObject(storage);

        assert.strictEqual(testRan, true);
    });

    it('performs batch operations', async function () {
        const testRan = await StorageBaseTests.performBatchOperations(storage);

        assert.strictEqual(testRan, true);
    });

    it('proceeds through a waterfall dialog', async function () {
        const testRan = await StorageBaseTests.proceedsThroughWaterfall(storage);

        assert.strictEqual(testRan, true);
    });
}

describe('MemoryStorage - Empty', function () {
    testStorage(new MemoryStorage());
});

describe('MemoryStorage - PreExisting', function () {
    const dictionary = { test: JSON.stringify({ counter: 12 }) };
    const storage = new MemoryStorage(dictionary);
    testStorage(storage);

    it('should still have test', function () {
        return storage.read(['test']).then((result) => {
            assert(result.test.counter == 12, 'read()  test.counter should be 12');
        });
    });
});
