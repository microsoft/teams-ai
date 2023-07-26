const { ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { AttachmentPrompt, DialogSet, DialogTurnStatus } = require('../');
const assert = require('assert');

const answerMessage = {
    text: 'here you go',
    type: 'message',
    attachments: [{ contentType: 'test', content: 'test1' }],
};
const invalidMessage = { text: 'what?', type: 'message' };

describe('AttachmentPrompt', function () {
    this.timeout(5000);

    it('should call AttachmentPrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send an attachment.' });
            } else if (results.status === DialogTurnStatus.complete) {
                assert(Array.isArray(results.result) && results.result.length > 0);
                const attachment = results.result[0];
                await turnContext.sendActivity(`${attachment.content}`);
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage
        const convoState = new ConversationState(new MemoryStorage());
        // adapter.use(convoState);

        // Create a DialogState property, DialogSet and AttachmentPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new AttachmentPrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Please send an attachment.')
            .send(answerMessage)
            .assertReply('test1')
            .startTest();
    });

    it('should call AttachmentPrompt with custom validator.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send an attachment.' });
            } else if (results.status === DialogTurnStatus.complete) {
                assert(Array.isArray(results.result) && results.result.length > 0);
                const attachment = results.result[0];
                await turnContext.sendActivity(`${attachment.content}`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new AttachmentPrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send an attachment.')
            .send(answerMessage)
            .assertReply('test1')
            .startTest();
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send an attachment.', retryPrompt: 'Please try again.' });
            } else if (results.status === DialogTurnStatus.complete) {
                assert(Array.isArray(results.result) && results.result.length > 0);
                const attachment = results.result[0];
                await turnContext.sendActivity(`${attachment.content}`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new AttachmentPrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send an attachment.')
            .send(invalidMessage)
            .assertReply('Please try again.')
            .send(answerMessage)
            .assertReply('test1')
            .startTest();
    });

    it('should send ignore retryPrompt if validator replies.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send an attachment.', retryPrompt: 'Please try again.' });
            } else if (results.status === DialogTurnStatus.complete) {
                assert(Array.isArray(results.result) && results.result.length > 0);
                const attachment = results.result[0];
                await turnContext.sendActivity(`${attachment.content}`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new AttachmentPrompt('prompt', async (prompt) => {
                assert(prompt);

                if (!prompt.recognized.succeeded) {
                    await prompt.context.sendActivity('Bad input.');
                }
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send an attachment.')
            .send(invalidMessage)
            .assertReply('Bad input.')
            .send(answerMessage)
            .assertReply('test1')
            .startTest();
    });

    it('should not send any retryPrompt if no prompt is specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('prompt');
            } else if (results.status === DialogTurnStatus.complete) {
                assert(Array.isArray(results.result) && results.result.length > 0);
                const attachment = results.result[0];
                await turnContext.sendActivity(`${attachment.content}`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new AttachmentPrompt('prompt'));

        await adapter.send('Hello').send('what?').send(answerMessage).assertReply('test1').startTest();
    });
});
