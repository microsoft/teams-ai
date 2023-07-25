const { MemoryTranscriptStore } = require('../');

const assert = require('assert');
const base = require('./transcriptStoreBaseTest');

const testStorage = function () {
    const storage = new MemoryTranscriptStore();

    it('bad args', async function () {
        const messages = await base._badArgs(storage);
        assert(messages.every((message) => message.startsWith('expected error')));
    });

    it('log activity', async function () {
        await assert.doesNotReject(base._logActivity(storage));
    });

    it('logs multiple activities', async function () {
        await assert.doesNotReject(base._logMultipleActivities(storage));
    });

    it('delete transcript', async function () {
        await assert.doesNotReject(base._deleteTranscript(storage));
    });

    it('get transcript activities', async function () {
        await assert.doesNotReject(base._getTranscriptActivities(storage));
    });

    it('get transcript activities with state date', async function () {
        await assert.doesNotReject(base._getTranscriptActivitiesStartDate(storage));
    });

    it('list transcripts', async function () {
        await assert.doesNotReject(base._listTranscripts(storage));
    });
};

describe('MemoryTranscriptStore', function () {
    this.timeout(10000);
    testStorage();
});
