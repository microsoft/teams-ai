const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { ConfirmPrompt, DialogSet, DialogTurnStatus, ListStyle } = require('../');
const assert = require('assert');

const invalidMessage = { text: 'what?', type: 'message' };

describe('ConfirmPrompt', function () {
    this.timeout(5000);

    it('should call ConfirmPrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm.' });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and AttachmentPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new ConfirmPrompt('prompt'));

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('yes')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should call ConfirmPrompt with custom validator.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm. Yes or No' });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt', async (prompt) => {
            assert(prompt, 'PromptValidatorContext not found.');
            return prompt.recognized.succeeded;
        });
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please confirm. Yes or No',
                    retryPrompt: "Please reply with 'Yes' or 'No'.",
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt');
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('what?')
            .assertReply("Please reply with 'Yes' or 'No'.")
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should send custom retryPrompt if validator does not reply.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please confirm. Yes or No',
                    retryPrompt: "Please reply with 'Yes' or 'No'.",
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt', async (prompt) => {
            assert(prompt, 'PromptValidatorContext not found.');
            return prompt.recognized.succeeded;
        });
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('what?')
            .assertReply("Please reply with 'Yes' or 'No'.")
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should ignore retryPrompt if validator replies.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please confirm. Yes or No',
                    retryPrompt: "Please reply with 'Yes' or 'No'.",
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt', async (prompt) => {
            assert(prompt, 'PromptValidatorContext not found.');
            if (!prompt.recognized.succeeded) {
                await prompt.context.sendActivity('The correct response is either yes or no. Please choose one.');
            }
            return prompt.recognized.succeeded;
        });
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('what?')
            .assertReply('The correct response is either yes or no. Please choose one.')
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should not send any retryPrompt if no prompt is specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog('prompt');
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt');
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('')
            .send('what?')
            .assertReply('')
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should send retryPrompt if user sends attachment and no text.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please confirm. Yes or No',
                    retryPrompt: "Please reply with 'Yes' or 'No'.",
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt');
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send({ type: ActivityTypes.Message, attachments: ['ignoreThis'] })
            .assertReply("Please reply with 'Yes' or 'No'.")
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should not recognize, then re-prompt without error for falsy input.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please confirm. Yes or No',
                    retryPrompt: "Please reply with 'Yes' or 'No'.",
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt');
        confirmPrompt.style = ListStyle.none;
        dialogs.add(confirmPrompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('')
            .assertReply("Please reply with 'Yes' or 'No'.")
            .send({ type: ActivityTypes.Message, text: null })
            .assertReply("Please reply with 'Yes' or 'No'.")
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should use defaultLocale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const confirmed = results.result;
                if (confirmed) {
                    await turnContext.sendActivity('true');
                } else {
                    await turnContext.sendActivity('false');
                }
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt(
            'prompt',
            async (prompt) => {
                assert(prompt);
                if (!prompt.recognized.succeeded) {
                    await prompt.context.sendActivity('bad input.');
                }
                return prompt.recognized.succeeded;
            },
            'ja-jp'
        );
        dialogs.add(confirmPrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message })
            .assertReply('Please confirm. (1) はい または (2) いいえ')
            .send(invalidMessage)
            .assertReply('bad input.')
            .send({ text: 'はい', type: ActivityTypes.Message })
            .assertReply('true')
            .startTest();
    });

    it('should use context.activity.locale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const confirmed = results.result;
                if (confirmed) {
                    await turnContext.sendActivity('true');
                } else {
                    await turnContext.sendActivity('false');
                }
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt('prompt', async (prompt) => {
            assert(prompt);
            if (!prompt.recognized.succeeded) {
                await prompt.context.sendActivity('bad input.');
            }
            return prompt.recognized.succeeded;
        });
        dialogs.add(confirmPrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: 'ja-jp' })
            .assertReply('Please confirm. (1) はい または (2) いいえ')
            .send({ text: 'いいえ', type: ActivityTypes.Message, locale: 'ja-jp' })
            .assertReply('false')
            .startTest();
    });

    it('should use context.activity.locale over defaultLocale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const confirmed = results.result;
                if (confirmed) {
                    await turnContext.sendActivity('true');
                } else {
                    await turnContext.sendActivity('false');
                }
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt(
            'prompt',
            async (prompt) => {
                assert(prompt);
                if (!prompt.recognized.succeeded) {
                    await prompt.context.sendActivity('bad input.');
                }
                return prompt.recognized.succeeded;
            },
            'es-es'
        );
        dialogs.add(confirmPrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: 'ja-jp' })
            .assertReply('Please confirm. (1) はい または (2) いいえ')
            .send({ text: 'いいえ', type: ActivityTypes.Message, locale: 'ja-jp' })
            .assertReply('false')
            .startTest();
    });

    it('should recognize locale variations of correct locales', async function () {
        const locales = ['es-es', 'nl-nl', 'en-us', 'fr-fr', 'de-de', 'ja-jp', 'it-it', 'pt-br', 'zh-cn'];
        // es-ES
        const capEnding = (locale) => {
            return `${locale.split('-')[0]}-${locale.split('-')[1].toUpperCase()}`;
        };
        // es-Es
        const titleEnding = (locale) => {
            locale[3] = locale.charAt(3).toUpperCase();
            return locale;
        };
        // ES
        const capTwoLetter = (locale) => {
            return locale.split('-')[0].toUpperCase();
        };
        // es
        const lowerTwoLetter = (locale) => {
            return locale.split('-')[0].toLowerCase();
        };

        // This creates an object of the correct locale along with its test locales
        const localeTests = locales.reduce((obj, locale) => {
            obj[locale] = [
                locale,
                capEnding(locale),
                titleEnding(locale),
                capTwoLetter(locale),
                lowerTwoLetter(locale),
            ];
            return obj;
        }, {});

        // Test each valid locale
        await Promise.all(
            Object.keys(localeTests).map(async (validLocale) => {
                // Hold the correct answer from when a valid locale is used
                let expectedAnswer;
                // Test each of the test locales
                await Promise.all(
                    localeTests[validLocale].map(async (testLocale) => {
                        const adapter = new TestAdapter(async (turnContext) => {
                            const dc = await dialogs.createContext(turnContext);

                            const results = await dc.continueDialog();
                            if (results.status === DialogTurnStatus.empty) {
                                await dc.prompt('prompt', { prompt: 'Please confirm.' });
                            } else if (results.status === DialogTurnStatus.complete) {
                                const confirmed = results.result;
                                if (confirmed) {
                                    await turnContext.sendActivity('true');
                                } else {
                                    await turnContext.sendActivity('false');
                                }
                            }
                            await convoState.saveChanges(turnContext);
                        });
                        const convoState = new ConversationState(new MemoryStorage());

                        const dialogState = convoState.createProperty('dialogState');
                        const dialogs = new DialogSet(dialogState);
                        const confirmPrompt = new ConfirmPrompt(
                            'prompt',
                            async (prompt) => {
                                assert(prompt);
                                if (!prompt.recognized.succeeded) {
                                    await prompt.context.sendActivity('bad input.');
                                }
                                return prompt.recognized.succeeded;
                            },
                            testLocale
                        );
                        dialogs.add(confirmPrompt);

                        await adapter
                            .send({ text: 'Hello', type: ActivityTypes.Message, locale: testLocale })
                            .assertReply((activity) => {
                                // if the valid locale is tested, save the answer because then we can test to see
                                //    if the test locales produce the same answer
                                if (validLocale === testLocale) {
                                    expectedAnswer = activity.text;
                                }
                                assert.strictEqual(activity.text, expectedAnswer);
                            })
                            .startTest();
                    })
                );
            })
        );
    });

    it('should accept and recognize custom locale dict', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please confirm.' });
            } else if (results.status === DialogTurnStatus.complete) {
                const confirmed = results.result;
                if (confirmed) {
                    await turnContext.sendActivity('true');
                } else {
                    await turnContext.sendActivity('false');
                }
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const culture = {
            inlineOr: ' customOr ',
            inlineOrMore: ' customOrMore ',
            locale: 'custom-custom',
            separator: 'customSeparator',
            noInLanguage: 'customNo',
            yesInLanguage: 'customYes',
        };

        const customDict = {
            [culture.locale]: {
                choices: [culture.yesInLanguage, culture.noInLanguage],
                options: {
                    inlineSeparator: culture.separator,
                    inlineOr: culture.inlineOr,
                    inlineOrMore: culture.inlineOrMore,
                    includeNumbers: true,
                },
            },
        };

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const confirmPrompt = new ConfirmPrompt(
            'prompt',
            async (prompt) => {
                assert(prompt);
                if (!prompt.recognized.succeeded) {
                    await prompt.context.sendActivity('bad input.');
                }
                return prompt.recognized.succeeded;
            },
            culture.locale,
            customDict
        );
        dialogs.add(confirmPrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: culture.locale })
            .assertReply('Please confirm. (1) customYes customOr (2) customNo')
            .send('customYes')
            .assertReply('true')
            .startTest();
    });

    it('should recognize yes with no PromptOptions.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt');
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply(' (1) Yes or (2) No')
            .send('lala')
            .assertReply(' (1) Yes or (2) No')
            .send('yes')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should recognize valid number when choiceOptions.includeNumbers is true.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('lala')
            .assertReply('Please confirm, say "yes" or "no" or something like that. (1) Yes or (2) No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should recognize valid number and default to en if locale is null.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            turnContext.activity.locale = null;

            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('lala')
            .assertReply('Please confirm, say "yes" or "no" or something like that. (1) Yes or (2) No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should recognize valid number and default to en if locale invalid string.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            turnContext.activity.locale = 'invalid-locale';

            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('lala')
            .assertReply('Please confirm, say "yes" or "no" or something like that. (1) Yes or (2) No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should recognize valid number and default to en if defaultLocale invalid string.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt', undefined, 'invalid-locale');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('lala')
            .assertReply('Please confirm, say "yes" or "no" or something like that. (1) Yes or (2) No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should accept and recognize other languages', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                    recognizeLanguage: 'es-es',
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);

        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: false };
        dialogs.add(prompt);

        await adapter
            .send('Hola')
            .assertReply('Please confirm. Yes or No')
            .send('Si')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should not recognize invalid number when choiceOptions.includeNumbers is true.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: true };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. (1) Yes or (2) No')
            .send('400')
            .assertReply('Please confirm, say "yes" or "no" or something like that. (1) Yes or (2) No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });

    it('should not recognize valid number choice when choiceOptions.includeNumbers is false.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: false, inlineSeparator: '~' };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('1')
            .assertReply('Please confirm, say "yes" or "no" or something like that. Yes or No')
            .send('no')
            .assertReply("The result found is 'false'.")
            .startTest();
    });

    it('should recognize valid number when choiceOptions.includeNumbers is undefined.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please confirm.', type: ActivityTypes.Message },
                    retryPrompt: {
                        text: 'Please confirm, say "yes" or "no" or something like that.',
                        type: ActivityTypes.Message,
                    },
                });
            } else if (results.status === DialogTurnStatus.complete) {
                await turnContext.sendActivity(`The result found is '${results.result}'.`);
            }
            await convoState.saveChanges(turnContext);
        });

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const prompt = new ConfirmPrompt('prompt');
        prompt.choiceOptions = { includeNumbers: undefined };
        dialogs.add(prompt);

        await adapter
            .send('Hello')
            .assertReply('Please confirm. Yes or No')
            .send('lala')
            .assertReply('Please confirm, say "yes" or "no" or something like that. Yes or No')
            .send('1')
            .assertReply("The result found is 'true'.")
            .startTest();
    });
});
