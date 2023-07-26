const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { Dialog, DialogReason, DialogSet, DialogTurnStatus, WaterfallDialog, ComponentDialog } = require('../');

const assert = require('assert');

const beginMessage = { text: 'begin', type: 'message' };

class MyWaterfall extends WaterfallDialog {
    constructor(dialogId) {
        super(dialogId);

        this.addStep(this.firstStep.bind(this));
        this.addStep(this.secondStep.bind(this));
        this.value = 1;
    }

    async firstStep(step) {
        assert(step, 'hey!');
        assert.equal(this.value, 1, 'this pointer is bogus in firstStep');
        await step.context.sendActivity('bot responding.');
        return Dialog.EndOfTurn;
    }

    async secondStep(step) {
        assert(step);
        assert.equal(this.value, 1, 'this pointer is bogus in secondStep');
        return await step.endDialog('ending WaterfallDialog.');
    }
}

describe('WaterfallDialog', function () {
    this.timeout(5000);

    it('should execute a sequence of waterfall steps.', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;

                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
                    break;
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
                    assert(step, 'hey!');
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step);
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should execute a sequence of waterfall steps when using addStep().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;

                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
                    break;
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and register the WaterfallDialog.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const waterfall = new WaterfallDialog('a')
            .addStep(async function (step) {
                assert(step, 'hey!');
                await step.context.sendActivity('bot responding.');
                return Dialog.EndOfTurn;
            })
            .addStep(async function (step) {
                assert(step);
                return await step.endDialog('ending WaterfallDialog.');
            });
        dialogs.add(waterfall);

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should execute a sequence of waterfall steps when using derived class.', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;

                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
                    break;
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and register the WaterfallDialog.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new MyWaterfall('a'));

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should support calling next() to move to next steps.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.beginDialog('a', { test: 'test' });

            await turnContext.sendActivity(`ended WaterfallDialog ["${results.result}"].`);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step.options && step.options.test === 'test', 'step.options not found.');
                    await step.context.sendActivity('bot responding.');
                    return await step.next(step.options.test);
                },
                async function (step) {
                    assert(step);
                    return await step.endDialog(step.result);
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .assertReply('ended WaterfallDialog ["test"].')
            .startTest();
    });

    it('should support receive options via `step.options`.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a', { test: 'test' });
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test,
                        'test',
                        `step.options.test "${step.options.test}", was not expected value of "test".`
                    );
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step);
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should allow changing of `step.options` and persist changes across steps.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a', { test: 'test1' });
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test,
                        'test1',
                        `step.options.test "${step.options.test}", was not expected value of "test1".`
                    );
                    step.options.test = 'test2';
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test,
                        'test2',
                        `step.options.test "${step.options.test}", was not expected value of "test2".`
                    );
                    step.options.test = 'test3';
                    await step.context.sendActivity('bot responding again.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert.strictEqual(
                        step.options.test,
                        'test3',
                        `step.options.test "${step.options.test}", was not expected value of "test3".`
                    );
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('bot responding again.')
            .send('continue again')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should allow setting of step.values and persist values across steps.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    assert.equal(typeof step.values, 'object', 'initial step.values should be an object.');
                    step.values.test = 'test1';
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.values, 'step.values not found.');
                    assert.strictEqual(
                        step.values.test,
                        'test1',
                        `step.values.test ["${step.values.test}"] was not expected value "test1".`
                    );
                    step.values.test2 = 'test2';
                    await step.context.sendActivity('bot responding again.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.values, 'step.values not found.');
                    assert.strictEqual(
                        step.values.test,
                        'test1',
                        `step.values.test ["${step.values.test}"] was not expected value "test1".`
                    );
                    assert.strictEqual(
                        step.values.test2,
                        'test2',
                        `step.values.test2 ["${step.values.test2}"] was not expected value "test2".`
                    );
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('bot responding again.')
            .send('continue again')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should not move step.values from one WaterfallDialog to another.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    assert.equal(typeof step.values, 'object', 'initial step.values should be an object.');
                    step.values.test = 'test1';
                    await step.context.sendActivity('bot responding.');
                    return await step.beginDialog('b');
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.values, 'step.values not found.');
                    assert.strictEqual(
                        step.values.test,
                        'test1',
                        `step.values.test ["${step.values.test}"] was not expected value "test1".`
                    );
                    assert.strictEqual(
                        step.values.test_b,
                        undefined,
                        "step.values.test_b should not be available in WaterfallDialog('a')."
                    );
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'step not found.');
                    assert.equal(
                        typeof step.values,
                        'object',
                        'new step.values for second WaterfallDialog should be an object.'
                    );
                    assert(
                        !step.values.test,
                        "new WaterfallDialog's step.values shouldn't have values from parent dialog's step.values."
                    );

                    // Add a new value to this WaterfallDialog's step.values.
                    // This value should not be available to this dialog's parent.
                    step.values.test_b = 'test_b';
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert.equal(
                        typeof step.values,
                        'object',
                        'step.values for second WaterfallDialog should be an object.'
                    );
                    assert(
                        !step.values.test,
                        "new WaterfallDialog's step.values shouldn't have values from parent dialog's step.values."
                    );
                    assert.strictEqual(
                        step.values.test_b,
                        'test_b',
                        "step.values.test_b should not be available in WaterfallDialog 'a'."
                    );

                    return await step.endDialog();
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should not move step.options from one WaterfallDialog to another.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a', { test_a: 'test_a' });
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test_a,
                        'test_a',
                        `step.options.test_a "${step.options.test_a}", was not expected value of "test_a".`
                    );
                    await step.context.sendActivity('bot responding.');
                    return await step.beginDialog('b');
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test_a,
                        'test_a',
                        `step.options.test_a "${step.options.test_a}", was not expected value of "test_a".`
                    );
                    return await step.endDialog('ending WaterfallDialog.');
                },
            ])
        );

        dialogs.add(
            new WaterfallDialog('b', [
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test_a,
                        undefined,
                        `step.options.test_a "${step.options.test_a}", was not expected value of "undefined".`
                    );
                    step.options.test_b = 'test_b';
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(step.options, 'step.options not found.');
                    assert.strictEqual(
                        step.options.test_b,
                        'test_b',
                        `step.options.test_b "${step.options.test_b}", was not expected value of "test_b".`
                    );
                    return await step.endDialog();
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .assertReply('ending WaterfallDialog.')
            .startTest();
    });

    it('should end if no additional steps exist.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    return Dialog.EndOfTurn;
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send('continue')
            .send('continue one last time.')
            .assertReply('continue one last time.')
            .startTest();
    });

    it('should throw error if step.next() is called multiple times on a WaterfallStep.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    await step.context.sendActivity('bot responding.');
                    try {
                        await step.next();
                        await step.next();
                    } catch (err: unknown) {
                        assert(
                            err.message ===
                                "WaterfallStepContext.next(): method already called for dialog and step 'a[0]'.",
                            err.message
                        );
                    }
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                },
                async function (step) {
                    assert(step, 'step not found.');
                },
            ])
        );

        await adapter.send(beginMessage).assertReply('bot responding.').startTest();
    });

    it('should support return EndOfTurn for non-message-type activities on continueDialog().', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('a');
                    break;
                case DialogTurnStatus.complete:
                    await turnContext.sendActivity(results.result);
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
                    assert(step, 'step not found.');
                    await step.context.sendActivity('bot responding.');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    assert(step, 'step not found.');
                    assert(
                        step.context.activity.text === 'continue.',
                        `expected "continue." not ${step.context.activity.text}`
                    );
                    return await step.endDialog('done.');
                },
            ])
        );

        await adapter
            .send(beginMessage)
            .assertReply('bot responding.')
            .send({ type: ActivityTypes.Event })
            .send('continue.')
            .assertReply('done.')
            .startTest();
    });

    it('should record the correct step name when cancelled.', async function () {
        const id = 'waterfall';
        const index = 1;
        const dialog = new MyWaterfall(id);
        let trackEventCalled;
        dialog.telemetryClient = {
            trackEvent(telemetry) {
                assert(
                    telemetry.properties.StepName == dialog.steps[index].name,
                    `telemetry contains incorrect step name: "${telemetry.properties.StepName}"`
                );
                trackEventCalled = true;
            },
        };
        await dialog.endDialog(
            {},
            {
                id,
                state: {
                    stepIndex: index,
                    values: { instanceId: '(guid)' },
                },
            },
            DialogReason.cancelCalled
        );
        assert(trackEventCalled, 'trackEvent was never called.');
    });

    it('should waterfall step parent be equal to waterfall dialog parent.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');
        const waterfall = new WaterfallDialog('waterfall', [
            async function (step) {
                assert.strictEqual(step.parent.activeDialog.id, component.id);
                await step.context.sendActivity('verified');
                return await step.endDialog('done.');
            },
        ]);

        const component = new ComponentDialog('composite');
        component.addDialog(waterfall);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.beginDialog('composite');
            assert(results.status === DialogTurnStatus.complete, 'status results not completed');
        });

        adapter.send('Hi').assertReply('verified').startTest();
    });
});
