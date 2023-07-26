const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { DialogSet, TextPrompt, DialogTurnStatus } = require('../');
const assert = require('assert');
const lineReader = require('line-reader');
const path = require('path');

const invalidMessage = { type: ActivityTypes.Message, text: '' };

describe('TextPrompt', function () {
    this.timeout(5000);

    it('should call TextPrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please say something.');
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result;
                await turnContext.sendActivity(reply);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and TextPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new TextPrompt('prompt'));

        await adapter.send('Hello').assertReply('Please say something.').send('test').assertReply('test').startTest();
    });

    it('should call TextPrompt with custom validator.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please say something.');
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result;
                await turnContext.sendActivity(reply);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new TextPrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.value.length >= 3;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send('i')
            .assertReply('Please say something.')
            .send('test')
            .assertReply('test')
            .startTest();
    });

    it('should call TextPrompt with naughty strings.', async function () {
        const filePath = path.join(__dirname, 'Resources', 'naughtyStrings.txt');

        lineReader.eachLine(filePath, async (naughtyString) => {
            if (naughtyString.trim() && !naughtyString.startsWith('#')) {
                const convoState = new ConversationState(new MemoryStorage());
                const dialogState = convoState.createProperty('dialogState');
                const dialogs = new DialogSet(dialogState);
                dialogs.add(new TextPrompt('prompt'));

                const adapter = new TestAdapter(async (turnContext) => {
                    const dc = await dialogs.createContext(turnContext);
                    const results = await dc.continueDialog();
                    if (results.status === DialogTurnStatus.empty) {
                        await dc.prompt('prompt', { prompt: 'Enter some text' });
                    } else if (results.status === DialogTurnStatus.complete) {
                        const reply = results.result;
                        await turnContext.sendActivity(reply);
                    }
                    await convoState.saveChanges(turnContext);
                });

                await adapter
                    .send('Hello')
                    .assertReply('Enter some text')
                    .send(naughtyString)
                    .assertReply(naughtyString)
                    .startTest();
            }
        });
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please say something.', retryPrompt: 'Text is required.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result;
                await turnContext.sendActivity(reply);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new TextPrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(invalidMessage)
            .assertReply('Text is required.')
            .send('test')
            .assertReply('test')
            .startTest();
    });

    it('should send ignore retryPrompt if validator replies.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please say something.', retryPrompt: 'Text is required.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result;
                await turnContext.sendActivity(reply);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new TextPrompt('prompt', async (prompt) => {
                assert(prompt);
                const valid = prompt.recognized.value.length >= 3;
                if (!valid) {
                    await prompt.context.sendActivity('too short');
                }
                return valid;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send('i')
            .assertReply('too short')
            .send('test')
            .assertReply('test')
            .startTest();
    });

    it('should not send any retryPrompt no prompt specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('prompt');
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result;
                await turnContext.sendActivity(reply);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new TextPrompt('prompt'));

        await adapter.send('Hello').send(invalidMessage).send('test').assertReply('test').startTest();
    });
});
