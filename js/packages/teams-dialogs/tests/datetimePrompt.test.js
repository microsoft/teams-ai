const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { DateTimePrompt, DialogSet, DialogTurnStatus } = require('../');
const assert = require('assert');

const answerMessage = { text: 'January 1st, 2018 at 9am', type: ActivityTypes.Message };
const answerMessage2 = { text: 'September 2nd, 2012', type: ActivityTypes.Message };
const invalidMessage = { text: 'I am not sure', type: ActivityTypes.Message };

describe('DatetimePrompt', function () {
    this.timeout(5000);

    it('should call DateTimePrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please say something.');
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and DateTimePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new DateTimePrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(answerMessage)
            .assertReply('2018-01-01T09')
            .startTest();
    });

    it('should send a prompt if the prompt is passed in via PromptOptions.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please say something.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new DateTimePrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(answerMessage)
            .assertReply('2018-01-01T09')
            .startTest();
    });

    it('should call DateTimePrompt with custom validator.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please say something.');
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new DateTimePrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(answerMessage)
            .assertReply('2018-01-01T09')
            .startTest();
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please say something.',
                    retryPrompt: 'Please provide a valid datetime.',
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new DateTimePrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(invalidMessage)
            .assertReply('Please provide a valid datetime.')
            .send(answerMessage2)
            .assertReply('2012-09-02')
            .startTest();
    });

    it('should send ignore retryPrompt if validator replies.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please say something.',
                    retryPrompt: 'Please provide a valid datetime.',
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new DateTimePrompt('prompt', async (prompt) => {
                assert(prompt);
                if (!prompt.recognized.succeeded) {
                    await prompt.context.sendActivity('That was a bad date.');
                }
                return prompt.recognized.succeeded;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please say something.')
            .send(invalidMessage)
            .assertReply('That was a bad date.')
            .send(answerMessage2)
            .assertReply('2012-09-02')
            .startTest();
    });

    it('should not send any retryPrompt no prompt specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('prompt');
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new DateTimePrompt('prompt', async (prompt) => {
                assert(prompt);
                return prompt.recognized.succeeded;
            })
        );

        await adapter.send('Hello').send(invalidMessage).send(answerMessage2).assertReply('2012-09-02').startTest();
    });

    it('should not recognize, then re-prompt without error for falsy input.', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Enter a date.');
            } else if (results.status === DialogTurnStatus.complete) {
                const dates = results.result;
                await turnContext.sendActivity(dates[0].timex);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and DateTimePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new DateTimePrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Enter a date.')
            .send('')
            .assertReply('Enter a date.')
            .send({ type: ActivityTypes.Message, text: null })
            .assertReply('Enter a date.')
            .send(answerMessage)
            .assertReply('2018-01-01T09')
            .startTest();
    });
});
