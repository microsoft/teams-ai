const { ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { Dialog, DialogContextError, DialogSet, WaterfallDialog, DialogTurnStatus } = require('../');
const assert = require('assert');

const beginMessage = { text: 'begin', type: 'message' };
const continueMessage = { text: 'continue', type: 'message' };

describe('DialogContext', function () {
    this.timeout(5000);

    it('should beginDialog() a new dialog.', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a');
            if (results.status === DialogTurnStatus.complete) {
                assert(results.result === true, 'End result from WaterfallDialog was not expected value.');
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and register the WaterfallDialog.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog(true);
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('beginDialog() should pass in dialogOptions to a begun dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a', { z: 'z' });
            if (results.status === DialogTurnStatus.complete) {
                assert(results.result === true, 'End result from WaterfallDialog was not expected value.');
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert(step.options.z === 'z', 'Correct DialogOptions was not passed in to WaterfallDialog.');
                    return await step.endDialog(true);
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should return error if beginDialog() called with invalid dialogId.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await assert.rejects(
                async () => {
                    await dc.beginDialog('b');
                    await convoState.saveChanges(turnContext);
                },
                (err) => {
                    assert.strictEqual(
                        err.message,
                        "DialogContext.beginDialog(): A dialog with an id of 'b' wasn't found.",
                        `unexpected error message thrown: "${err.message}"`
                    );

                    assert(err instanceof DialogContextError, 'err should be a DialogContextError');
                    assert(err.dialogContext, 'err should include dialogContext');
                    return true;
                }
            );
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);

        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    return await step.endDialog();
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should pass prompt() args to dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.prompt('a', 'test');
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert.strictEqual(
                        step.options.prompt,
                        'test',
                        'promptOrOptions arg was not correctly passed through.'
                    );
                    return await step.endDialog();
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should pass undefined prompt() to dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.prompt('a');
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog();
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should pass choice array to prompt() to dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.prompt('a', 'test', ['red', 'green', 'blue']);
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert(Array.isArray(step.options.choices), 'choices received in step is not an array.');
                    assert.strictEqual(step.options.choices.length, 3, 'not all choices were passed in.');
                    return await step.endDialog();
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should return a value to parent when endDialog() called with a value.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a');
            await convoState.saveChanges(turnContext);
            assert.strictEqual(results.result, 119, "unexpected results.result value received from 'a' dialog.");
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.beginDialog('b');
                },
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert.strictEqual(step.result, 120, "incorrect step.result value received from 'b' dialog.");
                    return await step.endDialog(119);
                },
            ])
        );

        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog(120);
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should continue() execution of a dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;

                case DialogTurnStatus.complete:
                    assert.strictEqual(results.result, true, 'received unexpected final result from dialog.');
                    break;
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    await step.context.sendActivity('foo');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog(true);
                },
            ])
        );

        await adapter.send(beginMessage).send(continueMessage).startTest();
    });

    it('should return an error if dialog not found when continue() called.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('a');
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert.strictEqual(step.activeDialog.id, 'a', 'incorrect value for step.activeDialog.id');
                    step.activeDialog.id = 'b';
                    return Dialog.EndOfTurn;
                },
                async function () {
                    assert(false, "shouldn't continue");
                },
            ])
        );

        await assert.rejects(
            async () => await adapter.send(beginMessage).send(continueMessage).startTest(),
            (err) => {
                assert(err, 'Error not found.');
                assert.strictEqual(
                    err.message,
                    "DialogContext.continueDialog(): Can't continue dialog. A dialog with an id of 'b' wasn't found.",
                    `unexpected error message thrown: "${err.message}"`
                );

                assert(err instanceof DialogContextError, 'err should be a DialogContextError');
                assert(err.dialogContext, 'err should include dialogContext');
                return true;
            }
        );
    });

    it('should return a DialogTurnResult if continue() is called without an activeDialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.continueDialog();
            assert.strictEqual(typeof results, 'object', 'results is not the expected object');
            assert.strictEqual(results.status, DialogTurnStatus.empty, "results.status is not 'empty'.");
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);

        await adapter.send(beginMessage).startTest();
    });

    it('should return to parent dialog when endDialog() called.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a');
            assert.strictEqual(results.result, true, 'received unexpected final result from dialog.');
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.beginDialog('b');
                },
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert(step.context.activity.text, 'begin', 'unexpected message received.');
                    assert(step.result, 'ended dialog.', 'unexpected step.result received.');
                    return await step.endDialog(true);
                },
            ])
        );

        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog('ended dialog.');
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should accept calls to end when no activeDialogs or parent dialogs exist.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.endDialog();
            await convoState.saveChanges(turnContext);
            assert.strictEqual(results.status, DialogTurnStatus.complete, "results.status not equal 'complete'.");
            assert.strictEqual(
                results.result,
                undefined,
                'received unexpected value for results.result (expected undefined).'
            );
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.replaceDialog('b', { z: step.options.z });
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should replace() dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a', { z: 'z' });
            await convoState.saveChanges(turnContext);
            assert.strictEqual(results.result, 'z', 'received unexpected final result from dialog.');
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.replaceDialog('b', { z: step.options.z });
                },
            ])
        );

        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    assert.strictEqual(step.stack.length, 1, 'current DialogContext.stack.length should be 1.');
                    assert.strictEqual(step.options.z, 'z', 'incorrect step.options received.');
                    return await step.endDialog(step.options.z);
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });

    it('should begin dialog if stack empty when replaceDialog() called with valid dialogId.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.replaceDialog('b');
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'WaterfallStepContext not passed in to WaterfallStep.');
                    return await step.endDialog();
                },
            ])
        );

        await adapter.send(beginMessage).startTest();
    });
});
