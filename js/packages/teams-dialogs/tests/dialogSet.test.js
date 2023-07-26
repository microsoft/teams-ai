const { ConversationState, MemoryStorage, TestAdapter, NullTelemetryClient } = require('botbuilder-core');
const { Dialog, DialogSet, WaterfallDialog, DialogTurnStatus, ComponentDialog } = require('../');
const assert = require('assert');

const beginMessage = { text: 'begin', type: 'message' };
const continueMessage = { text: 'continue', type: 'message' };

describe('DialogSet', function () {
    this.timeout(5000);

    const storage = new MemoryStorage();
    const conversationState = new ConversationState(storage);
    const dialogState = conversationState.createProperty('dialogState');

    it('should throw on createContext(undefined)', async function () {
        const dialogSet = new DialogSet(dialogState);
        await assert.rejects(async () => await dialogSet.createContext(undefined), TypeError);
    });

    it('should add a waterfall to the dialog set.', function () {
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                function (step) {
                    assert(step);
                },
            ])
        );
    });

    it('should throw an error if DialogSet.dialogState is falsey.', async function () {
        const dialogs = new DialogSet();
        await assert.rejects(
            dialogs.createContext({ type: 'message', text: 'hi' }),
            new Error('DialogSet.createContext(): the dialog set was not bound to a stateProperty when constructed.')
        );
    });

    it('should add fluent dialogs to the dialog set.', function () {
        // Create new ConversationState with MemoryStorage and instantiate DialogSet with PropertyAccessor.
        const dialogs = new DialogSet(dialogState);
        dialogs
            .add(
                new WaterfallDialog('A', [
                    function (dc) {
                        assert(dc);
                    },
                ])
            )
            .add(
                new WaterfallDialog('B', [
                    function (dc) {
                        assert(dc);
                    },
                ])
            );
        assert(dialogs.find('A'), 'dialog A not found.');
        assert(dialogs.find('B'), 'dialog B not found.');
    });

    it('should increment the dialog ID when adding the same dialog twice.', function () {
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new WaterfallDialog('a', [function () {}]));

        dialogs.add(new WaterfallDialog('a', [function () {}]));

        assert(dialogs.find('a'));
        assert(dialogs.find('a2'), "second dialog didn't have ID incremented");
    });

    it('should find() a dialog that was added.', function () {
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new WaterfallDialog('a', [function () {}]));

        assert(dialogs.find('a'), 'dialog not found.');
        assert(!dialogs.find('b'), "dialog found that shouldn't exist.");
    });

    it('should save dialog stack state between turns.', async function () {
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new WaterfallDialog('a', [
                async function (step) {
                    assert(step);
                    await step.context.sendActivity('Greetings');
                    return Dialog.EndOfTurn;
                },
                async function (step) {
                    await step.context.sendActivity('Good bye!');
                    return await step.endDialog();
                },
            ])
        );

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('a');
            }
            await convoState.saveChanges(turnContext);
        });

        await adapter
            .send(beginMessage)
            .assertReply('Greetings')
            .send(continueMessage)
            .assertReply('Good bye!')
            .startTest();
    });

    it('should generate a version hash of added dialogs.', function () {
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new WaterfallDialog('A')).add(new WaterfallDialog('B'));
        const hash = dialogs.getVersion();
        assert(hash && hash.length > 0, 'no hash generated.');
    });

    it('Generated version hash should change when dialog set changes.', function () {
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new WaterfallDialog('A')).add(new WaterfallDialog('B'));
        const hash = dialogs.getVersion();
        assert(hash && hash.length > 0, 'no hash generated.');

        dialogs.add(new WaterfallDialog('C'));
        assert(hash != dialogs.getVersion(), 'hash not updated.');
    });

    it('Cyclical dialog structures', function () {
        const component1 = new ComponentDialog('component1');
        const component2 = new ComponentDialog('component2');

        component1.addDialog(component2);
        component2.addDialog(component1);

        // This would trigger stack overflow if cycles were not properly handled
        component1.telemetryClient = new NullTelemetryClient();
    });
});
