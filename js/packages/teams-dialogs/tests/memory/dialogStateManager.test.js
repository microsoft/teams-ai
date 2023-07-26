const assert = require('assert');
const { ConversationState, UserState, MemoryStorage, TurnContext, TestAdapter } = require('botbuilder-core');

const {
    ConversationMemoryScope,
    Dialog,
    DialogContainer,
    DialogContext,
    DialogSet,
    UserMemoryScope,
} = require('../..');

const beginMessage = {
    text: 'begin',
    type: 'message',
    channelId: 'test',
    from: { id: 'user' },
    recipient: { id: 'bot' },
    conversation: { id: 'convo1' },
};

class TestDialog extends Dialog {
    constructor(id, message) {
        super(id);

        this.message = message;
        this.dialogType = 'child';
    }

    async beginDialog(dc) {
        dc.activeDialog.state.isDialog = true;
        await dc.context.sendActivity(this.message);
        return Dialog.EndOfTurn;
    }
}

class TestContainer extends DialogContainer {
    constructor(id, child) {
        super(id);

        if (child) {
            this.dialogs.add(child);
            this.childId = child.id;
        }

        this.dialogType = 'container';
    }

    async beginDialog(dc, options) {
        const state = dc.activeDialog.state;
        state.isContainer = true;

        if (this.childId) {
            state.dialog = {};
            return this.createChildContext(dc).beginDialog(this.childId, options);
        } else {
            return Dialog.EndOfTurn;
        }
    }

    async continueDialog(dc) {
        const childDc = this.createChildContext(dc);
        if (childDc) {
            return childDc.continueDialog();
        } else {
            return Dialog.EndOfTurn;
        }
    }

    createChildContext(dc) {
        const state = dc.activeDialog.state;

        if (state.dialog) {
            const childDc = new DialogContext(this.dialogs, dc.context, state.dialog);
            childDc.parent = dc;
            return childDc;
        }

        return undefined;
    }
}

async function createConfiguredTestDc(storage) {
    const dc = await createTestDc(storage);
    await dc.state.loadAllScopes();
    return dc;
}

async function createTestDc(storage = new MemoryStorage()) {
    const convoState = new ConversationState(storage);
    const userState = new UserState(storage);

    const dialogState = convoState.createProperty('dialogs');
    const dialogs = new DialogSet(dialogState);
    const container = new TestContainer('container', new TestDialog('child', 'test message'));
    dialogs.add(container);

    const context = new TurnContext(new TestAdapter(), beginMessage);
    context.turnState.set('ConversationState', convoState);
    context.turnState.set('UserState', userState);
    const dc = await dialogs.createContext(context);

    await dc.beginDialog('container');

    return dc;
}

describe('Dialog State Manager', function () {
    beforeEach(async function () {
        this.dc = await createConfiguredTestDc();
    });

    it('create a standard configuration with added conversation and user state.', function () {
        const config = this.dc.state.configuration;
        assert(
            config.memoryScopes.find(
                (scope) => scope instanceof ConversationMemoryScope && scope.name === 'conversation'
            )
        );
        assert(config.memoryScopes.find((scope) => scope instanceof UserMemoryScope && scope.name === 'user'));
    });

    it('create a standard configuration by default.', function () {
        const config = this.dc.state.configuration;
        assert(config, 'No config returned');
        assert(config.pathResolvers.length > 0, 'No path resolvers');
        assert(config.memoryScopes.length > 0, 'No memory scopes');
    });

    it('read values from the SETTINGS memory scope.', function () {
        const entries = Object.entries(process.env);
        assert(entries.length);
        entries.every(([key, expected]) => assert.strictEqual(this.dc.state.getValue(`settings["${key}"]`), expected));
    });

    it('Should read values from the CLASS memory scope.', function () {
        assert.strictEqual(this.dc.state.getValue('class.dialogType'), 'container');
        assert.strictEqual(this.dc.child.state.getValue('class.dialogType'), 'child');
    });

    ['turn', 'dialog', 'this', 'conversation', 'user'].forEach((scope) =>
        it(`read & write values to ${scope} memory scope`, function () {
            this.dc.state.setValue(`${scope}.foo`, 'bar');
            assert.strictEqual(this.dc.state.getValue(`${scope}.foo`), 'bar');
        })
    );

    [
        ['$', 'dialog'],
        ['#', 'turn.recognized.intents'],
        ['@@', 'turn.recognized.entities', ['bar'], assert.deepStrictEqual],
    ].forEach(([short, long, value = 'bar', assertion = assert.strictEqual]) =>
        it(`read & write values using ${short} alias`, function () {
            this.dc.state.setValue(`${short}foo`, value);
            assertion(this.dc.state.getValue(`${long}.foo`), value);
            assertion(this.dc.state.getValue(`${short}foo`), value);
        })
    );

    it('read entities using @ alias.', function () {
        this.dc.state.setValue('@@foo', ['foo']);
        this.dc.state.setValue('@@bar', [['bar']]);
        assert.strictEqual(this.dc.state.getValue('@foo'), 'foo');
        assert.strictEqual(this.dc.state.getValue('@bar'), 'bar');

        this.dc.state.setValue('turn.recognized.entities.single', ['test1', 'test2', 'test3']);
        this.dc.state.setValue('turn.recognized.entities.double', [
            ['testx', 'testy', 'testz'],
            ['test1', 'test2', 'test3'],
        ]);
        assert.strictEqual(this.dc.state.getValue('@single'), 'test1');
        assert.strictEqual(this.dc.state.getValue('@double'), 'testx');
        assert.strictEqual(this.dc.state.getValue('turn.recognized.entities.single.first()'), 'test1');
        assert.strictEqual(this.dc.state.getValue('turn.recognized.entities.double.first()'), 'testx');

        this.dc.state.setValue('turn.recognized.entities.single', [
            { name: 'test1' },
            { name: 'test2' },
            { name: 'test3' },
        ]);
        this.dc.state.setValue('turn.recognized.entities.double', [
            [{ name: 'testx' }, { name: 'testy' }, { name: 'testz' }],
            [{ name: 'test1' }, { name: 'test2' }, { name: 'test3' }],
        ]);
        assert.strictEqual(this.dc.state.getValue('@single.name'), 'test1');
        assert.strictEqual(this.dc.state.getValue('@double.name'), 'testx');
        assert.strictEqual(this.dc.state.getValue('turn.recognized.entities.single.first().name'), 'test1');
        assert.strictEqual(this.dc.state.getValue('turn.recognized.entities.double.first().name'), 'testx');
    });

    it('write an entity using @ alias.', function () {
        this.dc.state.setValue('@foo', 'bar');
        assert.strictEqual(this.dc.state.getValue('@foo'), 'bar');
    });

    it('read values using % alias.', function () {
        assert.strictEqual(this.dc.state.getValue('%dialogType'), 'container');
        assert.strictEqual(this.dc.child.state.getValue('%dialogType'), 'child');
    });

    it('delete values in a scope.', function () {
        this.dc.state.setValue('turn.foo', 'bar');
        this.dc.state.deleteValue('turn.foo');
        assert.strictEqual(this.dc.state.getValue('turn.foo'), undefined);
    });

    it('persist conversation & user values when saved.', async function () {
        const storage = new MemoryStorage();
        let dc = await createConfiguredTestDc(storage);

        dc.state.setValue('user.name', 'test user');
        dc.state.setValue('conversation.foo', 'bar');
        await dc.state.saveAllChanges();

        dc = await createConfiguredTestDc(storage);
        assert.strictEqual(dc.state.getValue('user.name'), 'test user');
        assert.strictEqual(dc.state.getValue('conversation.foo'), 'bar');
    });

    it('return default value when getValue() called with empty path.', function () {
        assert.strictEqual(this.dc.state.getValue('', 'default'), 'default');
    });

    it('support passing a function to getValue() for the default.', function () {
        assert.strictEqual(
            this.dc.state.getValue('', () => 'default'),
            'default'
        );
    });

    it('raise an error if getValue() called with an invalid scope.', function () {
        assert.throws(() => this.dc.state.getValue('foo.bar'));
    });

    it('raise an error if setValue() called with missing path.', function () {
        assert.throws(() => this.dc.state.setValue('', 'bar'));
    });

    it('raise an error if setValue() called with an invalid scope.', function () {
        assert.throws(() => this.dc.state.setValue('foo', 'bar'));
    });

    it('overwrite memory when setValue() called with just a scope.', function () {
        this.dc.state.setValue('turn', { foo: 'bar' });
        assert.strictEqual(this.dc.state.getValue('turn.foo'), 'bar');
    });

    it('raise an error if deleteValue() called with < 2 path path.', function () {
        assert.throws(() => this.dc.state.deleteValue('conversation'));
    });

    it('raise an error if deleteValue() called with an invalid scope.', function () {
        assert.throws(() => this.dc.state.deleteValue('foo.bar'));
    });

    it('read & write array values.', function () {
        this.dc.state.setValue('turn.foo', ['bar']);
        assert.strictEqual(this.dc.state.getValue('turn.foo[0]'), 'bar');
    });

    it('delete array values by index.', function () {
        this.dc.state.setValue('turn.test', ['foo', 'bar']);
        this.dc.state.deleteValue('turn.test[0]');
        assert.strictEqual(this.dc.state.getValue('turn.test[0]'), 'bar');
    });

    it('ignore array deletions that are out of range.', function () {
        this.dc.state.setValue('turn.test', []);
        this.dc.state.deleteValue('turn.test[0]');
        assert.deepStrictEqual(this.dc.state.getValue('turn.test'), []);
    });

    it('ignore groperty deletions off non-object properties.', function () {
        this.dc.state.setValue('turn.foo', []);
        this.dc.state.deleteValue('turn.foo.bar');
        assert.deepStrictEqual(this.dc.state.getValue('turn.foo'), []);

        this.dc.state.setValue('turn.bar', 'test');
        this.dc.state.deleteValue('turn.bar.foo');
        assert.strictEqual(this.dc.state.getValue('turn.bar'), 'test');
    });

    it('ignore property deletions of missing object properties.', function () {
        this.dc.state.setValue('turn.foo', { test: 'test' });
        this.dc.state.deleteValue('turn.foo.bar');

        const value = this.dc.state.getValue('turn.foo');
        assert.deepStrictEqual(Object.keys(value), ['test']);
    });

    it('resolve nested expressions.', function () {
        this.dc.state.setValue('turn.addresses', {
            work: {
                street: 'one microsoft way',
                city: 'Redmond',
                state: 'wa',
                zip: '98052',
            },
        });

        this.dc.state.setValue('turn.addressKeys', ['work']);
        this.dc.state.setValue('turn.preferredAddress', 0);

        const value = this.dc.state.getValue('turn.addresses[turn.addressKeys[turn.preferredAddress]].zip');
        assert(value == '98052');
    });

    it('find a property quoted with single quotes.', function () {
        this.dc.state.setValue('turn.addresses', {
            work: {
                street: 'one microsoft way',
                city: 'Redmond',
                state: 'wa',
                zip: '98052',
            },
        });

        const value = this.dc.state.getValue("turn.addresses['work'].zip");
        assert(value == '98052');
    });

    it('find a property quoted with double quotes.', function () {
        this.dc.state.setValue('turn.addresses', {
            work: {
                street: 'one microsoft way',
                city: 'Redmond',
                state: 'wa',
                zip: '98052',
            },
        });

        const value = this.dc.state.getValue('turn.addresses["work"].zip');
        assert(value == '98052');
    });

    it('find a property containing embedded quotes.', function () {
        this.dc.state.setValue('turn.addresses', {
            '"work"': {
                street: 'one microsoft way',
                city: 'Redmond',
                state: 'wa',
                zip: '98052',
            },
        });

        const value = this.dc.state.getValue('turn.addresses[\'\\"work\\"\'].zip');
        assert(value == '98052');
    });

    it('raise an error for paths with miss-matched quotes.', function () {
        assert.throws(() => {
            this.dc.state.setValue('turn.addresses', {
                work: {
                    street: 'one microsoft way',
                    city: 'Redmond',
                    state: 'wa',
                    zip: '98052',
                },
            });

            this.dc.state.getValue('turn.addresses[\'work"].zip');
        });
    });

    it('raise an error for segments with invalid path chars.', function () {
        assert.throws(() => {
            this.dc.state.setValue('turn.addresses', {
                '~work': {
                    street: 'one microsoft way',
                    city: 'Redmond',
                    state: 'wa',
                    zip: '98052',
                },
            });

            this.dc.state.getValue('turn.addresses.~work.zip');
        });
    });

    it('raise an error for assignments to a negative array index.', function () {
        assert.throws(() => this.dc.state.setValue('turn.foo[-1]', 'test'));
    });

    it('raise an error for array assignments to non-array values.', function () {
        assert.throws(() => {
            this.dc.state.setValue('turn.foo', 'bar');
            this.dc.state.setValue('turn.foo[3]', 'test');
        });
    });

    it('raise an error for un-matched brackets.', function () {
        assert.throws(() => this.dc.state.setValue('turn.foo[0', 'test'));
    });

    it('alow indexer based path lookups.', function () {
        this.dc.state.setValue('turn.foo', 'bar');
        assert.strictEqual(this.dc.state.getValue('["turn"].["foo"]'), 'bar');
    });

    it('return "undefined" for index lookups again non-arrays.', function () {
        this.dc.state.setValue('turn.foo', 'bar');
        assert.strictEqual(this.dc.state.getValue('turn.foo[2]'), undefined);
    });

    it('return "undefined" when first() called for empty array.', function () {
        this.dc.state.setValue('turn.foo', []);
        assert.strictEqual(this.dc.state.getValue('turn.foo.first()'), undefined);
    });

    it('return "undefined" when first() called for empty nested array.', function () {
        this.dc.state.setValue('turn.foo', [[]]);
        assert.strictEqual(this.dc.state.getValue('turn.foo.first()'), undefined);
    });

    it('return "undefined" for a missing segment.', function () {
        this.dc.state.setValue('turn.foo', 'bar');
        assert.strictEqual(this.dc.state.getValue('turn..foo'), undefined);
    });

    it('raise an error for paths starting with a ".".', function () {
        assert.throws(() => this.dc.state.setValue('.turn.foo', 'bar'));
    });
});
