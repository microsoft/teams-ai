const assert = require('assert');
const { BlobStorage } = require('../');
const { StorageBaseTests } = require('../../botbuilder-core/tests/storageBaseTests');
const azure = require('azure-storage');
const { MockMode, usingNock } = require('./mockHelper.js');
const nock = require('nock');
const fs = require('fs');
const flow = require('lodash/fp/flow');

/**
 * @param mode controls the nock mode used for the tests. Available options found in ./mockHelper.js.
 */
const mode = process.env.MOCK_MODE || MockMode.lockdown;

const emulatorPath = 'C:/Program Files (x86)/Microsoft Azure Storage Explorer/StorageExplorer.exe';

const getSettings = (container = null) => ({
    storageAccountOrConnectionString: 'UseDevelopmentStorage=true;',
    containerName: container || 'test',
});

const reset = (done) => {
    nock.cleanAll();
    nock.enableNetConnect();
    if (mode !== MockMode.lockdown) {
        const settings = getSettings();
        const client = azure.createBlobService(settings.storageAccountOrConnectionString, settings.storageAccessKey);
        client.deleteContainerIfExists(settings.containerName, (_err, _result) => done());
    } else {
        done();
    }
};

const checkEmulator = () => {
    if (!fs.existsSync(emulatorPath)) {
        console.warn(
            'These tests require Azure Storage Emulator! go to https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator#get-the-storage-emulator to download and install.'
        );
    }
    return true;
};

const storage = new BlobStorage(getSettings());

describe('BlobStorage - Constructor', function () {
    before('cleanup', reset);
    after('cleanup', reset);

    it('missing settings should throw error', function () {
        assert.throws(() => new BlobStorage(), Error, 'constructor should have thrown error about missing settings.');
    });

    it('Invalid container name should throw error', function () {
        assert.throws(
            () => new BlobStorage(getSettings('invalid--name')),
            Error,
            'constructor should have thrown error about invalid container name.'
        );
    });
});

describe('BlobStorage - Base Storage Tests', function () {
    before(
        'cleanup',
        flow(() => reset, checkEmulator)
    );
    after('cleanup', reset);

    it('return empty object when reading unknown key', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.returnEmptyObjectWhenReadingUnknownKey(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('throws when reading null keys', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.handleNullKeysWhenReading(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('throws when writing null keys', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.handleNullKeysWhenWriting(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('does not throw when writing no items', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.doesNotThrowWhenWritingNoItems(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('create an object', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.createObject(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('handle crazy keys', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.handleCrazyKeys(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('update an object', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.updateObject(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('delete an object', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.deleteObject(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('does not throw when deleting an unknown object', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.deleteUnknownObject(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('performs batch operations', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.performBatchOperations(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });

    it('proceeds through a waterfall dialog', async function () {
        const { nockDone } = await usingNock(this.test, mode);
        const testRan = await StorageBaseTests.proceedsThroughWaterfall(storage);

        assert.strictEqual(testRan, true);
        nockDone();
    });
});
