import { ActivityTypes, InvokeResponse, TestAdapter, TurnContext } from 'botbuilder';
import { Application, RouteSelector } from './Application';
import * as sinon from 'sinon';
import { AdaptiveCard, AdaptiveCards, TurnState } from '.';
import assert from 'assert';

describe.only('AdaptiveCards', () => {
    let adaptiveCards: AdaptiveCards<TurnState>;
    let app: Application;
    let selector: RouteSelector;
    let handler: any;
    let addRouteStub: sinon.SinonStub;
    const testVerb = 'testVerb';
    const testHandler = (context: TurnContext, state: TurnState, data: Record<string, any>) => Promise.resolve('test');

    const createTurnContext = (activity: any) => {
        return new TurnContext(new TestAdapter(), activity);
    };

    beforeEach(() => {
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

                it('incomming activity is valid invoke type', async () => {
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
                    const context = createTurnContext(activity);

                    assert((await selector(context)) == true);
                });

                it('incomming activity is invalid', async () => {
                    const activity = {
                        type: 'NotInvoke'
                    };

                    const context = createTurnContext(activity);

                    assert((await selector(context)) == false);
                });
            });

            describe('verb is a regular expression', () => {
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

                    const context = createTurnContext(activity);

                    assert((await selector(context)) == true);
                });

                it('activity is invalid', async () => {
                    const activity = {
                        type: 'NotInvoke'
                    };

                    const context = createTurnContext(activity);

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

                const context = createTurnContext(activity);
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

                const context = createTurnContext(activity);
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

                const context = createTurnContext(activity);
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

                const context = createTurnContext(activity);
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
});
