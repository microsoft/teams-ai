const assert = require('assert');
const { ActivityTypes } = require('../');

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function createActivities(conversationId, ts, count = 5) {
    const activities = [];
    for (let i = 1; i <= count; i++) {
        activities.push({
            type: ActivityTypes.Message,
            timestamp: ts,
            id: uuid(),
            text: i.toString(),
            channelId: 'test',
            from: { id: `User${i}` },
            conversation: { id: conversationId },
            recipient: { id: 'Bot1', name: '2' },
            serviceUrl: 'http://foo.com/api/messages',
        });
        ts = new Date(ts.getTime() + 60000);

        activities.push({
            type: ActivityTypes.Message,
            timestamp: ts,
            id: uuid(),
            text: i.toString(),
            channelId: 'test',
            from: { id: 'Bot1', name: '2' },
            conversation: { id: conversationId },
            recipient: { id: `User${i}` },
            serviceUrl: 'http://foo.com/api/messages',
        });
        ts = new Date(ts.getTime() + 60000);
    }
    return activities;
}

function group(array, size) {
    return array.reduce((acc, x, i) => {
        if (i % size) {
            acc[acc.length - 1].push(x);
        } else {
            acc.push([x]);
        }
        return acc;
    }, []);
}

function promiseSeq(promiseFuncArray) {
    return promiseFuncArray.reduce((chain, promiseFunc) => {
        return chain.then((chainResult) => promiseFunc().then((currentResult) => [...chainResult, currentResult]));
    }, Promise.resolve([]));
}

function promiseParallel(promiseFuncArray) {
    return Promise.all(promiseFuncArray.map((promiseFunc) => promiseFunc()));
}

function resolvePromises(promiseFuncArray, useParallel = true) {
    return useParallel ? promiseParallel(promiseFuncArray) : promiseSeq(promiseFuncArray);
}

function dateSorter(a, b) {
    return a.timestamp.getTime() - b.timestamp.getTime();
}

exports._badArgs = function _badArgs(store) {
    const assertPromise = (promiseFunc, errMessage) =>
        new Promise((resolve, reject) => {
            try {
                promiseFunc().then(() => reject(errMessage));
            } catch {
                resolve('expected error');
            }
        });

    return Promise.all([
        assertPromise(() => store.logActivity(null), 'logActivity should have thrown error about missing activity'),
        assertPromise(
            () => store.getTranscriptActivities(null, null),
            'getTranscriptActivities should have thrown error about missing channelId'
        ),
        assertPromise(
            () => store.getTranscriptActivities('foo', null),
            'getTranscriptActivities should have thrown error about missing conversationId'
        ),
        assertPromise(
            () => store.listTranscripts(null),
            'listTranscripts should have thrown error about missing channelId'
        ),
        assertPromise(
            () => store.deleteTranscript(null, null),
            'deleteTranscript should have thrown error about missing channelId'
        ),
        assertPromise(
            () => store.deleteTranscript('foo', null),
            'deleteTranscript should have thrown error about missing conversationId'
        ),
    ]);
};

exports._logActivity = function _logActivity(store) {
    const conversationId = '_logActivity';
    const date = new Date();
    const activity = createActivities(conversationId, date, 1).pop();

    return store
        .logActivity(activity)
        .then(() => store.getTranscriptActivities('test', conversationId))
        .then((result) => {
            assert.equal(result.items.length, 1);
            assert.equal(JSON.stringify(result.items[0]), JSON.stringify(activity));
        });
};

exports._logMultipleActivities = function _logMultipleActivities(store, useParallel = true) {
    const conversationId = '_logMultipleActivities';
    const start = new Date();
    const activities = createActivities(conversationId, start);

    // log activities
    const writes = activities.map((a) => () => store.logActivity(a));

    // wait for all logs
    return resolvePromises(writes, useParallel).then(() => {
        // group the different queries into promises
        return Promise.all([
            // make sure other channels and conversations don't return results
            store.getTranscriptActivities('bogus', conversationId).then((pagedResult) => {
                assert(!pagedResult.continuationToken);
                assert.equal(pagedResult.items.length, 0);
            }),
            // make sure other channels and conversations don't return results
            store.getTranscriptActivities('test', 'bogus').then((pagedResult) => {
                assert(!pagedResult.continuationToken);
                assert.equal(pagedResult.items.length, 0);
            }),
            // make sure all created activities where persisted
            store.getTranscriptActivities('test', conversationId).then((pagedResult) => {
                assert(!pagedResult.continuationToken);
                assert.equal(pagedResult.items.length, activities.length);

                // assert all are equal
                assert.equal(JSON.stringify(pagedResult.items.sort(dateSorter)), JSON.stringify(activities));
            }),
            // assert half page, get activities +5 minutes
            store
                .getTranscriptActivities('test', conversationId, null, new Date(start.getTime() + 60000 * 5))
                .then((pagedResult) => {
                    assert.equal(activities.length / 2, pagedResult.items.length);
                    const expected = activities.slice(5);
                    assert.equal(JSON.stringify(pagedResult.items.sort(dateSorter)), JSON.stringify(expected));
                }),
        ]);
    });
};

exports._deleteTranscript = function _deleteTranscript(store, useParallel = true) {
    const conversationId = '_deleteConversation';
    const conversationId2 = '_deleteConversation2';
    const start = new Date();
    const activities = createActivities(conversationId, start);
    const activities2 = createActivities(conversationId2, start);

    // log all activities
    const writes = activities.concat(activities2).map((a) => () => store.logActivity(a));

    // wait for all writes
    return resolvePromises(writes, useParallel).then(() => {
        return Promise.all([
            // test A
            store.getTranscriptActivities('test', conversationId).then((pagedResult) => {
                assert.equal(pagedResult.items.length, activities.length);
                // delete!
                store.deleteTranscript('test', conversationId).then(() => {
                    return Promise.all([
                        // check deleted
                        store.getTranscriptActivities('test', conversationId).then((pagedResult) => {
                            assert.equal(pagedResult.items.length, 0);
                        }),
                        // check second transcript still exists
                        store.getTranscriptActivities('test', conversationId2).then((pagedResult) => {
                            assert.equal(pagedResult.items.length, activities2.length);
                        }),
                    ]);
                });
            }),
            // test B
            store.getTranscriptActivities('test', conversationId2).then((pagedResult) => {
                assert.equal(pagedResult.items.length, activities2.length);
            }),
        ]);
    });
};

exports._getTranscriptActivities = function _getTranscriptActivities(store, useParallel = true) {
    return new Promise((resolve, reject) => {
        const conversationId = '_getTranscriptActivitiesPaging';
        const date = new Date();
        const activities = createActivities(conversationId, date, 50);
        // log in parallel batches of 10
        const groups = group(activities, 10);
        return promiseSeq(
            groups.map((group) => () =>
                resolvePromises(
                    group.map((item) => () => store.logActivity(item)),
                    useParallel
                )
            )
        )
            .then(async () => {
                let actualPageSize = 0;
                let pagedResult = {};
                const seen = [];
                do {
                    pagedResult = await store.getTranscriptActivities(
                        'test',
                        conversationId,
                        pagedResult.continuationToken
                    );
                    assert(pagedResult);
                    assert(pagedResult.items);

                    if (!actualPageSize) {
                        actualPageSize = pagedResult.items.length;
                    } else if (actualPageSize === pagedResult.items.length) {
                        assert(pagedResult.continuationToken);
                    }
                    pagedResult.items.forEach((item) => {
                        assert(!seen.includes(item.id));
                        seen.push(item.id);
                    });
                } while (pagedResult.continuationToken);
                assert.equal(seen.length, activities.length);
                activities.forEach((activity) => assert(seen.includes(activity.id)));
                resolve();
            })
            .catch((error) => reject(error));
    });
};

exports._getTranscriptActivitiesStartDate = function _getTranscriptActivitiesStartDate(store, useParallel = true) {
    return new Promise((resolve, reject) => {
        const conversationId = '_getTranscriptActivitiesStartDate';
        const date = new Date();
        const activities = createActivities(conversationId, date, 50);
        // log in parallel batches of 10
        const groups = group(activities, 10);
        return promiseSeq(
            groups.map((group) => () =>
                resolvePromises(
                    group.map((item) => () => store.logActivity(item)),
                    useParallel
                )
            )
        )
            .then(async () => {
                let actualPageSize = 0;
                let pagedResult = {};
                const seen = [];
                const referenceDate = new Date(date.getTime() + 50 * 60 * 1000);
                do {
                    pagedResult = await store.getTranscriptActivities(
                        'test',
                        conversationId,
                        pagedResult.continuationToken,
                        referenceDate
                    );
                    assert(pagedResult);
                    assert(pagedResult.items);

                    if (!actualPageSize) {
                        actualPageSize = pagedResult.items.length;
                    } else if (actualPageSize === pagedResult.items.length) {
                        assert(pagedResult.continuationToken);
                    }
                    pagedResult.items.forEach((item) => {
                        assert(!seen.includes(item.id));
                        seen.push(item.id);
                    });
                } while (pagedResult.continuationToken);
                assert.equal(seen.length, activities.length / 2);
                activities
                    .filter((a) => a.timestamp.getTime() >= referenceDate.getTime())
                    .forEach((activity) => assert(seen.includes(activity.id)));
                activities
                    .filter((a) => a.timestamp.getTime() < referenceDate.getTime())
                    .forEach((activity) => assert(!seen.includes(activity.id)));
                resolve();
            })
            .catch((error) => reject(error));
    });
};

exports._listTranscripts = function _listTranscripts(store, useParallel = true) {
    return new Promise((resolve, reject) => {
        const conversationIds = [];
        const start = new Date();
        for (let i = 1; i <= 100; i++) {
            conversationIds.push(`_ListConversations${i}`);
        }

        const activities = [].concat(...conversationIds.map((cId) => createActivities(cId, start, 1)));

        // log in parallel batches of 10
        const groups = group(activities, 10);
        return promiseSeq(
            groups.map((group) => () =>
                resolvePromises(
                    group.map((item) => () => store.logActivity(item)),
                    useParallel
                )
            )
        )
            .then(async () => {
                let actualPageSize = 0;
                let pagedResult = {};
                const seen = [];
                do {
                    pagedResult = await store.listTranscripts('test', pagedResult.continuationToken);
                    assert(pagedResult);
                    assert(pagedResult.items);

                    if (!actualPageSize) {
                        actualPageSize = pagedResult.items.length;
                    } else if (actualPageSize === pagedResult.items.length) {
                        assert(pagedResult.continuationToken);
                    }
                    pagedResult.items.forEach((item) => {
                        assert(!seen.includes(item.id));
                        if (item.id.startsWith('_ListConversations')) {
                            seen.push(item.id);
                        }
                    });
                } while (pagedResult.continuationToken);
                assert.equal(seen.length, conversationIds.length);
                conversationIds.forEach((cId) => assert(seen.includes(cId)));
                resolve();
            })
            .catch((error) => reject(error));
    });
};
