import assert from 'assert';
import { ActivityTypes, InvokeResponse, TestAdapter, TurnContext } from 'botbuilder';
import * as sinon from 'sinon';

import { AdaptiveCard, AdaptiveCardSearchResult, AdaptiveCards, AdaptiveCardsSearchParams, TurnState } from '.';
import { Application, Query, RouteSelector } from './Application';
import { createTestTurnContextAndState } from './internals/testing/TestUtilities';

describe('AdaptiveCards', () => {
    let adaptiveCards: AdaptiveCards<TurnState>;
    let app: Application;
    let selector: RouteSelector;
    let handler: any;
    let addRouteStub: sinon.SinonStub;
    let adapter: TestAdapter;

    beforeEach(() => {
        adapter = new TestAdapter();
        app = new Application();
        adaptiveCards = new AdaptiveCards(app);
        selector = null as unknown as RouteSelector;
        handler = undefined;
        sinon.restore();
        addRouteStub = sinon.stub(app, 'addRoute').callsFake((s, h) => {
            selector = s;
            handler = h;

            return app;
        });
    });

    describe('actionExecute()', () => {
        const testVerb = 'testVerb';
        const testHandler = (context: TurnContext, state: TurnState, data: Record<string, any>) =>
            Promise.resolve('test');

        it('should call application addRoute', () => {
            adaptiveCards.actionExecute(testVerb, testHandler);

            assert(addRouteStub.calledOnce);
        });

        describe('createActionExecuteSelector()', () => {
            it('verb is a function', () => {
                const verb: RouteSelector = () => Promise.resolve(true);

                adaptiveCards.actionExecute(verb, testHandler);

                assert(selector === verb);
            });

            describe('verb is a regular expression', () => {
                const verb = new RegExp('test');

                beforeEach(() => {
                    adaptiveCards.actionExecute(verb, testHandler);
                });

                it('incoming activity is valid invoke type', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'adaptiveCard/action',
                        value: {
                            action: {
                                type: 'Action.Execute',
                                verb: 'test'
                            }
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == true);
                });

                it('incomming activity is invalid', async () => {
                    const activity = {
                        type: 'NotInvoke'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });

            describe('verb is a string', () => {
                const verb = 'test';

                beforeEach(() => {
                    adaptiveCards.actionExecute(verb, testHandler);
                });

                it('activity is valid invoke type', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'adaptiveCard/action',
                        value: {
                            action: {
                                type: 'Action.Execute',
                                verb: 'test'
                            }
                        }
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == true);
                });

                it('activity is invalid', async () => {
                    const activity = {
                        type: 'NotInvoke'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });
        });

        describe('handler creation logic', () => {
            it('should create handler', () => {
                adaptiveCards.actionExecute(testVerb, testHandler);

                assert(typeof handler === 'function');
            });

            it('should throw error if incomming activity is not valid', async () => {
                adaptiveCards.actionExecute(testVerb, testHandler);

                const activity = {
                    type: 'invalidActivityType'
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();
                const errorMsg = `Unexpected AdaptiveCards.actionExecute() triggered for activity type: invalidActivityType`;

                assert.rejects(async () => await handler(context, state), errorMsg);
            });

            it('should call the test handler with the correct parameters', async () => {
                const testHandlerStub = sinon.spy(testHandler);

                adaptiveCards.actionExecute(testVerb, testHandlerStub);

                const activity = {
                    type: 'invoke',
                    name: 'adaptiveCard/action',
                    value: {
                        action: {
                            type: 'Action.Execute',
                            verb: 'verb',
                            data: {
                                test: 'test'
                            }
                        }
                    }
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                assert(testHandlerStub.calledOnce);
                assert(testHandlerStub.calledWith(context, state, activity.value.action.data));
            });

            it('should send an invoke response value adaptive card if handler returns adaptive card.', async () => {
                const returnedAdaptiveCard = {
                    type: 'AdaptiveCard',
                    body: [
                        {
                            type: 'TextBlock',
                            text: 'test'
                        }
                    ]
                };

                const testHandler = (
                    context: TurnContext,
                    state: TurnState,
                    data: Record<string, any>
                ): Promise<AdaptiveCard | string> => {
                    return Promise.resolve(returnedAdaptiveCard) as any;
                };

                adaptiveCards.actionExecute(testVerb, testHandler);

                const activity = {
                    type: 'invoke',
                    name: 'adaptiveCard/action',
                    value: {
                        action: {
                            type: 'Action.Execute',
                            verb: 'verb'
                        }
                    }
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const contextSendActivityStub = sinon.stub(context, 'sendActivity');
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                const response = {
                    statusCode: 200,
                    type: 'application/vnd.microsoft.card.adaptive',
                    value: returnedAdaptiveCard
                };

                assert(
                    contextSendActivityStub.calledOnceWith({
                        value: { body: response, status: 200 } as InvokeResponse,
                        type: ActivityTypes.InvokeResponse
                    })
                );
            });

            it('should send an invoke response value as message if handler returns string.', async () => {
                const returnedString = 'returnedString';

                const testHandler = (
                    context: TurnContext,
                    state: TurnState,
                    data: Record<string, any>
                ): Promise<AdaptiveCard | string> => {
                    return Promise.resolve(returnedString) as any;
                };

                adaptiveCards.actionExecute(testVerb, testHandler);

                const activity = {
                    type: 'invoke',
                    name: 'adaptiveCard/action',
                    value: {
                        action: {
                            type: 'Action.Execute',
                            verb: 'verb'
                        }
                    }
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const contextSendActivityStub = sinon.stub(context, 'sendActivity');
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                const response = {
                    statusCode: 200,
                    type: 'application/vnd.microsoft.activity.message',
                    value: returnedString
                };

                assert(
                    contextSendActivityStub.calledOnceWith({
                        value: { body: response, status: 200 } as InvokeResponse,
                        type: ActivityTypes.InvokeResponse
                    })
                );
            });
        });
    });

    describe('actionSubmit()', () => {
        const testVerb = 'testVerb';
        const testHandler = (context: TurnContext, state: TurnState, data: Record<string, any>) => Promise.resolve();

        it('should call application addRoute', () => {
            adaptiveCards.actionSubmit(testVerb, testHandler);

            assert(addRouteStub.calledOnce);
        });

        describe('createActionSubmitSelector()', () => {
            it('verb is a function', () => {
                const verb: RouteSelector = () => Promise.resolve(true);

                adaptiveCards.actionSubmit(verb, testHandler);

                assert(selector === verb);
            });

            describe('verb is a regular expression', () => {
                const verbRegex = new RegExp('test');

                beforeEach(() => {
                    adaptiveCards.actionSubmit(verbRegex, testHandler);
                });

                it('incomming activity is valid action submit type and should match regex', async () => {
                    // a valid action submit type is a message activity with a value property.
                    const activity = {
                        type: 'message',
                        value: {
                            // "verb" key is the default filter
                            verb: 'test'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.verb` matches the regex `verbRegex`.
                    assert((await selector(context)) == true);
                });

                it('incomming activity is valid action submit type and should not match regex ', async () => {
                    // a valid action submit type is a message activity with a value property.
                    const activity = {
                        type: 'message',
                        value: {
                            // "verb" key is the default filter
                            verb: 'verbThatDoesNotMatchRegex'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.verb` matches the regex `verbRegex`.
                    assert((await selector(context)) == false);
                });

                it('incomming activity is invalid', async () => {
                    const activity = {
                        type: 'notActionSubmit'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });

            describe('verb is a string', () => {
                const verb = 'test';

                beforeEach(() => {
                    adaptiveCards.actionSubmit(verb, testHandler);
                });

                it('activity is valid action submit type and verb matches', async () => {
                    // a valid action submit type is a message activity with a value property and no text.
                    const activity = {
                        type: 'message',
                        value: {
                            // "verb" key is the default filter
                            verb: 'test'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.verb` == `verb`.
                    assert((await selector(context)) == true);
                });

                it('activity is valid action submit type and verbs are not equal', async () => {
                    // a valid action submit type is a message activity with a value property.
                    const activity = {
                        type: 'message',
                        value: {
                            // "verb" key is the default filter
                            verb: 'notEqualToTest'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.verb` == `verb`.
                    assert((await selector(context)) == false);
                });

                it('activity is invalid', async () => {
                    const activity = {
                        type: 'NotActionSubmit'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });
        });

        describe('handler creation logic', () => {
            it('should create handler', () => {
                adaptiveCards.actionSubmit(testVerb, testHandler);

                assert(typeof handler === 'function');
            });

            it('should throw error if incomming activity is not valid', async () => {
                adaptiveCards.actionSubmit(testVerb, testHandler);

                const activity = {
                    type: 'invalidActivityType'
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();
                const errorMsg = `Unexpected AdaptiveCards.actionSubmit() triggered for activity type: invalidActivityType`;

                assert.rejects(async () => await handler(context, state), errorMsg);
            });

            it('should call the test handler with the correct parameters', async () => {
                const testHandlerStub = sinon.spy(testHandler);

                adaptiveCards.actionSubmit(testVerb, testHandlerStub);

                const activity = {
                    type: 'message',
                    value: {
                        // "verb" key is the default filter
                        verb: 'test'
                    }
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                assert(testHandlerStub.calledOnce);
                assert(testHandlerStub.calledWith(context, state, activity.value));
            });
        });
    });

    describe('search()', () => {
        const testDataset = 'testDataSet';
        const testHandler = (
            context: TurnContext,
            state: TurnState,
            query: Query<AdaptiveCardsSearchParams>
        ): Promise<AdaptiveCardSearchResult[]> =>
            Promise.resolve([
                {
                    title: 'title',
                    value: 'value'
                }
            ]);

        it('should call application addRoute', () => {
            adaptiveCards.search(testDataset, testHandler);

            assert(addRouteStub.calledOnce);
        });

        describe('createSearchSelector()', () => {
            it('dataset is a function', () => {
                const dataset: RouteSelector = () => Promise.resolve(true);

                adaptiveCards.search(dataset, testHandler);

                assert(selector === dataset);
            });

            describe('dataset is a regular expression', () => {
                const datasetRegex = new RegExp('test');

                beforeEach(() => {
                    adaptiveCards.search(datasetRegex, testHandler);
                });

                it('incomming activity is valid application/search type and should match regex', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'application/search',
                        value: {
                            dataset: 'test'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.dataset` matches the regex `datasetRegex`.
                    assert((await selector(context)) == true);
                });

                it('incomming activity is valid application/search type and should not match regex ', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'application/search',
                        value: {
                            dataset: 'DoesNotMatchRegex'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    // the selector should be testing if `value.dataset` matches the regex `datasetRegex`.
                    assert((await selector(context)) == false);
                });

                it('incomming activity is invalid', async () => {
                    const activity = {
                        type: 'NotInvoke'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });

            describe('dataset is a string', () => {
                const dataset = 'test';

                beforeEach(() => {
                    adaptiveCards.search(dataset, testHandler);
                });

                it('activity is valid application/search type and dataset matches', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'application/search',
                        value: {
                            dataset: 'test'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == true);
                });

                it('activity is valid application/search type and datasets are not equal', async () => {
                    const activity = {
                        type: 'invoke',
                        name: 'application/search',
                        value: {
                            dataset: 'NotEqualToTest'
                        }
                    };
                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });

                it('activity is invalid', async () => {
                    const activity = {
                        type: 'NotApplicationSearch'
                    };

                    const [context, _] = await createTestTurnContextAndState(adapter, activity);

                    assert((await selector(context)) == false);
                });
            });
        });

        describe('handler creation logic', () => {
            it('should create handler', () => {
                adaptiveCards.search(testDataset, testHandler);

                assert(typeof handler === 'function');
            });

            it('should throw error if incomming activity is not valid', async () => {
                adaptiveCards.search(testDataset, testHandler);

                const activity = {
                    type: 'invalidActivityType'
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();
                const errorMsg = `Unexpected AdaptiveCards.search() triggered for activity type: invalidActivityType`;

                assert.rejects(async () => await handler(context, state), errorMsg);
            });

            it('should call the test handler with the correct parameters', async () => {
                const testHandlerStub = sinon.spy(testHandler);

                adaptiveCards.search(testDataset, testHandlerStub);

                const query = {
                    count: 1,
                    skip: 1,
                    parameters: {
                        queryText: 'queryText',
                        dataset: 'testDataSet'
                    }
                };

                const activity = {
                    type: 'invoke',
                    name: 'application/search',
                    value: {
                        queryOptions: {
                            top: query.count,
                            skip: query.skip
                        },
                        queryText: query.parameters.queryText,
                        dataset: query.parameters.dataset
                    }
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                assert(testHandlerStub.calledOnce);
                assert(testHandlerStub.calledWith(context, state, query));
            });

            it('should send an invoke search response with handler result.', async () => {
                const returnedSearchResult = [
                    {
                        title: 'title',
                        value: 'value'
                    }
                ];

                const testHandler = (
                    context: TurnContext,
                    state: TurnState,
                    query: Query<AdaptiveCardsSearchParams>
                ): Promise<AdaptiveCardSearchResult[]> => Promise.resolve(returnedSearchResult);

                adaptiveCards.search(testDataset, testHandler);

                const activity = {
                    type: 'invoke',
                    name: 'application/search'
                };

                const [context, _] = await createTestTurnContextAndState(adapter, activity);
                const contextSendActivityStub = sinon.stub(context, 'sendActivity');
                const state = new TurnState();

                // this is the handler that is registered as an app route.
                await handler(context, state);

                const response = {
                    type: 'application/vnd.microsoft.search.searchResponse',
                    value: {
                        results: returnedSearchResult
                    }
                };

                assert(
                    contextSendActivityStub.calledOnceWith({
                        value: { body: response, status: 200 } as InvokeResponse,
                        type: ActivityTypes.InvokeResponse
                    })
                );
            });
        });
    });
});
