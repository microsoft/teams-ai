const assert = require('assert');
const { AutoSaveStateMiddleware, ConversationState, MemoryStorage, MessageFactory, TestAdapter } = require('../lib');
const { Dialog, DialogSet, TextPrompt, WaterfallDialog } = require('../../botbuilder-dialogs/lib');
const { BlobStorage, CosmosDbPartitionedStorage } = require('../../botbuilder-azure/lib');

/**
 * Base tests that all storage providers should implement in their own tests.
 * They handle the storage-based assertions, internally.
 *
 * All tests return true if assertions pass to indicate that the code ran to completion, passing internal assertions.
 * Therefore, all tests using theses static tests should strictly check that the method returns true.
 *
 * @example
 * const testRan = await StorageBaseTests.returnEmptyObjectWhenReadingUnknownKey(storage);
 * assert.strictEqual(testRan, true);
 */
class StorageBaseTests {
    static async returnEmptyObjectWhenReadingUnknownKey(storage) {
        const result = await storage.read(['unknown']);

        if (storage instanceof BlobStorage) {
            assert.ok(result.undefined);
            assert.strictEqual(Object.keys(result.undefined).length, 0);
        } else {
            assert.notStrictEqual(result, null);
            assert.strictEqual(Object.keys(result).length, 0);
        }

        return true;
    }

    static async handleNullKeysWhenReading(storage) {
        if (storage instanceof BlobStorage) {
            await assert.rejects(
                async () => await storage.read(null),
                new Error('Please provide at least one key to read from storage.')
            );
        } else if (storage instanceof CosmosDbPartitionedStorage || storage instanceof MemoryStorage) {
            await assert.rejects(
                async () => await storage.read(null),
                ReferenceError('Keys are required when reading.')
            );
            // CosmosDbStorage and catch-all
        } else {
            const result = await storage.read(null);
            assert.strictEqual(Object.keys(result).length, 0);
        }

        return true;
    }

    static async handleNullKeysWhenWriting(storage) {
        if (storage instanceof BlobStorage) {
            await assert.rejects(
                async () => await storage.write(null),
                new Error('Please provide a StoreItems with changes to persist.')
            );
        } else if (storage instanceof CosmosDbPartitionedStorage || storage instanceof MemoryStorage) {
            await assert.rejects(
                async () => await storage.write(null),
                ReferenceError('Changes are required when writing.')
            );
            // CosmosDbStorage and catch-all
        } else {
            const result = await storage.write(null);
            assert.strictEqual(result, undefined);
        }

        return true;
    }

    static async doesNotThrowWhenWritingNoItems(storage) {
        await assert.doesNotReject(async () => await storage.write([]));

        return true;
    }

    static async createObject(storage) {
        const storeItems = {
            createPoco: { id: 1 },
            createPocoStoreItem: { id: 2 },
        };

        await storage.write(storeItems);

        const readStoreItems = await storage.read(Object.keys(storeItems));

        assert.strictEqual(storeItems.createPoco.id, readStoreItems.createPoco.id);
        assert.strictEqual(storeItems.createPocoStoreItem.id, readStoreItems.createPocoStoreItem.id);
        assert.notStrictEqual(readStoreItems.createPoco.eTag, null);
        assert.notStrictEqual(readStoreItems.createPocoStoreItem.eTag, null);

        return true;
    }

    static async handleCrazyKeys(storage) {
        const key = '!@#$%^&*()~/\\><,.?\';"`~';
        const storeItem = { id: 1 };
        const storeItems = { [key]: storeItem };

        await storage.write(storeItems);

        const readStoreItems = await storage.read(Object.keys(storeItems));

        assert.notStrictEqual(readStoreItems[key], null);
        assert.strictEqual(readStoreItems[key].id, 1);

        return true;
    }

    static async updateObject(storage) {
        const originalStoreItems = {
            pocoItem: { id: 1, count: 1 },
            pocoStoreItem: { id: 1, count: 1 },
        };

        // first write should work
        await storage.write(originalStoreItems);

        const loadedStoreItems = await storage.read(['pocoItem', 'pocoStoreItem']);

        const updatePocoItem = loadedStoreItems.pocoItem;
        delete updatePocoItem.eTag; // pocoItems don't have eTag
        const updatePocoStoreItem = loadedStoreItems.pocoStoreItem;
        assert.notStrictEqual(updatePocoStoreItem.eTag, null);

        // 2nd write should work
        updatePocoItem.count++;
        updatePocoStoreItem.count++;

        await storage.write(loadedStoreItems);

        const reloadedStoreItems = await storage.read(Object.keys(loadedStoreItems));

        const reloadedUpdatePocoItem = reloadedStoreItems.pocoItem;
        const reloadedUpdatePocoStoreItem = reloadedStoreItems.pocoStoreItem;

        assert.notStrictEqual(reloadedUpdatePocoItem.eTag, null);
        assert.notStrictEqual(updatePocoStoreItem.eTag, reloadedUpdatePocoStoreItem.eTag);
        assert.strictEqual(reloadedUpdatePocoItem.count, 2);
        assert.strictEqual(reloadedUpdatePocoStoreItem.count, 2);

        // Write with old eTag should succeed for non-storeitem
        updatePocoItem.count = 123;

        await assert.doesNotReject(storage.write({ pocoItem: updatePocoItem }));

        // Write with old eTag should FAIL for storeItem
        updatePocoStoreItem.count = 123;
        await assert.rejects(storage.write({ pocoStoreItem: updatePocoStoreItem }));

        const reloadedStoreItems2 = await storage.read(['pocoItem', 'pocoStoreItem']);

        const reloadedPocoItem2 = reloadedStoreItems2.pocoItem;
        delete reloadedPocoItem2.eTag;
        const reloadedPocoStoreItem2 = reloadedStoreItems2.pocoStoreItem;

        assert.strictEqual(reloadedPocoItem2.count, 123);
        assert.strictEqual(reloadedPocoStoreItem2.count, 2);

        // write with wildcard etag should work
        reloadedPocoItem2.count = 100;
        reloadedPocoStoreItem2.count = 100;
        reloadedPocoStoreItem2.eTag = '*';

        const wildcardEtagdict = {
            pocoItem: reloadedPocoItem2,
            pocoStoreItem: reloadedPocoStoreItem2,
        };

        await storage.write(wildcardEtagdict);

        const reloadedStoreItems3 = await storage.read(['pocoItem', 'pocoStoreItem']);

        assert.strictEqual(reloadedStoreItems3.pocoItem.count, 100);
        assert.strictEqual(reloadedStoreItems3.pocoStoreItem.count, 100);

        const finalStoreItems = await storage.read(['pocoItem', 'pocoStoreItem']);
        assert.strictEqual(finalStoreItems.pocoItem.count, 100);
        assert.strictEqual(finalStoreItems.pocoStoreItem.count, 100);

        return true;
    }

    static async deleteObject(storage) {
        const storeItems = {
            delete1: { id: 1, count: 1 },
        };

        await storage.write(storeItems);

        const readStoreItems = await storage.read(['delete1']);

        assert.notStrictEqual(readStoreItems.delete1.eTag, null);
        assert.strictEqual(readStoreItems.delete1.count, 1);

        await storage.delete(['delete1']);

        const reloadedStoreItems = await storage.read(['delete1']);

        assert.strictEqual(reloadedStoreItems.delete1, undefined);

        return true;
    }

    static async deleteUnknownObject(storage) {
        await assert.doesNotReject(async () => {
            await storage.delete(['unknown_key']);
        });

        return true;
    }

    static async performBatchOperations(storage) {
        await storage.write({
            batch1: { count: 10 },
            batch2: { count: 20 },
            batch3: { count: 30 },
        });

        let result = await storage.read(['batch1', 'batch2', 'batch3']);

        assert.notStrictEqual(result.batch1, null);
        assert.notStrictEqual(result.batch2, null);
        assert.notStrictEqual(result.batch3, null);
        assert(result.batch1.count > 0);
        assert(result.batch2.count > 0);
        assert(result.batch3.count > 0);
        assert.notStrictEqual(result.batch1.eTag, null);
        assert.notStrictEqual(result.batch2.eTag, null);
        assert.notStrictEqual(result.batch3.eTag, null);

        await storage.delete(['batch1', 'batch2', 'batch3']);

        result = await storage.read(['batch1', 'batch2', 'batch3']);

        assert.ok(!result.batch1);
        assert.ok(!result.batch2);
        assert.ok(!result.batch3);

        return true;
    }

    static async proceedsThroughWaterfall(storage) {
        const convoState = new ConversationState(storage);

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.continueDialog();
            if (!turnContext.responded) {
                await dc.beginDialog('waterfallDialog');
            }
        }).use(new AutoSaveStateMiddleware(convoState));

        dialogs.add(
            new TextPrompt('textPrompt', async (promptContext) => {
                const result = promptContext.recognized.value;
                if (result.length > 3) {
                    const succeededMessage = MessageFactory.text(
                        `You got it at the ${promptContext.attemptCount}th try!`
                    );
                    await promptContext.context.sendActivity(succeededMessage);
                    return true;
                }

                const reply = MessageFactory.text(
                    `Please send a name that is longer than 3 characters. ${promptContext.attemptCount}`
                );
                await promptContext.context.sendActivity(reply);
                return false;
            })
        );

        const steps = [
            async (stepContext) => {
                assert.strictEqual(typeof stepContext.activeDialog.state['stepIndex'], 'number');
                await stepContext.context.sendActivity('step1');
                return Dialog.EndOfTurn;
            },
            async (stepContext) => {
                assert.strictEqual(typeof stepContext.activeDialog.state['stepIndex'], 'number');
                await stepContext.prompt('textPrompt', { prompt: MessageFactory.text('Please type your name.') });
            },
            async (stepContext) => {
                assert.strictEqual(typeof stepContext.activeDialog.state['stepIndex'], 'number');
                await stepContext.context.sendActivity('step3');
                return Dialog.EndOfTurn;
            },
        ];

        dialogs.add(new WaterfallDialog('waterfallDialog', steps));

        await adapter
            .send('hello')
            .assertReply('step1')
            .send('hello')
            .assertReply('Please type your name.')
            .send('hi')
            .assertReply('Please send a name that is longer than 3 characters. 1')
            .send('hi')
            .assertReply('Please send a name that is longer than 3 characters. 2')
            .send('hi')
            .assertReply('Please send a name that is longer than 3 characters. 3')
            .send('Kyle')
            .assertReply('You got it at the 4th try!')
            .assertReply('step3')
            .startTest();

        return true;
    }
}

module.exports = { StorageBaseTests };
