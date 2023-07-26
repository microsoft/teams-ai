const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { ActivityPrompt, DialogReason, DialogSet, DialogTurnStatus } = require('../');
const assert = require('assert');

class SimpleActivityPrompt extends ActivityPrompt {
    constructor(id, validator) {
        super(id);
        if (!validator) {
            throw new Error('validator is a required parameter');
        }
        this.validator = validator;
    }
}

describe('ActivityPrompt', function () {
    this.timeout(5000);

    it('should call ActivityPrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please send an activity.');
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result.text;
                await turnContext.sendActivity(`You said ${reply}`);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and TextPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new SimpleActivityPrompt('prompt', async (prompt) => {
                assert(prompt, 'validator missing PromptValidatorContext.');
                assert(typeof prompt.recognized.value === 'object', 'recognized.value was not an object.');
                return true;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send an activity.')
            .send('test')
            .assertReply('You said test')
            .startTest();
    });

    it('should re-prompt with original prompt if validator returned false.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please send an activity.');
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result.text;
                await turnContext.sendActivity(`You said ${reply}`);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new SimpleActivityPrompt('prompt', async (prompt) => {
                assert(prompt, 'validator missing PromptValidatorContext.');
                assert(typeof prompt.recognized.value === 'object', 'recognized.value was not an object.');
                return false;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send an activity.')
            .send('test')
            .assertReply('Please send an activity.')
            .startTest();
    });

    it('should re-prompt with custom retryPrompt if validator returned false.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send activity.', retryPrompt: 'Activity not received.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result.text;
                await turnContext.sendActivity(`You said ${reply}`);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(
            new SimpleActivityPrompt('prompt', async (prompt) => {
                assert(prompt, 'validator missing PromptValidatorContext.');
                assert(typeof prompt.recognized.value === 'object', 'recognized.value was not an object.');
                return false;
            })
        );

        await adapter
            .send('Hello')
            .assertReply('Please send activity.')
            .send('test')
            .assertReply('Activity not received.')
            .startTest();
    });

    it('should see attemptCount increment.', async function () {
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);

        dialogs.add(
            new SimpleActivityPrompt('prompt', async (prompt) => {
                assert(prompt, 'validator missing PromptValidatorContext.');
                assert(typeof prompt.recognized.value === 'object', 'recognized.value was not an object.');
                if (prompt.recognized.value.type !== ActivityTypes.Event) {
                    prompt.context.sendActivity(`attemptCount ${prompt.attemptCount}`);
                    return false;
                }
                return true;
            })
        );

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please send activity.', retryPrompt: 'Activity not received.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const reply = results.result.type;
                await turnContext.sendActivity(`You sent a(n) ${reply}`);
            }
            await convoState.saveChanges(turnContext);
        });

        await adapter
            .send('Hello')
            .assertReply('Please send activity.')
            .send('100')
            .assertReply('attemptCount 1')
            .send('200')
            .assertReply('attemptCount 2')
            .send('300')
            .assertReply('attemptCount 3')
            .send({ type: ActivityTypes.Event })
            .assertReply(`You sent a(n) ${ActivityTypes.Event}`)
            .send('Another!')
            .assertReply('Please send activity.')
            .send('100')
            .assertReply('attemptCount 1')
            .send('200')
            .assertReply('attemptCount 2')
            .send('300')
            .assertReply('attemptCount 3')
            .send({ type: ActivityTypes.Event })
            .assertReply(`You sent a(n) ${ActivityTypes.Event}`)
            .startTest();
    });

    it('should not have resumeDialog() use the retry prompt.', async function () {
        const convoState = new ConversationState(new MemoryStorage());
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new SimpleActivityPrompt('prompt', () => Promise.resolve(false));

        dialogs.add(prompt);

        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            switch (turnContext.activity.text) {
                case 'begin': {
                    const options = {
                        prompt: 'please send an event.',
                        retryPrompt: 'Retrying - please send an event.',
                    };

                    await dc.prompt('prompt', options);
                    break;
                }
                case 'continue': {
                    await prompt.continueDialog(dc);
                    break;
                }
                case 'resume': {
                    await prompt.resumeDialog(dc, DialogReason.nextCalled);
                    break;
                }
            }

            await convoState.saveChanges(turnContext);
        });

        await adapter
            .send('begin')
            .assertReply('please send an event.')
            .send('continue')
            .assertReply('Retrying - please send an event.')
            .send('resume')
            // 'resumeDialog' of ActivityPrompt does NOT cause a retry
            .assertReply('please send an event.')
            .startTest();
    });
});
