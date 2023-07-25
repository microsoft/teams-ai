const assert = require('assert');
const { BrowserLocalStorage, BrowserSessionStorage } = require('../');

function testStorage(storage) {
    it('read of unknown key', async function () {
        const result = await storage.read(['unk']);
        assert(result != null, 'result should be object');
        assert(result.unk === undefined, 'key should be undefined');
    });

    it('key creation', async function () {
        await storage.write({ keyCreate: { count: 1 } });
        const result = await storage.read(['keyCreate']);
        assert(result != null, 'result should be object');
        assert(result.keyCreate != null, 'keyCreate should be defined');
        assert(result.keyCreate.count === 1, 'object should have count of 1');
        assert(result.keyCreate.eTag, 'ETag should be defined');
    });

    it('key update', async function () {
        await storage.write({ keyUpdate: { count: 1 } });

        const result = await storage.read(['keyUpdate']);
        result.keyUpdate.count = 2;
        await storage.write(result);

        const updated = await storage.read(['keyUpdate']);
        assert(updated.keyUpdate.count === 2, 'object should be updated');
        assert(updated.keyUpdate.eTag !== result.keyUpdate.eTag, 'Etag should be updated on write');
    });

    it('invalid eTag', async function () {
        await storage.write({ keyUpdate2: { count: 1 } });

        const result = await storage.read(['keyUpdate2']);
        result.keyUpdate2.count = 2;
        result.keyUpdate2.eTag = -1;

        await assert.rejects(storage.write(result), Error('Storage: error writing "keyUpdate2" due to eTag conflict.'));
    });

    it('wildcard eTag', async function () {
        await storage.write({ keyUpdate3: { count: 1 } });

        const result = await storage.read(['keyUpdate3']);
        result.keyUpdate3.eTag = '*';
        result.keyUpdate3.count = 2;

        await storage.write(result);
        result.keyUpdate3.count = 3;

        await assert.doesNotReject(storage.write(result));
    });

    it('delete unknown', async function () {
        await assert.doesNotReject(storage.delete(['unknown']));
    });

    it('delete known', async function () {
        await storage.write({ delete1: { count: 1 } });
        await storage.delete(['delete1']);
        const result = storage.read(['delete1']);

        if (result.delete1) {
            console.log(JSON.stringify(result.delete1));
        }
        assert(!result.delete1, 'delete1 should not be found');
    });

    it('batch operations', async function () {
        await storage.write({
            batch1: { count: 10 },
            batch2: { count: 20 },
            batch3: { count: 30 },
        });

        const result = await storage.read(['batch1', 'batch2', 'batch3']);

        assert(result.batch1 != null, 'batch1 should exist and doesnt');
        assert(result.batch2 != null, 'batch2 should exist and doesnt');
        assert(result.batch3 != null, 'batch3 should exist and doesnt');
        assert(result.batch1.count > 0, 'batch1 should have count and doesnt');
        assert(result.batch2.count > 0, 'batch2 should have count and doesnt');
        assert(result.batch3.count > 0, 'batch3 should have count  and doesnt');
        assert(result.batch1.eTag != null, 'batch1 should have etag and doesnt');
        assert(result.batch2.eTag != null, 'batch2 should have etag and doesnt');
        assert(result.batch3.eTag != null, 'batch3 should have etag  and doesnt');

        await storage.delete(['batch1', 'batch2', 'batch3']);
        const result2 = await storage.read(['batch1', 'batch2', 'batch3']);

        assert(!result2.batch1, 'batch1 should not exist and does');
        assert(!result2.batch2, 'batch2 should not exist and does');
        assert(!result2.batch3, 'batch3 should not exist and does');
    });

    it('crazy keys work', async function () {
        const obj = {};
        const crazyKey = '!@#$%^&*()_+??><":QASD~`';
        obj[crazyKey] = { count: 1 };

        await storage.write(obj);
        const result = await storage.read([crazyKey]);

        assert(result != null, 'result should be object');
        assert(result[crazyKey], 'crazyKey should be defined');
        assert(result[crazyKey].count === 1, 'object should have count of 1');
        assert(result[crazyKey].eTag, 'ETag should be defined');
    });
}

global.localStorage = {};
describe('BrowserLocalStorage', function () {
    testStorage(new BrowserLocalStorage());
});

global.sessionStorage = {};
describe('BrowserSessionStorage', function () {
    testStorage(new BrowserSessionStorage());
});
