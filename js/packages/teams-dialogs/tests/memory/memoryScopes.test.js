const pick = require('lodash/pick');
const assert = require('assert');
const { ConversationState, UserState, MemoryStorage, TurnContext, TestAdapter } = require('botbuilder-core');

const {
    ClassMemoryScope,
    ConversationMemoryScope,
    DialogMemoryScope,
    DialogContextMemoryScope,
    SettingsMemoryScope,
    ThisMemoryScope,
    TurnMemoryScope,
    UserMemoryScope,
    Dialog,
    DialogSet,
    DialogContext,
    DialogContainer,
    DialogTurnStateConstants,
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
        this.expression = {
            tryGetValue: () => ({ value: 'resolved value' }),
        };
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
    }

    async beginDialog(dc, options) {
        const state = dc.activeDialog.state;
        state.isContainer = true;

        if (this.childId) {
            state.dialog = {};
            const childDc = this.createChildContext(dc);
            return childDc.beginDialog(this.childId, options);
        } else {
            return Dialog.EndOfTurn;
        }
    }

    async continueDialog(dc) {
        const childDc = this.createChildContext(dc);
        if (childDc) {
            return await childDc.continueDialog();
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
    }
}

describe('Memory Scopes', function () {
    describe('ClassMemoryScope', function () {
        async function initialize() {
            const convoState = new ConversationState(new MemoryStorage());
            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            const dialog = new TestDialog('test', 'test message');
            dialogs.add(dialog);

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);
            await dc.beginDialog('test');

            const scope = new ClassMemoryScope();

            return { dc, dialog, memory: scope.getMemory(dc), scope };
        }

        it('finds registered dialog', async function () {
            const { memory } = await initialize();

            assert.deepStrictEqual(pick(memory, 'message', 'expression'), {
                message: 'test message',
                expression: 'resolved value',
            });
        });

        it('does not allow setMemory() calls', async function () {
            const { dc, scope } = await initialize();
            assert.throws(() => scope.setMemory(dc, {}));
        });

        it('ignores load() and saveChanges() calls', async function () {
            const { dc, dialog, memory, scope } = await initialize();

            await scope.load(dc);

            memory.message = 'foo';
            await scope.saveChanges(dc);

            assert.strictEqual(dialog.message, 'test message');
        });

        it('does not allow delete() calls', async function () {
            const { dc, scope } = await initialize();
            await assert.rejects(scope.delete(dc));
        });
    });

    describe('ConversationMemoryScope', function () {
        it('returns conversation state', async function () {
            const convoState = new ConversationState(new MemoryStorage());

            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(new TestDialog('test', 'test message'));

            const context = new TurnContext(new TestAdapter(), beginMessage);
            context.turnState.set('ConversationState', convoState);

            await convoState.createProperty('conversation').set(context, { foo: 'bar' });
            await convoState.saveChanges(context);

            const dc = await dialogs.createContext(context);
            const scope = new ConversationMemoryScope();
            const memory = scope.getMemory(dc);
            assert.deepStrictEqual(pick(memory, 'conversation'), { conversation: { foo: 'bar' } });
        });
    });

    describe('UserMemoryScope', function () {
        async function initialize() {
            const storage = new MemoryStorage();

            let context = new TurnContext(new TestAdapter(), beginMessage);
            let userState = new UserState(storage);
            context.turnState.set('UserState', userState);

            await userState.createProperty('user').set(context, { foo: 'bar' });
            await userState.saveChanges(context);

            // Replace context and convoState with new instances
            context = new TurnContext(new TestAdapter(), beginMessage);
            userState = new UserState(storage);
            context.turnState.set('UserState', userState);

            // Create a DialogState property, DialogSet and register the dialogs.
            const convoState = new ConversationState(storage);
            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(new TestDialog('test', 'test message'));

            const dc = await dialogs.createContext(context);
            const scope = new UserMemoryScope(userState);

            return { dc, memory: scope.getMemory(dc), scope };
        }

        it('does not return state if not loaded', async function () {
            const { memory } = await initialize();
            assert.strictEqual(memory, undefined);
        });

        it('returns state once loaded.', async function () {
            const { dc, scope } = await initialize();
            let memory = scope.getMemory(dc);
            assert.strictEqual(memory, undefined);

            await scope.load(dc);
            memory = scope.getMemory(dc);
            assert.deepStrictEqual(pick(memory, 'user'), { user: { foo: 'bar' } });
        });
    });

    describe('DialogMemoryScope', function () {
        async function initialize(dialog = new TestContainer('container')) {
            const convoState = new ConversationState(new MemoryStorage());

            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(dialog);

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);
            await dc.beginDialog(dialog.id);

            const scope = new DialogMemoryScope();

            return { dc, memory: scope.getMemory(dc), scope };
        }

        it('returns containers state', async function () {
            const { memory } = await initialize();
            assert.deepStrictEqual(pick(memory, 'isContainer'), { isContainer: true });
        });

        it('returns parent containers state for children', async function () {
            const { dc, scope } = await initialize(
                new TestContainer('container', new TestDialog('child', 'test message'))
            );
            assert(dc.child);

            const memory = scope.getMemory(dc.child);
            assert.deepStrictEqual(pick(memory, 'isContainer'), { isContainer: true });
        });

        it('returns childs state when no parent', async function () {
            const { memory } = await initialize(new TestDialog('test', 'test message'));
            assert.deepStrictEqual(pick(memory, 'isDialog'), { isDialog: true });
        });

        it('overwrites parents memory', async function () {
            const { dc, scope } = await initialize(
                new TestContainer('container', new TestDialog('child', 'test message'))
            );
            assert(dc.child);

            scope.setMemory(dc.child, { foo: 'bar' });
            const memory = scope.getMemory(dc);

            assert.deepStrictEqual(pick(memory, 'foo'), { foo: 'bar' });
        });

        it('overwrites active dialogs memory', async function () {
            const { dc, scope } = await initialize();

            scope.setMemory(dc, { foo: 'bar' });
            const memory = scope.getMemory(dc);

            assert.deepStrictEqual(pick(memory, 'foo'), { foo: 'bar' });
        });

        it('raises error if setMemory() called without memory', async function () {
            const { dc, scope } = await initialize();
            assert.throws(() => scope.setMemory(dc, undefined), {
                message: 'DialogMemoryScope.setMemory: undefined memory object passed in.',
            });
        });

        it('raises error if delete() called', async function () {
            const { dc, scope } = await initialize();
            await assert.rejects(scope.delete(dc), {
                message: "MemoryScope.delete: The 'dialog' memory scope can't be deleted.",
            });
        });
    });

    describe('SettingsMemoryScope', function () {
        async function initialize(fn, initialSettings) {
            const convoState = new ConversationState(new MemoryStorage());
            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState).add(new TestDialog('test', 'test message'));

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);
            await Promise.resolve(fn(dc));

            const scope = new SettingsMemoryScope(initialSettings);
            return { dc, memory: scope.getMemory(dc), scope };
        }

        it('gets settings from turnState', async function () {
            const { dc, memory } = await initialize((dc) => {
                dc.context.turnState.set('settings', require('../test.settings.json'));
            });

            assert.deepStrictEqual(pick(memory, 'string', 'int', 'array'), {
                string: 'test',
                int: 3,
                array: ['zero', 'one', 'two', 'three'],
            });

            assert.strictEqual(dc.state.getValue('settings.fakeArray.0'), 'zero');
            assert.strictEqual(dc.state.getValue('settings.fakeArray.1'), 'one');
            assert.strictEqual(dc.state.getValue('settings.fakeArray.2'), 'two');
            assert.strictEqual(dc.state.getValue('settings.fakeArray.3'), 'three');
            assert.strictEqual(dc.state.getValue('settings.fakeArray.zzz'), 'cat');
        });

        it('gets settings from configuration', async function () {
            const { memory } = await initialize((dc) => {
                dc.context.turnState.set(DialogTurnStateConstants.configuration, {
                    simple: 'test',
                    'object:simple': 'test',
                    'array:0': 'one',
                    'array:1': 'two',
                    'object:array:0': 'one',
                    'object:array:1': 'two',
                    MicrosoftAppPassword: 'testpassword',
                    'runtimeSettings:telemetry:options:connectionString': 'testConnectionString',
                    'BlobsStorage:CONNECTIONSTRING': 'testConnectionString',
                });
            });

            assert.deepStrictEqual(
                pick(memory, 'array', 'object', 'simple', 'MicrosoftAppPassword', 'runtimeSettings', 'BlobsStorage'),
                {
                    array: ['one', 'two'],
                    object: {
                        array: ['one', 'two'],
                        simple: 'test',
                    },
                    simple: 'test',
                    runtimeSettings: {
                        telemetry: {
                            options: {},
                        },
                    },
                    BlobsStorage: {},
                }
            );
        });

        it('gets settings from configuration and environment variables', async function () {
            const { memory } = await initialize((dc) => {
                dc.context.turnState.set(DialogTurnStateConstants.configuration, {
                    simple: 'test',
                    to_be_overriden: 'one',
                    'object:simple': 'test',
                    'array:0': 'one',
                    'array:1': 'two',
                    'object:array:0': 'one',
                    'object:array:1': 'two',
                });

                process.env['to_be_overridden'] = 'two';
                process.env['MicrosoftAppPassword'] = 'testpassword';
                process.env['runtimeSettings:telemetry:options:connectionString'] = 'testConnectionString';
                process.env['BlobsStorage:CONNECTIONSTRING'] = 'testConnectionString';
            });

            assert.deepStrictEqual(
                pick(
                    memory,
                    'array',
                    'object',
                    'simple',
                    'to_be_overridden',
                    'MicrosoftAppPassword',
                    'runtimeSettings',
                    'BlobsStorage'
                ),
                {
                    array: ['one', 'two'],
                    object: {
                        array: ['one', 'two'],
                        simple: 'test',
                    },
                    simple: 'test',
                    to_be_overridden: 'two',
                    runtimeSettings: {
                        telemetry: {
                            options: {},
                        },
                    },
                    BlobsStorage: {},
                }
            );
        });

        it('gets settings from initialSettings only', async function () {
            const initialSettings = {
                array: ['one', 'two'],
                object: {
                    array: ['one', 'two'],
                    simple: 'test',
                },
                simple: 'test',
                to_be_overridden: 'two',
                MicrosoftAppPassword: 'testpassword',
                runtimeSettings: {
                    telemetry: {
                        options: {
                            connectionString: 'testConnectionString',
                        },
                    },
                },
                BlobsStorage: {
                    CONNECTIONSTRING: 'testConnectionString',
                },
            };

            const resultConfiguration = {
                array: ['one', 'two'],
                object: {
                    array: ['one', 'two'],
                    simple: 'test',
                },
                simple: 'test',
                to_be_overridden: 'two',
                runtimeSettings: {
                    telemetry: {
                        options: {},
                    },
                },
                BlobsStorage: {},
            };

            const { dc, scope } = await initialize(() => {
                // no-op
            }, initialSettings);

            await scope.load(dc);
            const memory = scope.getMemory(dc);

            assert.deepStrictEqual(memory, resultConfiguration);
        });
    });

    describe('ThisMemoryScope', function () {
        async function initialize({ beginDialog = true, dialog = new TestContainer('container') } = {}) {
            const convoState = new ConversationState(new MemoryStorage());

            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(dialog);

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);

            if (beginDialog) {
                await dc.beginDialog(dialog.id);
            }

            const scope = new ThisMemoryScope();

            return { dc, dialog, memory: scope.getMemory(dc), scope };
        }

        it('returns active dialogs state', async function () {
            const { memory } = await initialize({ dialog: new TestDialog('test', 'test message') });
            assert(pick(memory, 'isDialog'), { isDialog: true });
        });

        it('overwrites active dialogs memory', async function () {
            const { dc, memory, scope } = await initialize();
            scope.setMemory(dc, { foo: 'bar' });
            assert(pick(memory, 'foo'), { foo: 'bar' });
        });

        it('raises error if setMemory() called without memory', async function () {
            const { dc, scope } = await initialize();
            assert.throws(() => scope.setMemory(dc, undefined), {
                message: 'ThisMemoryScope.setMemory: undefined memory object passed in.',
            });
        });

        it('raises error if setMemory() called without active dialog', async function () {
            const { dc, scope } = await initialize({ beginDialog: false });
            assert.throws(() => scope.setMemory(dc, { foo: 'bar' }), {
                message: 'ThisMemoryScope.setMemory: no active dialog found.',
            });
        });

        it('raises error if delete() called', async function () {
            const { dc, scope } = await initialize();
            await assert.rejects(scope.delete(dc), {
                message: "MemoryScope.delete: The 'this' memory scope can't be deleted.",
            });
        });
    });

    describe('TurnMemoryScope', function () {
        async function initialize() {
            const convoState = new ConversationState(new MemoryStorage());

            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            const dialog = new TestDialog('test', 'test message');
            dialogs.add(dialog);

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);
            await dc.beginDialog(dialog.id);

            return { dc, scope: new TurnMemoryScope() };
        }

        it('persists changes to turn state', async function () {
            const { dc, scope } = await initialize();

            let memory = scope.getMemory(dc);
            assert(memory);

            memory.foo = 'bar';
            memory = scope.getMemory(dc);

            assert.strictEqual(memory.foo, 'bar');
        });

        it('overwrites values in turn state', async function () {
            const { dc, scope } = await initialize();
            scope.setMemory(dc, { foo: 'bar' });

            const memory = scope.getMemory(dc);
            assert.deepStrictEqual(pick(memory, 'foo'), { foo: 'bar' });
        });

        it('raises error when setMemory() called without memory', async function () {
            const { dc, scope } = await initialize();
            assert.throws(() => scope.setMemory(dc, undefined), {
                message: 'TurnMemoryScope.setMemory: undefined memory object passed in.',
            });
        });

        it('raises error when delete() called', async function () {
            const { dc, scope } = await initialize();
            await assert.rejects(scope.delete(dc), {
                message: "MemoryScope.delete: The 'turn' memory scope can't be deleted.",
            });
        });
    });

    describe('DialogContextMemoryScope', function () {
        async function initialize() {
            const convoState = new ConversationState(new MemoryStorage());

            const dialogState = convoState.createProperty('dialogs');
            const dialogs = new DialogSet(dialogState);
            const dialog = new TestDialog('test', 'test message');
            dialogs.add(dialog);

            const context = new TurnContext(new TestAdapter(), beginMessage);
            const dc = await dialogs.createContext(context);
            await dc.beginDialog(dialog.id);

            const scope = new DialogContextMemoryScope();
            return { dc, memory: scope.getMemory(dc), scope };
        }

        it('gets dialog context', async function () {
            const { memory } = await initialize();

            assert.strictEqual(memory.activeDialog, 'test');
            assert.strictEqual(memory.stack.length, 1);
            assert.strictEqual(memory.parent, undefined);
        });

        it('does not allow setMemory() call', async function () {
            const { dc, scope } = await initialize();
            assert.throws(() => scope.setMemory(dc, {}));
        });
    });
});
