const assert = require('assert');
const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { DialogSet, NumberPrompt, DialogTurnStatus } = require('../');

describe('NumberPrompt', function () {
    this.timeout(5000);

    const createAdapter = (onEmpty, onComplete, validator, defaultLocale) => {
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');

        const dialogs = new DialogSet(dialogState);

        const prompt = new NumberPrompt('prompt', validator, defaultLocale);
        dialogs.add(prompt);

        const adapter = new TestAdapter(async (turnContext) => {
            const dialogContext = await dialogs.createContext(turnContext);

            const results = await dialogContext.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await onEmpty(dialogContext);
            } else if (results.status === DialogTurnStatus.complete) {
                await onComplete(turnContext, results.result);
            }

            await convoState.saveChanges(turnContext);
        });

        return adapter;
    };

    it('should call NumberPrompt using dc.prompt().', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, result) => turnContext.sendActivity(result.toString())
        );

        await adapter.send('Hello').assertReply('Please send a number.').send('35').assertReply('35').startTest();
    });

    it('should call NumberPrompt with custom validator.', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, result) => turnContext.sendActivity(result.toString()),
            (prompt) => {
                assert(prompt);
                const value = prompt.recognized.value;
                return value !== undefined && value >= 1 && value <= 100;
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Please send a number.')
            .send('0')
            .assertReply('Please send a number.')
            .send('25')
            .assertReply('25')
            .startTest();
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = createAdapter(
            (dialogContext) =>
                dialogContext.prompt('prompt', {
                    prompt: 'Please send a number.',
                    retryPrompt: 'Please send a number between 1 and 100.',
                }),
            (turnContext, result) => turnContext.sendActivity(result.toString()),
            (prompt) => {
                assert(prompt);
                const value = prompt.recognized.value;
                return value !== undefined && value >= 1 && value <= 100;
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Please send a number.')
            .send('0')
            .assertReply('Please send a number between 1 and 100.')
            .send('42')
            .assertReply('42')
            .startTest();
    });

    it('should send ignore retryPrompt if validator replies.', async function () {
        const adapter = createAdapter(
            (dialogContext) =>
                dialogContext.prompt('prompt', {
                    prompt: 'Please send a number.',
                    retryPrompt: 'Please send a number between 1 and 100.',
                }),
            (turnContext, result) => turnContext.sendActivity(result.toString()),
            async (prompt) => {
                assert(prompt);
                const value = prompt.recognized.value;
                const valid = value !== undefined && value >= 1 && value <= 100;
                if (!valid) {
                    await prompt.context.sendActivity('out of range');
                }
                return valid;
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Please send a number.')
            .send('-1')
            .assertReply('out of range')
            .send('67')
            .assertReply('67')
            .startTest();
    });

    it('should not send any retryPrompt no prompt specified.', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.beginDialog('prompt'),
            (turnContext, result) => turnContext.sendActivity(result.toString()),
            (prompt) => {
                assert(prompt);
                const value = prompt.recognized.value;
                return value !== undefined && value >= 1 && value <= 100;
            }
        );

        await adapter.send('Hello').send('0').send('25').assertReply('25').startTest();
    });

    it('should recognize 0 and zero as valid values', async function () {
        const adapter = createAdapter(
            (dialogContext) =>
                dialogContext.prompt('prompt', { prompt: 'Send me a zero', retryPrompt: 'Send 0 or zero' }),
            (turnContext, result) => turnContext.sendActivity(result.toString()),
            (prompt) => {
                assert(prompt);
                return prompt.recognized.value === 0;
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Send me a zero')
            .send('100')
            .assertReply('Send 0 or zero')
            .send('0')
            .assertReply('0')
            .send('Another!')
            .assertReply('Send me a zero')
            .send('zero')
            .assertReply('0')
            .startTest();
    });

    it('should see attemptCount increment', async function () {
        const adapter = createAdapter(
            (dialogContext) =>
                dialogContext.prompt('prompt', { prompt: 'Send me a zero', retryPrompt: 'Send 0 or zero' }),
            (turnContext) => turnContext.sendActivity('ok'),
            async (prompt) => {
                if (prompt.recognized.value !== 0) {
                    await prompt.context.sendActivity(`attemptCount ${prompt.attemptCount}`);
                    return false;
                }

                return true;
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Send me a zero')
            .send('100')
            .assertReply('attemptCount 1')
            .send('200')
            .assertReply('attemptCount 2')
            .send('300')
            .assertReply('attemptCount 3')
            .send('0')
            .assertReply('ok')
            .send('Another!')
            .assertReply('Send me a zero')
            .send('100')
            .assertReply('attemptCount 1')
            .send('200')
            .assertReply('attemptCount 2')
            .send('300')
            .assertReply('attemptCount 3')
            .send('0')
            .assertReply('ok')
            .startTest();
    });

    it('should consider culture specified in constructor', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, reply) => {
                assert.strictEqual(reply, 3.14);
                return turnContext.sendActivity(reply);
            },
            undefined,
            'es-es'
        );

        await adapter.send('Hello').assertReply('Please send a number.').send('3,14').startTest();
    });

    it('should consider culture specified in activity', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, reply) => {
                assert.strictEqual(reply, 3.14);
                return turnContext.sendActivity(reply);
            },
            undefined,
            'en-us'
        );

        await adapter
            .send('Hello')
            .assertReply('Please send a number.')
            .send({ type: ActivityTypes.Message, text: '3,14', locale: 'es-es' })
            .startTest();
    });

    it('should consider default to en-us culture when no culture is specified', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, reply) => {
                assert.strictEqual(reply, 1500.25);
                return turnContext.sendActivity(reply);
            }
        );

        await adapter.send('Hello').assertReply('Please send a number.').send('1,500.25').startTest();
    });

    it('should fall back to default locale if culture is not registered', async function () {
        const adapter = createAdapter(
            (dialogContext) => dialogContext.prompt('prompt', 'Please send a number.'),
            (turnContext, reply) => {
                assert.strictEqual(reply, 3.14);
                return turnContext.sendActivity(reply);
            }
        );

        await adapter
            .send('Hello')
            .assertReply('Please send a number.')
            .send({ type: ActivityTypes.Message, text: '3,14', locale: 'it-it' })
            .startTest();
    });
});
