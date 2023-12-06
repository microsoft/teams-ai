/* eslint-disable security/detect-object-injection */
import { Activity, TestAdapter, TurnContext } from 'botbuilder';
import { Application, RouteSelector } from '../Application';
import { DialogTurnResult, DialogTurnStatus, OAuthPromptSettings } from 'botbuilder-dialogs';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import * as sinon from 'sinon';
import assert from 'assert';
import { TurnState } from '../TurnState';
import { AuthError } from './Authentication';
import { OAuthBotAuthentication } from './OAuthBotAuthentication';

describe('BotAuthentication', () => {
    const adapter = new TestAdapter();

    let app: Application;
    let settings: OAuthPromptSettings;
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
        app = new Application({ adapter });
        settings = {
            connectionName: 'test',
            title: 'test'
        };
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

                const context = new TurnContext(adapter, { type: 'invoke', name: activityName });

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
});
