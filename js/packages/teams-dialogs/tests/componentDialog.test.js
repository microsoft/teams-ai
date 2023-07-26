const { ConversationState, MemoryStorage, TestAdapter, Severity } = require('botbuilder-core');
const {
    Dialog,
    DialogReason,
    DialogSet,
    DialogTurnStatus,
    DialogContextError,
    ComponentDialog,
    WaterfallDialog,
} = require('../');
const assert = require('assert');

function simpleStepContextCheck(step) {
    assert(step, 'step not found.');
    assert(typeof step === 'object', 'step is not a WaterfallStepContext.');
}

describe('ComponentDialog', function () {
    this.timeout(5000);

    it('should set initial dialog to be first dialog added via addDialog()', function () {
        const simpleWaterfall = new WaterfallDialog('simpleWaterfall', [async () => {}]);

        const simpleH2ofall = new WaterfallDialog('simpleH2ofall', [async () => {}]);

        const component = new ComponentDialog('component');
        component.addDialog(simpleWaterfall);
        assert(component.initialDialogId === 'simpleWaterfall', 'unexpected initialDialogId');
        component.addDialog(simpleH2ofall);
        assert(
            component.initialDialogId === 'simpleWaterfall',
            `unexpected change in initialDialogId, it is now ${component.initialDialogId}`
        );
    });

    it('should call ComponentDialog from another DialogSet.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const startDialog = new WaterfallDialog('start', [
            async (step) => {
                simpleStepContextCheck(step);
                assert(step.options.foo === 'bar');
                return await step.endDialog();
            },
        ]);
        const component = new ComponentDialog('composite');
        component.addDialog(startDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            await dc.beginDialog('composite', { foo: 'bar' });
        });

        await adapter.send('Hi').startTest();
    });

    it('should throw an error up if child dialog does not return DialogTurnResult on beginDialog.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const startDialog = new WaterfallDialog('start', [
            async (step) => {
                simpleStepContextCheck(step);
            },
        ]);
        const component = new ComponentDialog('composite');
        component.addDialog(startDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            await assert.rejects(async () => await dc.beginDialog('composite'), DialogContextError);
        });
        await adapter.send('Hi').startTest();
    });

    it('should have DialogTurnResult.status equal DialogTurnStatus.complete when endComponent() is called.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const startDialog = new WaterfallDialog('start', [
            async (step) => {
                simpleStepContextCheck(step);
                return { status: DialogTurnStatus.complete, result: undefined };
            },
        ]);
        const component = new ComponentDialog('composite');
        component.addDialog(startDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.beginDialog('composite');
            assert(
                results.status === DialogTurnStatus.complete,
                `unexpected DialogTurnStatus received: ${results.status}`
            );
            assert(results.result === undefined, `unexpected results.result received: ${results.result}`);
        });

        await adapter.send('Hi').startTest();
    });

    it("should return Dialog.EndOfTurn if the dialog's turnResult.status === 'waiting'.", async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const startDialog = new WaterfallDialog('start', [
            async (step) => {
                simpleStepContextCheck(step);
                return { status: DialogTurnStatus.waiting, result: undefined };
            },
            async (step) => {
                simpleStepContextCheck(step);
                return await step.endDialog();
            },
        ]);
        const component = new ComponentDialog('composite');
        component.addDialog(startDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.beginDialog('composite');
            assert(
                results.status === DialogTurnStatus.waiting,
                `unexpected DialogTurnStatus received: ${results.status}`
            );
            assert(results.result === undefined, `unexpected results.result received: ${results.result}`);
        });

        await adapter.send('Hi').startTest();
    });

    it('should return any found dialogs.', function () {
        const simpleWaterfall = new WaterfallDialog('simpleWaterfall', [async () => {}]);

        const component = new ComponentDialog('component');
        component.addDialog(simpleWaterfall);
        const dialog = component.findDialog('simpleWaterfall');
        assert(dialog === simpleWaterfall, 'unexpected dialog returned');
    });

    it('should return undefined for not found dialogs.', function () {
        const component = new ComponentDialog('component');
        const notADialog = component.findDialog('notADialog');
        assert(notADialog === undefined, `unexpected value returned: ${typeof notADialog}`);
    });

    it('should continue from dc.continueDialog() and call onContinueDialog().', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const startDialog = new WaterfallDialog('start', [
            async (step) => {
                simpleStepContextCheck(step);
                await step.context.sendActivity('First step.');
                return Dialog.EndOfTurn;
            },
            async (step) => {
                simpleStepContextCheck(step);
                return await step.endDialog();
            },
        ]);
        const component = new ContinueDialog('composite');
        component.addDialog(startDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.continueDialog();

            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('composite');
            } else {
                assert(
                    results.status === DialogTurnStatus.complete,
                    `results.status should be 'complete' not ${results.status}`
                );
                assert(results.result === undefined, `results.result should be undefined, not ${results.result}`);
                await turnContext.sendActivity('Done.');
            }
            await conversationState.saveChanges(turnContext);
        });

        await adapter
            .send('Hi')
            .assertReply('First step.')
            .send('Hi again')
            .assertReply('Called onContinueDialog.')
            .assertReply('Done.')
            .startTest();
    });

    it('should cancel all Dialogs inside of ComponentDialog namespace.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const firstChildDialog = new WaterfallDialog('first', [
            async (step) => {
                simpleStepContextCheck(step);
                assert(step.stack.length === 1, `dialogStack should only have one dialog, not ${step.stack.length}`);
                await step.context.sendActivity('Reached first component dialog child.');
                return await step.beginDialog('second');
            },
            async (step) => {
                simpleStepContextCheck(step);
                await step.context.sendActivity('Should not have sent this message.');
                return await step.endDialog();
            },
        ]);
        const secondChildDialog = new WaterfallDialog('second', [
            async (step) => {
                simpleStepContextCheck(step);
                assert(step.stack.length === 2, `dialog stack should have two dialogs, not ${step.stack.length}`);
                await step.context.sendActivity('Cancelling all component dialog dialogs.');
                return await step.cancelAllDialogs();
            },
        ]);

        const component = new ComponentDialog('component');
        component.addDialog(firstChildDialog);
        component.addDialog(secondChildDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.beginDialog('component');
            assert(
                results.status === DialogTurnStatus.cancelled,
                `should have returned ${DialogTurnStatus.cancelled} not ${results.status}`
            );
            assert(
                dc.stack.length === 0,
                `should have a dialogStack without 0 dialogs, not ${dc.stack.length} dialogs`
            );
        });

        await adapter
            .send('Hi')
            .assertReply('Reached first component dialog child.')
            .assertReply('Cancelling all component dialog dialogs.')
            .startTest();
    });

    it('should not cancel any Dialogs outside of ComponentDialog namespace.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const outerDialog = new WaterfallDialog('outerDialog', [
            async (step) => {
                simpleStepContextCheck(step);
                return await step.beginDialog('component');
            },
            async (step) => {
                simpleStepContextCheck(step);
                assert(
                    step.reason === DialogReason.endCalled,
                    `called ComponentDialog should have bubbled up "cancelCalled" not "${step.reason}".`
                );
                await step.context.sendActivity('Cancelled successfully.');
                return await step.endDialog();
            },
        ]);
        const firstChildDialog = new WaterfallDialog('first', [
            async (step) => {
                simpleStepContextCheck(step);
                await step.context.sendActivity('Reached first component dialog child.');
                return await step.beginDialog('second');
            },
        ]);
        const secondChildDialog = new WaterfallDialog('second', [
            async (step) => {
                simpleStepContextCheck(step);
                await step.context.sendActivity('Cancelling all component dialog dialogs.');
                return await step.cancelAllDialogs();
            },
        ]);

        const component = new ComponentDialog('component');
        component.addDialog(firstChildDialog);
        component.addDialog(secondChildDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component).add(outerDialog);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            await dc.beginDialog('outerDialog');
        });

        await adapter
            .send('Hi')
            .assertReply('Reached first component dialog child.')
            .assertReply('Cancelling all component dialog dialogs.')
            .assertReply('Cancelled successfully.')
            .startTest();
    });

    it('should call a dialog defined in a parent component.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const childComponent = new ComponentDialog('childComponent');
        childComponent.addDialog(
            new WaterfallDialog('childDialog', [
                async (step) => {
                    await step.context.sendActivity('Child started.');
                    return await step.beginDialog('parentDialog', { value: 'test' });
                },
                async (step) => {
                    assert(step.result === 'test');
                    await step.context.sendActivity('Child finished.');
                    return await step.endDialog();
                },
            ])
        );

        const parentComponent = new ComponentDialog('parentComponent');
        parentComponent.addDialog(childComponent);
        parentComponent.addDialog(
            new WaterfallDialog('parentDialog', [
                async (step) => {
                    assert(step.options.value);
                    await step.context.sendActivity(`Parent called with: ${step.options.value}`);
                    return await step.endDialog(step.options.value);
                },
            ])
        );

        const dialogs = new DialogSet(dialogState);
        dialogs.add(parentComponent);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.continueDialog();

            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('parentComponent');
            } else {
                assert(
                    results.status === DialogTurnStatus.complete,
                    `results.status should be 'complete' not ${results.status}`
                );
                assert(results.result === undefined, `results.result should be undefined, not ${results.result}`);
                await turnContext.sendActivity('Done.');
            }
            await conversationState.saveChanges(turnContext);
        });

        await adapter
            .send('Hi')
            .assertReply('Child started.')
            .assertReply('Parent called with: test')
            .assertReply('Child finished.')
            .startTest();
    });

    it('should handle that a components children have changed.', async function () {
        const conversationState = new ConversationState(new MemoryStorage());
        const dialogState = conversationState.createProperty('dialog');

        const childDialog = new WaterfallDialog('child', [
            async (step) => {
                component.addDialog(new WaterfallDialog('change'));
                await step.context.sendActivity('First step.');
                return Dialog.EndOfTurn;
            },
            async (step) => {
                await step.context.sendActivity('Second step.');
                return await step.endDialog();
            },
        ]);
        const component = new ComponentDialog('test');
        component.addDialog(childDialog);

        const dialogs = new DialogSet(dialogState);
        dialogs.add(component);
        dialogs.telemetryClient = {
            trackEvent: function () {},
            trackTrace: function (telemetry) {
                if (telemetry.severityLevel === Severity.Warning) {
                    assert.equal(telemetry.message, 'Unhandled dialog event: versionChanged. Active Dialog: test');
                }
            },
        };

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            const results = await dc.continueDialog();

            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('test');
            } else {
                assert(
                    results.status === DialogTurnStatus.complete,
                    `results.status should be 'complete' not ${results.status}`
                );
                assert(results.result === undefined, `results.result should be undefined, not ${results.result}`);
                await turnContext.sendActivity('Done.');
            }
            await conversationState.saveChanges(turnContext);
        });

        await adapter
            .send('Hi')
            .assertReply('First step.')
            .send('Hi again')
            .assertReply('Second step.')
            .assertReply('Done.')
            .startTest();
    });
});

class ContinueDialog extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);
    }

    async onContinueDialog(innerDC) {
        await innerDC.context.sendActivity('Called onContinueDialog.');
        return await innerDC.continueDialog();
    }
}
