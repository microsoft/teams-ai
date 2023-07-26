const { ActivityTypes, CardFactory, ConversationState, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { ChoicePrompt, ChoiceFactory, DialogSet, ListStyle, DialogTurnStatus } = require('../');
const { PromptCultureModels } = require('../');
const assert = require('assert');

const answerMessage = { text: 'red', type: 'message' };
const invalidMessage = { text: 'purple', type: 'message' };

const stringChoices = ['red', 'green', 'blue'];

describe('ChoicePrompt', function () {
    this.timeout(5000);

    it('should call ChoicePrompt using dc.prompt().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please choose a color.', stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        // Change the ListStyle of the prompt to ListStyle.none.
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should send a prompt and choices if they are passed in via PromptOptions.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should call ChoicePrompt with custom validator.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please choose a color.', stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt', async (prompt) => {
            assert(prompt);
            return prompt.recognized.succeeded;
        });
        choicePrompt.style = ListStyle.none;
        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(invalidMessage)
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should convert incomplete Choices with `action` when using ListStyle.suggestedAction styling.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt(
                    'prompt',
                    'Please choose a color.',
                    stringChoices.map((choice) => {
                        return { value: choice, action: {} };
                    })
                );
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt', async (prompt) => {
            assert(prompt);
            return prompt.recognized.succeeded;
        });
        choicePrompt.style = ListStyle.suggestedAction;
        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(invalidMessage)
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should appropriately apply ListStyle.none when set via PromptOptions', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please choose a color.',
                    choices: stringChoices,
                    style: ListStyle.none,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should send custom retryPrompt.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please choose a color.',
                    retryPrompt: 'Please choose red, blue, or green.',
                    choices: stringChoices,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;
        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(invalidMessage)
            .assertReply('Please choose red, blue, or green.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should send ignore retryPrompt if validator replies.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: 'Please choose a color.',
                    retryPrompt: 'Please choose red, blue, or green.',
                    choices: stringChoices,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt', async (prompt) => {
            assert(prompt);
            if (!prompt.recognized.succeeded) {
                await prompt.context.sendActivity('bad input.');
            }
            return prompt.recognized.succeeded;
        });
        choicePrompt.style = ListStyle.none;
        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(invalidMessage)
            .assertReply('bad input.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should use defaultLocale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt(
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
        dialogs.add(choicePrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: undefined })
            .assertReply(() => {
                assert('Please choose a color. (1) red, (2) green, o (3) blue');
            })
            .send(invalidMessage)
            .assertReply('bad input.')
            .send({ text: 'red', type: ActivityTypes.Message, locale: undefined })
            .assertReply('red')
            .startTest();
    });

    it('should use context.activity.locale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt', async (prompt) => {
            assert(prompt);
            if (!prompt.recognized.succeeded) {
                await prompt.context.sendActivity('bad input.');
            }
            return prompt.recognized.succeeded;
        });
        dialogs.add(choicePrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: 'es-es' })
            .assertReply('Please choose a color. (1) red, (2) green, o (3) blue')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should use context.activity.locale over defaultLocale when rendering choices', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt(
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
        dialogs.add(choicePrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: 'en-us' })
            .assertReply('Please choose a color. (1) red, (2) green, or (3) blue')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should recognize locale variations of correct locales', async function () {
        const locales = ['es-es', 'nl-nl', 'en-us', 'fr-fr', 'de-de', 'it-it', 'ja-jp', 'pt-br', 'zh-cn'];
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
                                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
                            } else if (results.status === DialogTurnStatus.complete) {
                                const selectedChoice = results.result;
                                await turnContext.sendActivity(selectedChoice.value);
                            }
                            await convoState.saveChanges(turnContext);
                        });
                        const convoState = new ConversationState(new MemoryStorage());

                        const dialogState = convoState.createProperty('dialogState');
                        const dialogs = new DialogSet(dialogState);
                        const choicePrompt = new ChoicePrompt(
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
                        dialogs.add(choicePrompt);

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

    it('should default to english locale', async function () {
        const locales = [null, '', 'not-supported'];
        await Promise.all(
            locales.map(async (testLocale) => {
                const adapter = new TestAdapter(async (turnContext) => {
                    const dc = await dialogs.createContext(turnContext);

                    const results = await dc.continueDialog();
                    if (results.status === DialogTurnStatus.empty) {
                        await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
                    } else if (results.status === DialogTurnStatus.complete) {
                        const selectedChoice = results.result;
                        await turnContext.sendActivity(selectedChoice.value);
                    }
                    await convoState.saveChanges(turnContext);
                });
                const convoState = new ConversationState(new MemoryStorage());

                const dialogState = convoState.createProperty('dialogState');
                const dialogs = new DialogSet(dialogState);
                const choicePrompt = new ChoicePrompt(
                    'prompt',
                    async (prompt) => {
                        assert(prompt);
                        if (!prompt.recognized.succeeded) {
                            await prompt.context.sendActivity('bad input.');
                        }
                        return prompt.recognized.succeeded;
                    },
                    null
                );
                dialogs.add(choicePrompt);

                await adapter
                    .send({ text: 'Hello', type: ActivityTypes.Message, locale: testLocale })
                    .assertReply((activity) => {
                        const expectedChoices = ChoiceFactory.inline(stringChoices, null, null, {
                            inlineOr: PromptCultureModels.English.inlineOr,
                            inlineOrMore: PromptCultureModels.English.inlineOrMore,
                            inlineSeparator: PromptCultureModels.English.separator,
                        }).text;
                        assert.strictEqual(activity.text, `Please choose a color.${expectedChoices}`);
                    })
                    .startTest();
            })
        );
    });

    it('should accept and recognize custom locale dict', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: stringChoices });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
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
                inlineOr: culture.inlineOr,
                inlineOrMore: culture.inlineOrMore,
                inlineSeparator: culture.separator,
                includeNumbers: true,
            },
        };

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt(
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
        dialogs.add(choicePrompt);

        await adapter
            .send({ text: 'Hello', type: ActivityTypes.Message, locale: culture.locale })
            .assertReply((activity) => {
                const expectedChoices = ChoiceFactory.inline(stringChoices, undefined, undefined, {
                    inlineOr: culture.inlineOr,
                    inlineOrMore: culture.inlineOrMore,
                    inlineSeparator: culture.separator,
                }).text;
                assert.strictEqual(activity.text, `Please choose a color.${expectedChoices}`);
            })
            .startTest();
    });

    it("should not render choices and not blow up if choices aren't passed in", async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: undefined });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter.send('Hello').assertReply('Please choose a color.').startTest();
    });

    it('should render choices if PromptOptions & choices are passed into DialogContext.prompt()', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', style: ListStyle.inline }, stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color. (1) red, (2) green, or (3) blue')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should send a prompt and choices if they are passed in via third argument in dc.prompt().', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.' }, stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should not recognize if choices are not passed in.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { prompt: 'Please choose a color.', choices: undefined });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send('hello')
            .assertReply('Please choose a color.')
            .startTest();
    });

    it('should use a Partial Activity when calculating message text during appendChoices.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please choose a color.', type: ActivityTypes.Message },
                    choices: stringChoices,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should create prompt with inline choices when specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please choose a color.', type: ActivityTypes.Message },
                    choices: stringChoices,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.inline;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color. (1) red, (2) green, or (3) blue')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should create prompt with list choices when specified.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', {
                    prompt: { text: 'Please choose a color.', type: ActivityTypes.Message },
                    choices: stringChoices,
                });
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        choicePrompt.style = ListStyle.list;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.\n\n   1. red\n   2. green\n   3. blue')
            .send(answerMessage)
            .assertReply('red')
            .startTest();
    });

    it('should recognize valid number choice.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please choose a color.', stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        // Change the ListStyle of the prompt to ListStyle.none.
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter.send('Hello').assertReply('Please choose a color.').send('1').assertReply('red').startTest();
    });

    it('should not recognize, then re-prompt without error for falsy input.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please choose a color.', stringChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        // Change the ListStyle of the prompt to ListStyle.none.
        choicePrompt.style = ListStyle.none;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply('Please choose a color.')
            .send('')
            .assertReply('Please choose a color.')
            .send({ type: ActivityTypes.Message, text: null })
            .assertReply('Please choose a color.')
            .send('1')
            .assertReply('red')
            .startTest();
    });

    it('should display choices on a hero card', async function () {
        const sizeChoices = ['large', 'medium', 'small'];
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', 'Please choose a size.', sizeChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        // Change the ListStyle of the prompt to ListStyle.none.
        choicePrompt.style = ListStyle.heroCard;

        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.heroCard);
                assert(activity.attachments[0].content.text === 'Please choose a size.');
            })
            .send('1')
            .assertReply('large')
            .startTest();
    });

    it('should display choices on a hero card with an additional attachment', async function () {
        const sizeChoices = ['large', 'medium', 'small'];
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', activity, sizeChoices);
            } else if (results.status === DialogTurnStatus.complete) {
                const selectedChoice = results.result;
                await turnContext.sendActivity(selectedChoice.value);
            }
            await convoState.saveChanges(turnContext);
        });
        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and ChoicePrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const choicePrompt = new ChoicePrompt('prompt');
        // Change the ListStyle of the prompt to ListStyle.none.
        choicePrompt.style = ListStyle.heroCard;

        const card = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.2',
            body: [],
        });

        const activity = { attachments: [card], type: ActivityTypes.Message };
        dialogs.add(choicePrompt);

        await adapter
            .send('Hello')
            .assertReply((response) => {
                assert(response.attachments.length === 2);
                assert(response.attachments[0].contentType === CardFactory.contentTypes.adaptiveCard);
                assert(response.attachments[1].contentType === CardFactory.contentTypes.heroCard);
            })
            .startTest();
    });
});
