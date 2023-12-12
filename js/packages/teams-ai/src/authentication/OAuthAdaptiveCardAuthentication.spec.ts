import { Activity, ActivityTypes, InvokeResponse, TestAdapter, TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import * as sinon from 'sinon';
import assert from 'assert';
import * as UserTokenAccess from './UserTokenAccess';
import { AdaptiveCardAuthenticationBase } from './AdaptiveCardAuthenticationBase';
import { OAuthSettings } from './Authentication';
import { ACTION_INVOKE_NAME } from '../AdaptiveCards';
import { OAuthAdaptiveCardAuthentication } from './OAuthAdaptiveCardAuthentication';

describe('AdaptiveCardAuthenticaion', () => {
    const adapter = new TestAdapter();

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

    const settings: OAuthSettings = {
        connectionName: 'connectionName',
        title: 'title'
    };

    describe('authenticate()', () => {
        it('should send 412 invoke response if token is not exchangeable', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const contextStub = sinon.stub(context, 'sendActivity');

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(acAuth, 'handleSsoTokenExchange').throws();

            await acAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(
                contextStub.calledOnceWith({
                    value: {
                        body: {
                            statusCode: 412,
                            type: 'application/vnd.microsoft.error.preconditionFailed',
                            value: {
                                code: '412',
                                message: 'Failed to exchange token'
                            }
                        },
                        status: 200
                    } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                })
            );
        });

        it('should return `undefined` if token is not exchangeable', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(acAuth, 'handleSsoTokenExchange').throws();

            const result = await acAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(result === undefined);
        });

        it('should return token if token is exchangeable', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: ACTION_INVOKE_NAME,
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);
            const exchangeTokenStub = sinon.stub(acAuth, 'handleSsoTokenExchange').returns(
                Promise.resolve({
                    token: 'token',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );
            const result = await acAuth.authenticate(context);

            assert(exchangeTokenStub.calledOnce);
            assert(result === 'token');
        });

        describe('when not in token exchange flow', () => {
            before(() => {
                // clear test adapter queue
                let item = adapter.getNextReply();
                while (item != undefined) {
                    item = adapter.getNextReply();
                }
            });

            beforeEach(() => {
                sinon.restore();
            });

            it('should return token if successfully retrieved token from token store', async () => {
                const magicCode = '123456'; // Magic code is a random number
                const [context, _] = await createTurnContextAndState({
                    value: {
                        state: magicCode
                    }
                });

                const acAuth = new OAuthAdaptiveCardAuthentication(settings);

                const getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                    Promise.resolve({
                        token: 'token',
                        expiration: 'expiration',
                        connectionName: 'connectionName'
                    })
                );
                const result = await acAuth.authenticate(context);

                assert(getUserTokenStub.calledOnce);
                assert(result === 'token');
            });

            describe(`should send login card when couldn't retrieve token from token`, () => {
                let acAuth: AdaptiveCardAuthenticationBase;
                let context: TurnContext;
                let contextStub: sinon.SinonStub;
                let signInResourceStub: sinon.SinonStub;

                beforeEach(async () => {
                    const magicCode = 'OAuth flow magic code';
                    const [_0, _1] = await createTurnContextAndState({
                        type: ActivityTypes.Invoke,
                        name: ACTION_INVOKE_NAME,
                        value: {
                            state: magicCode
                        }
                    });

                    context = _0;

                    sinon.stub(UserTokenAccess, 'getUserToken').returns(
                        Promise.resolve({
                            token: '',
                            expiration: 'expiration',
                            connectionName: 'connectionName'
                        })
                    );

                    acAuth = new OAuthAdaptiveCardAuthentication(settings);

                    signInResourceStub = sinon.stub(UserTokenAccess, 'getSignInResource').returns(
                        Promise.resolve({
                            signInLink: 'signInLink'
                        })
                    );

                    contextStub = sinon.stub(context, 'sendActivity');
                });

                afterEach(() => {
                    sinon.restore();
                });

                it(`should to normal auth flow if tokenExchangeUri is not set`, async () => {
                    const settings = {
                        connectionName: 'connectionName',
                        title: 'title'
                    };

                    acAuth = new OAuthAdaptiveCardAuthentication(settings);

                    const result = await acAuth.authenticate(context);

                    assert(
                        contextStub.calledOnceWith({
                            value: {
                                body: {
                                    statusCode: 401,
                                    type: 'application/vnd.microsoft.activity.loginRequest',
                                    value: {
                                        text: settings.title,
                                        connectionName: settings.connectionName,
                                        buttons: [
                                            {
                                                title: 'Sign-In',
                                                text: 'Sign-In',
                                                type: 'signin',
                                                value: 'signInLink'
                                            }
                                        ]
                                    }
                                },
                                status: 200
                            } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        })
                    );

                    assert(signInResourceStub.calledOnce);
                    assert(result == undefined);
                });

                it(`should to normal auth flow if tokenExchangeUri is not set`, async () => {
                    const settings = {
                        connectionName: 'connectionName',
                        title: 'title',
                        tokenExchangeUri: 'tokenExchangeUri'
                    };

                    acAuth = new OAuthAdaptiveCardAuthentication(settings);

                    const result = await acAuth.authenticate(context);

                    assert(
                        contextStub.calledOnceWith({
                            value: {
                                body: {
                                    statusCode: 401,
                                    type: 'application/vnd.microsoft.activity.loginRequest',
                                    value: {
                                        text: settings.title,
                                        connectionName: settings.connectionName,
                                        tokenExchangeResource: {
                                            id: context.activity.recipient.id,
                                            uri: settings.tokenExchangeUri
                                        },
                                        buttons: [
                                            {
                                                title: 'Sign-In',
                                                text: 'Sign-In',
                                                type: 'signin',
                                                value: 'signInLink'
                                            }
                                        ]
                                    }
                                },
                                status: 200
                            } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        })
                    );

                    assert(signInResourceStub.calledOnce);
                    assert(result == undefined);
                });
            });
        });
    });

    describe('isValidActivity()', () => {
        it(`should return true if activity is of type Invoke and name is adaptiveCard/action`, async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'adaptiveCard/action'
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);

            const result = acAuth.isValidActivity(context);

            assert(result);
        });

        it('should return false if activity is not of type Invoke', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Message,
                name: 'composeExtension/query'
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);

            const result = acAuth.isValidActivity(context);

            assert(!result);
        });
    });

    describe('handleSsoTokenExchange()', () => {
        it('should perform token exchange if the activity.value.authentication exists', async () => {
            const tokenResponse = {
                token: 'token',
                connectionName: 'connectionName',
                expiration: 'expiration'
            };
            const exchangeTokenStub = sinon
                .stub(UserTokenAccess, 'exchangeToken')
                .returns(Promise.resolve(tokenResponse));
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'adaptiveCard/action',
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);
            const response = await acAuth.handleSsoTokenExchange(context);

            assert(exchangeTokenStub.calledOnce);
            assert(response == tokenResponse);
        });

        it('should not perform token exchange if the activity.value.authentication does not exist', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'adaptiveCard/action',
                value: {}
            });

            const acAuth = new OAuthAdaptiveCardAuthentication(settings);
            const response = await acAuth.handleSsoTokenExchange(context);

            assert(response == undefined);
        });
    });
});
