// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const { ReadReceiptInfo } = require('../..');

describe('ReadReceiptInfo', function () {
    const testCases = [
        { title: 'compare msg equal to last', compare: '1000', lastRead: '1000', isRead: true },
        { title: 'compare msg < than last', compare: '1000', lastRead: '1001', isRead: true },
        { title: 'compare msg > than last', compare: '1001', lastRead: '1000', isRead: false },
        { title: 'null compare msg', compare: null, lastRead: '1000', isRead: false },
        { title: 'null last msg', compare: '1000', lastRead: null, isRead: false },
    ];

    testCases.map((testData) => {
        it(testData.title, function () {
            const readReceipt = new ReadReceiptInfo(testData.lastRead);

            assert.strictEqual(readReceipt.lastReadMessageId, testData.lastRead);
            assert.strictEqual(readReceipt.isMessageRead(testData.compare), testData.isRead);
            assert.strictEqual(ReadReceiptInfo.isMessageRead(testData.compare, testData.lastRead), testData.isRead);
        });
    });
});
