import assert from 'assert';

import { TestMemoryFork } from './internals/testing/TestMemoryFork';
import { MemoryFork } from './MemoryFork';

describe('MemoryFork', () => {
    let mockMemory: MemoryFork;
    let testMemoryFork: TestMemoryFork;

    beforeEach(() => {
        testMemoryFork = new TestMemoryFork();
        testMemoryFork.setValue('User.userId', '987');
        mockMemory = new MemoryFork(testMemoryFork);
    });

    it('should throw invalid state path error due to many substrings', () => {
        const path = 'random.random.conversationId';
        assert.throws(() => mockMemory.deleteValue(path), new Error(`Invalid state path: ${path}`));
    });

    describe('setValue', () => {
        it('should assign a value to memory, where scope does not yet exist', () => {
            const path = 'Conversation.conversationId';
            mockMemory.setValue(path, '123');
            assert.equal(mockMemory.hasValue(path), true);
            assert.equal(mockMemory.getValue(path), '123');
        });

        it('should assign a value to memory, where scope already exists', () => {
            const pathOne = 'Conversation.conversationId';
            mockMemory.setValue(pathOne, '123');
            const pathTwo = 'Conversation.userId';
            mockMemory.setValue(pathTwo, '432');
            assert.equal(mockMemory.hasValue(pathOne), true);
            assert.equal(mockMemory.hasValue(pathTwo), true);
            assert.equal(mockMemory.getValue(pathOne), '123');
            assert.equal(mockMemory.getValue(pathTwo), '432');
        });
    });

    describe('getValue', () => {
        it('should retrieve existing value from forked memory', () => {
            const path = 'Conversation.conversationId';
            mockMemory.setValue(path, '123');
            assert.equal(mockMemory.getValue(path), '123');
        });

        it('should retrieve value from original memory, where forked memory does not contain specified scope', () => {
            const path = 'User.userId';
            assert.equal(mockMemory.getValue(path), '987');
        });

        it('should retrieve value from original memory, where forked memory does not have specified name', () => {
            const pathOne = 'User.tokenId';
            mockMemory.setValue(pathOne, '432');
            const pathTwo = 'User.userId';
            assert.equal(mockMemory.getValue(pathTwo), '987');
        });

        it('should retrieve value from original memory, where value exists in both original and forked', () => {
            const path = 'User.userId';
            mockMemory.setValue(path, '567');
            assert.equal(mockMemory.getValue(path), '567');
        });

        it('should return null as no value exists in forked and original memory', () => {
            const path = 'Conversation.tokenId';
            assert.equal(mockMemory.getValue(path), null);
        });
    });

    describe('hasValue', () => {
        it('should check value from original memory, where forked memory does not contain specified scope', () => {
            const path = 'User.userId';
            assert.equal(mockMemory.hasValue(path), true);
        });

        it('should check value from original memory, where forked memory does not have specified name', () => {
            const pathOne = 'Conversation.conversationId';
            mockMemory.setValue(pathOne, '123');
            const pathTwo = 'Conversation.tokenId';
            assert.equal(mockMemory.hasValue(pathTwo), false);
        });

        it('should check non-existing value from original memory, where scope exists', () => {
            const path = 'User.tokenId';
            assert.equal(mockMemory.hasValue(path), false);
        });

        it('should check non-existing value from original memory, where scope does not exist', () => {
            const path = 'Conversation.tokenId';
            assert.equal(mockMemory.hasValue(path), false);
        });

        it('should perform a check using defaulted temp scope', () => {
            const path = 'conversationId';
            assert.equal(mockMemory.hasValue(path), false);
        });
    });

    describe('deleteValue', () => {
        it('should delete the value from forked memory', () => {
            const path = 'Conversation.conversationId';
            mockMemory.setValue(path, '123');
            mockMemory.deleteValue(path);
            assert.equal(mockMemory.hasValue(path), false);
        });

        it('should delete the defaulted temp scope and name value from forked memory', () => {
            const path = 'conversationId';
            mockMemory.setValue(path, '123');
            mockMemory.deleteValue(path);
            assert.equal(mockMemory.hasValue(path), false);
        });

        it('should delete and check a non-existing value from forked memory, where scope does not exist', () => {
            const pathTwo = 'User.conversationId';
            mockMemory.deleteValue(pathTwo);
            assert.equal(mockMemory.hasValue(pathTwo), false);
        });

        it('should delete and check a non-existing value from forked memory, where name does not exist', () => {
            const pathOne = 'Conversation.conversationId';
            mockMemory.setValue(pathOne, '123');
            const pathTwo = 'Conversation.tokenId';
            mockMemory.deleteValue(pathTwo);
            assert.equal(mockMemory.hasValue(pathTwo), false);
        });
    });
});

describe('TestMemoryFork', () => {
    let testMemoryFork: TestMemoryFork;

    beforeEach(() => {
        testMemoryFork = new TestMemoryFork();
        testMemoryFork.setValue('User.userId', '123');
    });

    it('should throw invalid state path error due to many substrings', () => {
        const path = 'random.random.conversationId';
        assert.throws(() => testMemoryFork.deleteValue(path), new Error(`Invalid state path: ${path}`));
    });

    it('should assign a new value where scope already exists', () => {
        const path = 'User.conversationId';
        testMemoryFork.setValue(path, '987');
        assert.equal(testMemoryFork.hasValue(path), true);
    });

    it('should retrieve an existing value', () => {
        const path = 'User.userId';
        assert.equal(testMemoryFork.getValue(path), '123');
    });

    it('should return null for non-existing value', () => {
        const path = 'User.tokenId';
        assert.equal(testMemoryFork.getValue(path), null);
    });

    it('should return true for checking an existing value', () => {
        const path = 'User.userId';
        assert.equal(testMemoryFork.hasValue(path), true);
    });

    it('should return false for checking a non-existent value, where name does not exist', () => {
        const path = 'User.tokenId';
        assert.equal(testMemoryFork.hasValue(path), false);
    });

    it('should check and delete an existing value', () => {
        const path = 'User.userId';
        testMemoryFork.deleteValue(path);
        assert.equal(testMemoryFork.hasValue(path), false);
    });

    it('should check and delete a non-existing value', () => {
        const path = 'Temp.userId';
        testMemoryFork.deleteValue(path);
        assert.equal(testMemoryFork.hasValue(path), false);
    });
});
