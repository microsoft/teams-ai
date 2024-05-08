import { Activity, MemoryStorage, TestAdapter, TurnContext } from 'botbuilder';
import { Application, RouteSelector } from '../Application';
import { DialogSet, DialogState, DialogTurnResult, DialogTurnStatus, OAuthPrompt } from 'botbuilder-dialogs';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import * as sinon from 'sinon';
import assert from 'assert';
import { TurnState } from '../TurnState';
import { AuthError, OAuthSettings } from './Authentication';
import { FilteredTeamsSSOTokenExchangeMiddleware, OAuthBotAuthentication } from './OAuthBotAuthentication';
import { TurnStateProperty } from '../TurnStateProperty';
import * as UserTokenAccess from './UserTokenAccess';

describe('OAuthBotAuthentication', () => {
    const adapter = new TestAdapter();

    let app: Application;
    let settings: OAuthSettings;
    const settingName = 'settingName';

    const createTurnContextAndState = async (activity: Partial<Activity>): Promise<[TurnContext, TurnState]> => {
        const context = new TurnContext(adapter, {
            channelId: 'msteams',
            recipient: {
                id: 'bot',
                name: 'bot'
            },
            from: {
                id: 'user',
                name: 'user'
            },
            conversation: {
                id: 'convo',
                isGroup: false,
                conversationType: 'personal',
                name: 'convo'
            },
            ...activity
        });
        const state: TurnState = new TurnState();
        await state.load(context);
        state.temp = {
            input: '',
            inputFiles: [],
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    beforeEach(() => {
        app = new Application();
        settings = {
            connectionName: 'test',
            title: 'test'
        };

        sinon.stub(app, 'adapter').get(() => adapter);
    });

    describe('constructor()', () => {
        it('should register the FilteredTeamsSSOTokenExchangeMiddleware middleware to handle token deduplication', () => {
            const adapterSpy = sinon.stub(adapter, 'use');

            let middlewareUsed = false;
            adapterSpy.callsFake((args) => {
                middlewareUsed =
                    typeof args == 'object' && args.constructor.name == 'FilteredTeamsSSOTokenExchangeMiddleware';

                return adapter;
            });

            // Act
            new OAuthBotAuthentication(app, settings, settingName);

            assert(adapterSpy.calledOnce);
            assert(middlewareUsed);
        });

        const routeTestCases: [string, number][] = [
            // Invoke activity name, order in which the route was registered
            ['signin/verifyState', 0],
            ['signin/tokenExchange', 1]
        ];

        routeTestCases.forEach(([activityName, routeIndex]) => {
            it(`should register route to handle ${activityName}`, async () => {
                const appSpy = sinon.stub(app, 'addRoute');

                const context = new TurnContext(adapter, {
                    type: 'invoke',
                    name: activityName,
                    value: { settingName: settingName }
                });

                // the selector function used to register the route
                const selectorFunctionsUsed: RouteSelector[] = [];

                appSpy.callsFake((selector) => {
                    selectorFunctionsUsed.push(selector);

                    return app;
                });

                new OAuthBotAuthentication(app, settings, settingName);

                assert(await selectorFunctionsUsed![routeIndex](context));
            });
        });
    });

    describe('authenticate()', () => {
        it('should save incomming message if not signed in yet', async () => {
            const botAuth = new OAuthBotAuthentication(app, settings, settingName);

            const runDialogStub = sinon.stub(botAuth, 'runDialog');
            runDialogStub.callsFake(async () => {
                return {
                    status: DialogTurnStatus.empty
                } as DialogTurnResult;
            });

            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            await botAuth.authenticate(context, state);

            const userAuthStatePropertyName = botAuth.getUserAuthStatePropertyName(context);
            const authUserState = (state.conversation as any)[userAuthStatePropertyName];

            assert(authUserState.message === context.activity.text);
        });

        it('should call runDialog()', async () => {
            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const runDialogStub = sinon.stub(botAuth, 'runDialog');
            runDialogStub.callsFake(async () => {
                return {
                    status: DialogTurnStatus.empty
                } as DialogTurnResult;
            });

            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            await botAuth.authenticate(context, state);

            assert(runDialogStub.calledOnce);
        });

        describe('auth flow is completed', () => {
            let state: TurnState;
            let context: TurnContext;
            let botAuth: BotAuthenticationBase<TurnState>;
            let runDialogStub: sinon.SinonStub;
            const tokenValue = 'testToken';

            beforeEach(async () => {
                // Setup
                botAuth = new OAuthBotAuthentication(app, settings, settingName);
                runDialogStub = sinon.stub(botAuth, 'runDialog');
                runDialogStub.callsFake(async () => {
                    return {
                        status: DialogTurnStatus.complete,
                        result: {
                            token: tokenValue
                        }
                    } as DialogTurnResult;
                });

                [context, state] = await createTurnContextAndState({
                    type: 'message',
                    from: {
                        id: 'test',
                        name: 'test'
                    },
                    text: undefined
                });
            });

            it('should delete auth dialog state', async () => {
                const stateConversationObj = state.conversation as any;
                const userDialogStatePropertyName = botAuth.getUserDialogStatePropertyName(context);

                await botAuth.authenticate(context, state);

                assert(stateConversationObj[userDialogStatePropertyName] === undefined);
            });

            it('should return token', async () => {
                const result = await botAuth.authenticate(context, state);

                assert.equal(result, tokenValue);
            });
        });
    });

    describe('handleSignInActivity()', () => {
        it('should call continueDialog()', async () => {
            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const continueDialogStub = sinon.stub(botAuth, 'continueDialog');
            continueDialogStub.callsFake(async () => {
                return {
                    status: DialogTurnStatus.empty
                } as DialogTurnResult;
            });

            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            await botAuth.handleSignInActivity(context, state);

            assert(continueDialogStub.calledOnce);
        });

        describe('auth flow is completed with token', () => {
            let state: TurnState;
            let context: TurnContext;
            let botAuth: BotAuthenticationBase<TurnState>;
            let continueDialogStub: sinon.SinonStub;
            const tokenValue = 'testToken';

            beforeEach(async () => {
                // Setup
                botAuth = new OAuthBotAuthentication(app, settings, settingName);
                continueDialogStub = sinon.stub(botAuth, 'continueDialog');
                continueDialogStub.callsFake(async () => {
                    return {
                        status: DialogTurnStatus.complete,
                        result: {
                            token: tokenValue
                        }
                    } as DialogTurnResult;
                });

                [context, state] = await createTurnContextAndState({
                    type: 'message',
                    from: {
                        id: 'test',
                        name: 'test'
                    }
                });
            });

            it('should sign in success handler & restore previous user message', async () => {
                const userAuthStatePropertyName = botAuth.getUserAuthStatePropertyName(context);
                (state.conversation as any)[userAuthStatePropertyName] = {
                    message: 'test'
                };

                let activityMessage = undefined;
                let handlerCalled = false;
                botAuth.onUserSignInSuccess(async (_context: TurnContext, _state: TurnState) => {
                    handlerCalled = true;
                    activityMessage = context.activity.text;
                });
                await botAuth.handleSignInActivity(context, state);

                assert(handlerCalled);
                assert(activityMessage === 'test');
            });

            it('should store token in state', async () => {
                await botAuth.handleSignInActivity(context, state);

                assert(state.temp.authTokens[settingName] === tokenValue);
            });
        });

        it('should call the failure handler if auth flow completed but failed to retreive token', async () => {
            // Setup
            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const continueDialogStub = sinon.stub(botAuth, 'continueDialog');
            continueDialogStub.callsFake(async () => {
                return {
                    status: DialogTurnStatus.complete,
                    result: undefined
                } as DialogTurnResult;
            });

            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            let handlerCalled = false;
            let error: any = undefined;
            botAuth.onUserSignInFailure(async (_context, _state, e) => {
                handlerCalled = true;
                error = e;
            });
            await botAuth.handleSignInActivity(context, state);

            assert(handlerCalled);
            assert(error instanceof AuthError);
            assert(error.cause == 'completionWithoutToken');
            assert(error.message == 'Authentication flow completed without a token.');
        });
    });

    describe('runDialog', () => {
        beforeEach(() => {
            sinon.reset();
        });

        it('should begin dialog if status is empty', async () => {
            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });
            const dialogStateProperty = 'dialogStateProperty';
            const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
            const dialogSet = new DialogSet(accessor);
            dialogSet.add(new OAuthPrompt('OAuthPrompt', settings));
            const dialogContext = await dialogSet.createContext(context);

            const beginDialogStub = sinon.stub(dialogContext, 'beginDialog');
            const continueDialogStub = sinon
                .stub(dialogContext, 'continueDialog')
                .returns(Promise.resolve({ status: DialogTurnStatus.empty }));

            sinon.stub(UserTokenAccess, 'getSignInResource').returns(Promise.resolve({ signInLink: 'test' }));

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const createDialogContextStub = sinon.stub(botAuth, <any>'createDialogContext').returns(dialogContext);

            const result = await botAuth.runDialog(context, state, dialogStateProperty);

            assert(result == undefined);
            assert(beginDialogStub.calledOnce);
            assert(continueDialogStub.calledOnce);
            assert(createDialogContextStub.calledOnce);

            sinon.restore();
        });

        it('calling run dialog for the first time should return status waiting', async () => {
            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            const stub = sinon.stub(OAuthPrompt, 'sendOAuthCard');
            sinon.stub(UserTokenAccess, 'getSignInResource').returns(Promise.resolve({ signInLink: 'test' }));

            const dialogStateProperty = 'dialogStateProperty';

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);

            const result = await botAuth.runDialog(context, state, dialogStateProperty);

            assert(result.status == DialogTurnStatus.waiting);

            stub.restore();
        });
    });

    describe('verifyStateRouteSelector', () => {
        it('should return true if invoke activity name is `signin/verifyState` & the setting name matches', async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'signin/verifyState',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.verifyStateRouteSelector(context);

            assert(response == true);
        });

        it(`should return false if it's not an invoke activity`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'not invoke',
                name: 'signIn/verifyState',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.verifyStateRouteSelector(context);

            assert(response == false);
        });

        it(`should return false if it's not 'signIn/verifyState' invoke activity`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'not signin/verifyState',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.verifyStateRouteSelector(context);

            assert(response == false);
        });

        it(`should return false if it's setting name is not set or is incorrect`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'signin/verifyState',
                value: {
                    settingName: 'incorrect setting name'
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.verifyStateRouteSelector(context);

            assert(response == false);
        });
    });

    describe('tokenExchangeRouteSelector', () => {
        it('should return true if invoke activity name is `signin/tokenExchange` & the setting name matches', async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'signin/tokenExchange',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.tokenExchangeRouteSelector(context);

            assert(response == true);
        });

        it(`should return false if it's not an invoke activity`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'not invoke',
                name: 'signin/tokenExchange',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.tokenExchangeRouteSelector(context);

            assert(response == false);
        });

        it(`should return false if it's not 'signin/tokenExchange' invoke activity`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'not signin/tokenExchange',
                value: {
                    settingName: settingName
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.tokenExchangeRouteSelector(context);

            assert(response == false);
        });

        it(`should return false if it's setting name is not set or is incorrect`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: 'invoke',
                name: 'signin/tokenExchange',
                value: {
                    settingName: 'incorrect setting name'
                }
            });

            const botAuth = new OAuthBotAuthentication(app, settings, settingName);
            const response = await botAuth.tokenExchangeRouteSelector(context);

            assert(response == false);
        });
    });
});

describe('FilteredTeamsSSOTokenExchangeMiddleware', () => {
    it('should call next() if activity.value.connectionName is not equal to connectionName', async () => {
        const middleware = new FilteredTeamsSSOTokenExchangeMiddleware(new MemoryStorage(), 'connectionName');

        const context = new TurnContext(new TestAdapter(), {
            type: 'invoke',
            name: 'signin/tokenExchange',
            value: {
                connectionName: 'otherConnectionName'
            }
        });

        let nextCalled = false;
        middleware.onTurn(context, () => {
            nextCalled = true;
            return Promise.resolve();
        });

        assert(nextCalled);
    });
});
