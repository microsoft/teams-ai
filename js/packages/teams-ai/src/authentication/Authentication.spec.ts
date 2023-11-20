import * as sinon from 'sinon';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import { Application } from '../Application';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { AuthError, Authentication, AuthenticationManager, AuthenticationOptions } from './Authentication';
import { TurnState } from '../TurnState';
import { Activity, ActivityTypes, TestAdapter, TurnContext } from 'botbuilder';
import assert from 'assert';
import * as UserTokenAccess from './UserTokenAccess';
import * as BotAuth from './BotAuthenticationBase';
import { OAuthPromptMessageExtensionAuthentication } from './OAuthMessageExtensionAuthentication';
import { OAuthBotAuthentication } from './OAuthBotAuthentication';

describe('Authentication', () => {
    const adapter = new TestAdapter();

    let botAuth: BotAuthenticationBase<TurnState>;
    let botAuthenticateStub: sinon.SinonStub;
    let messageExtensionsAuth: MessageExtensionAuthenticationBase;
    let messageExtensionAuthenticateStub: sinon.SinonStub;
    let app: Application;
    let appStub: sinon.SinonStubbedInstance<Application>;
    let settings: OAuthPromptSettings;
    let auth: Authentication<TurnState>;
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
            history: '',
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    beforeEach(() => {
        app = new Application({ adapter });
        appStub = sinon.stub(app);
        settings = {
            title: 'test',
            connectionName: 'test'
        };

        messageExtensionsAuth = new OAuthPromptMessageExtensionAuthentication(settings);
        messageExtensionAuthenticateStub = sinon.stub(messageExtensionsAuth, 'authenticate');
        botAuth = new OAuthBotAuthentication(appStub, settings, settingName);
        botAuthenticateStub = sinon.stub(botAuth, 'authenticate');

        auth = new Authentication(appStub, settingName, settings, undefined, messageExtensionsAuth, botAuth);
    });

    describe('signInUser()', () => {
        before(() => {
            sinon.stub(UserTokenAccess, 'getUserToken');
        });

        after(() => {
            sinon.restore();
        });

        it('should call botAuth.authenticate() when activity type is message and the text is a non-empty string', async () => {
            const isUserSignedInStub = sinon.stub(auth, 'isUserSignedIn').returns(Promise.resolve(undefined));

            const [context, state] = await createTurnContextAndState({ type: ActivityTypes.Message, text: 'non empty' });

            await auth.signInUser(context, state);

            assert(isUserSignedInStub.calledOnce);
            assert(botAuthenticateStub.calledOnce);
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/query activity', async () => {
            const [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            await auth.signInUser(context, state);

            messageExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/queryLink activity', async () => {
            const [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/queryLink'
            });

            await auth.signInUser(context, state);

            messageExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/fetchTask activity', async () => {
            const [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/fetchTask'
            });

            await auth.signInUser(context, state);

            messageExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should throw error is activity type is not valid for botAuth or messageExtensionAuth', async () => {
            const [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Event
            });

            assert.rejects(
                async () => await auth.signInUser(context, state),
                new AuthError(
                    'Incomming activity is not a valid activity to initiate authentication flow.',
                    'invalidActivity'
                )
            );
        });
    });

    describe('signOutUser()', () => {
        let userTokenAccessStub: sinon.SinonStub;
        let context: TurnContext;
        let state: TurnState;

        before(() => {
            userTokenAccessStub = sinon.stub(UserTokenAccess, 'signOutUser');
        });

        beforeEach(async () => {
            [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Message,
                from: {
                    id: 'test',
                    name: 'test'
                },
                channelId: 'test'
            });
        });

        it('should call botAuth.deleteAuthFlowState()', async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'deleteAuthFlowState');

            await auth.signOutUser(context, state);

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });

        it('should call UserTokenAccess.signOutUser()', async () => {
            await auth.signOutUser(context, state);

            userTokenAccessStub.calledOnce;
        });
    });

    describe('onUserSignInSuccess()', () => {
        it(`should call botAuth.onUserSignInSuccess()`, async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'onUserSignInSuccess');

            auth.onUserSignInSuccess(() => Promise.resolve());

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });
    });

    describe('onUserSignInFailure()', () => {
        it(`should call botAuth.onUserSignInFailure()`, async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'onUserSignInFailure');

            auth.onUserSignInSuccess(() => Promise.resolve());

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });
    });

    describe('isUserSignedIn()', () => {
        let context: TurnContext;
        let getUserTokenStub: sinon.SinonStub;

        beforeEach(async () => {
            const obj = await createTurnContextAndState({
                type: ActivityTypes.Message,
                from: {
                    id: 'test',
                    name: 'test'
                },
                channelId: 'test'
            });

            context = obj[0];
        });

        afterEach(() => {
            sinon.restore();
        });

        it(`should call UserTokenAccess.getUserToken`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken');

            await auth.isUserSignedIn(context);

            getUserTokenStub.calledOnce;
        });

        it(`should return token if UserTokenAccess.getUserToken returns token`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                Promise.resolve({
                    token: 'token',
                    connectionName: 'connectionName',
                    expiration: 'expiration'
                })
            );

            const response = await auth.isUserSignedIn(context);

            assert(response == 'token');
            getUserTokenStub.calledOnce;
        });

        it(`should return undefined if UserTokenAccess.getUserToken returns empty string for token`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                Promise.resolve({
                    token: '',
                    connectionName: 'connectionName',
                    expiration: 'expiration'
                })
            );

            const response = await auth.isUserSignedIn(context);

            assert(response == undefined);
            getUserTokenStub.calledOnce;
        });
    });
});

describe('AuthenticationManager', () => {
    const adapter = new TestAdapter();

    let app: Application;
    let appStub: sinon.SinonStubbedInstance<Application>;
    //let auth: Authentication;
    let authManager: AuthenticationManager<TurnState>;

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
            history: '',
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    beforeEach(() => {
        app = new Application({ adapter });
        appStub = sinon.stub(app);
    });

    describe('constructor()', () => {
        it('should use the first setting as default if settingName is not provided', () => {
            const authOptions: AuthenticationOptions = {
                settings: {
                    firstSetting: {
                        title: 'test',
                        connectionName: 'test'
                    }
                }
            };

            authManager = new AuthenticationManager(appStub, authOptions);

            assert(authManager.default == 'firstSetting');
        });

        it('should throw an error if the settings were not provided', () => {
            const authOptions: AuthenticationOptions = {
                settings: {}
            };

            assert.rejects(
                () => Promise.resolve(new AuthenticationManager(appStub, authOptions)),
                'Authentication settings are required'
            );
        });

        it('should create a new authentication object for each setting provided', () => {
            const authOptions: AuthenticationOptions = {
                settings: {
                    firstSetting: {
                        title: 'test',
                        connectionName: 'test'
                    },
                    secondSetting: {
                        title: 'test',
                        connectionName: 'test'
                    }
                }
            };

            authManager = new AuthenticationManager(appStub, authOptions);

            assert(authManager.get('firstSetting') instanceof Authentication);
            assert(authManager.get('secondSetting') instanceof Authentication);
        });
    });

    describe('get', () => {
        it('should get the connection', () => {
            const authOptions: AuthenticationOptions = {
                settings: {
                    firstSetting: {
                        title: 'test',
                        connectionName: 'test'
                    }
                }
            };

            authManager = new AuthenticationManager(appStub, authOptions);

            assert(authManager.get('firstSetting') instanceof Authentication);
        });

        it("should throw an error if the connection couldn't be found", () => {
            const authOptions: AuthenticationOptions = {
                settings: {
                    firstSetting: {
                        title: 'test',
                        connectionName: 'test'
                    }
                }
            };

            authManager = new AuthenticationManager(appStub, authOptions);

            assert.rejects(
                () => Promise.resolve(authManager.get('invalidSettingName')),
                "Could not find setting name 'invalidSettingName'"
            );
        });
    });

    describe('signInUser() & signOutUser()', () => {
        const authOptions: AuthenticationOptions = {
            settings: {
                firstSetting: {
                    title: 'test',
                    connectionName: 'test'
                }
            }
        };

        let authManager: AuthenticationManager<TurnState>;
        let auth: Authentication<TurnState>;
        let authManagerGetStub: sinon.SinonStub;
        let context: TurnContext;
        let state: TurnState;

        beforeEach(async () => {
            authManager = new AuthenticationManager(appStub, authOptions);
            auth = new Authentication(appStub, 'firstSetting', authOptions.settings.firstSetting);
            authManagerGetStub = sinon.stub(authManager, 'get').returns(auth);
            [context, state] = await createTurnContextAndState({
                type: ActivityTypes.Message,
                text: 'non empty'
            });
        });

        describe('signInUser()', () => {
            it('should use the default setting if settingName is not provided', async () => {
                sinon.stub(auth, 'signInUser');

                await authManager.signUserIn(context, state);

                authManagerGetStub.calledWith('firstSetting');
            });

            it('should use provided settingName', async () => {
                sinon.stub(auth, 'signInUser');

                await authManager.signUserIn(context, state, 'providedSettingName');

                authManagerGetStub.calledWith('providedSettingName');
            });

            it('should returns `error` response if signInUser() throws an error', async () => {
                const e = new Error('test');
                sinon.stub(auth, 'signInUser').throws(e);

                const response = await authManager.signUserIn(context, state);

                assert(response.error == e);
                assert(response.cause == 'other');
                assert(response.status == 'error');
            });

            it('should returns `error` response with specific `cause` if signInUser() throws an AuthError', async () => {
                const e = new AuthError('test', 'completionWithoutToken');
                sinon.stub(auth, 'signInUser').throws(e);

                const response = await authManager.signUserIn(context, state);

                assert(response.error == e);
                assert(response.cause == 'completionWithoutToken');
                assert(response.status == 'error');
            });

            it('should return `pending` response if signInUser() returns undefiend', async () => {
                sinon.stub(auth, 'signInUser').returns(Promise.resolve(undefined));

                const response = await authManager.signUserIn(context, state);

                assert(response.status == 'pending');
            });

            it('should return `success` response if signInUser() returns a token', async () => {
                sinon.stub(auth, 'signInUser').returns(Promise.resolve('token'));

                const response = await authManager.signUserIn(context, state);

                assert(response.status == 'complete');
            });

            it('should set the token to the state if signInUser() returns a token', async () => {
                sinon.stub(auth, 'signInUser').returns(Promise.resolve('token'));
                const setTokenInStateStub = sinon.stub(BotAuth, 'setTokenInState');

                await authManager.signUserIn(context, state);

                assert(setTokenInStateStub.calledOnce);
            });
        });

        describe('signOutUser', () => {
            it('should use the default setting if settingName is not provided', async () => {
                sinon.stub(auth, 'signOutUser');

                await authManager.signUserIn(context, state);

                authManagerGetStub.calledWith('firstSetting');
            });

            it('should call signOutUser() on the authentication object', async () => {
                const authSignOutUserStub = sinon.stub(auth, 'signOutUser');

                await authManager.signOutUser(context, state);

                assert(authSignOutUserStub.calledOnce);
            });

            it('should delete the token from the state', async () => {
                sinon.stub(auth, 'signOutUser');
                const deleteTokenFromStateStub = sinon.stub(BotAuth, 'deleteTokenFromState');

                await authManager.signOutUser(context, state);

                assert(deleteTokenFromStateStub.calledOnce);
            });
        });
    });
});
