import { Activity, ActivityTypes, InvokeResponse, TestAdapter, TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import * as sinon from 'sinon';
import assert from 'assert';
import * as UserTokenAccess from './UserTokenAccess';
import { OAuthPromptMessageExtensionAuthentication } from './OAuthMessageExtensionAuthentication';

describe('OAuthPromptMessageExtensionAuthentication', () => {
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
            input_files: [],
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    const settings: OAuthPromptSettings = {
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

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(meAuth, 'handleSsoTokenExchange').throws();

            await meAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(
                contextStub.calledOnceWith({
                    value: { status: 412 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                })
            );
        });

        it('should send 412 invoke response if token is empty', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const contextStub = sinon.stub(context, 'sendActivity');

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(meAuth, 'handleSsoTokenExchange').returns(
                Promise.resolve({
                    token: '',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );

            await meAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(
                contextStub.calledOnceWith({
                    value: { status: 412 } as InvokeResponse,
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

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(meAuth, 'handleSsoTokenExchange').throws();

            const result = await meAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(result === undefined);
        });

        it('should return `undefined` if token is empty', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
            const isTokenExchangableStub = sinon.stub(meAuth, 'handleSsoTokenExchange').returns(
                Promise.resolve({
                    token: '',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );

            const result = await meAuth.authenticate(context);

            assert(isTokenExchangableStub.calledOnce);

            assert(result === undefined);
        });

        it('should return token if token is exchangeable', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
            const exchangeTokenStub = sinon.stub(meAuth, 'handleSsoTokenExchange').returns(
                Promise.resolve({
                    token: 'token',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );
            const result = await meAuth.authenticate(context);

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
                const magicCode = '123456'; // The magic code is a number
                const [context, _] = await createTurnContextAndState({
                    value: {
                        state: magicCode
                    }
                });

                const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);

                const getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                    Promise.resolve({
                        token: 'token',
                        expiration: 'expiration',
                        connectionName: 'connectionName'
                    })
                );
                const result = await meAuth.authenticate(context);

                assert(getUserTokenStub.calledOnce);
                assert(result === 'token');
            });

            const testCases = [
                ['composeExtension/query', 'silentAuth'],
                ['composeExtension/queryLink', 'auth'],
                ['composeExtension/fetchTask', 'auth'],
                ['composeExtension/anonymousQueryLink', 'auth']
            ];

            testCases.forEach(([name, authType]) => {
                it(`should send type '${authType}' suggestion action when couldn't retrieve token from token store for invoke name ${name}`, async () => {
                    const magicCode = 'OAuth flow magic code';
                    const [context, _] = await createTurnContextAndState({
                        type: ActivityTypes.Invoke,
                        name: name,
                        value: {
                            state: magicCode
                        }
                    });

                    sinon.stub(UserTokenAccess, 'getUserToken').returns(
                        Promise.resolve({
                            token: '',
                            expiration: 'expiration',
                            connectionName: 'connectionName'
                        })
                    );

                    const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);

                    const signInResourceStub = sinon.stub(UserTokenAccess, 'getSignInResource').returns(
                        Promise.resolve({
                            signInLink: 'signInLink'
                        })
                    );
                    const result = await meAuth.authenticate(context);
                    const sentActivity = adapter.getNextReply();

                    assert(signInResourceStub.calledOnce);
                    assert(result == undefined);
                    assert(sentActivity.value.status == 200);
                    assert(sentActivity.value.body.composeExtension.type == authType);
                    assert(sentActivity.value.body.composeExtension.suggestedActions.actions[0].type == 'openUrl');
                    assert(sentActivity.value.body.composeExtension.suggestedActions.actions[0].value == 'signInLink');
                    assert(
                        sentActivity.value.body.composeExtension.suggestedActions.actions[0].title ==
                            'Bot Service OAuth'
                    );
                    // Only one activity should be sent
                    assert(adapter.getNextReply() == undefined);
                });
            });
        });
    });

    describe('isValidActivity()', () => {
        const testCases = [
            ['composeExtension/query'],
            ['composeExtension/queryLink'],
            ['composeExtension/fetchTask'],
            ['composeExtension/anonymousQueryLink']
        ];

        testCases.forEach(([name]) => {
            it(`should return true if activity is of type Invoke and name is ${name}`, async () => {
                const [context, _] = await createTurnContextAndState({
                    type: ActivityTypes.Invoke,
                    name: name
                });

                const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);

                const result = meAuth.isValidActivity(context);

                assert(result);
            });
        });

        it('should return false if activity is not of type Invoke', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Message,
                name: 'composeExtension/query'
            });

            const meAuth = new OAuthPromptMessageExtensionAuthentication(settings);

            const result = meAuth.isValidActivity(context);

            assert(!result);
        });
    });

    describe('exchangeToken()', () => {
        let meAuth: MessageExtensionAuthenticationBase;

        beforeEach(() => {
            sinon.restore();
            meAuth = new OAuthPromptMessageExtensionAuthentication(settings);
        });

        it('should return undefined if `context.activity.value.authentication` does not have a token.', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {}
                }
            });

            const result = await meAuth.handleSsoTokenExchange(context);

            assert(result === undefined);
        });

        it('should return undefined if `context.activity.value.authentication` is undefined.', async () => {
            const [context, _] = await createTurnContextAndState({
                value: {}
            });

            const result = await meAuth.handleSsoTokenExchange(context);

            assert(result === undefined);
        });

        it('should attempt to exchange token if `context.activity.value.authentication` has a token.', async () => {
            const tokenResponse = {
                token: 'token',
                expiration: 'expiration',
                connectionName: 'connectionName'
            };

            const exchangeTokenStub = sinon
                .stub(UserTokenAccess, 'exchangeToken')
                .returns(Promise.resolve(tokenResponse));

            const [context, _] = await createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const result = await meAuth.handleSsoTokenExchange(context);

            assert(result == tokenResponse);
            assert(exchangeTokenStub.calledOnce);
            assert(exchangeTokenStub.calledWith(context, settings, { token: 'token' }));
        });
    });
});
