import { Activity, ActivityTypes, InvokeResponse, TestAdapter, TurnContext } from 'botbuilder';
import { TurnStateEntry } from '../TurnState';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { ConversationHistory } from '../ConversationHistory';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { MessagingExtensionAuthentication } from './MessagingExtensionAuthentication';
import * as sinon from 'sinon';
import assert from 'assert';
import * as UserTokenAccess from './UserTokenAccess';

describe.only('MessagingExtensionAuthentication', () => {
    const adapter = new TestAdapter();

    const createTurnContextAndState = (activity: Partial<Activity>): [TurnContext, DefaultTurnState] => {
        const context = new TurnContext(adapter, activity);
        const state: DefaultTurnState = {
            conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [] }),
            user: new TurnStateEntry(),
            dialog: new TurnStateEntry(),
            temp: new TurnStateEntry()
        };
        return [context, state];
    };

    const settings: OAuthPromptSettings = {
        connectionName: 'connectionName',
        title: 'title'
    };

    describe('authenticate()', () => {
        it('should send 412 invoke response if token is not exchangeable', async () => {
            const [context, _] = createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const contextStub = sinon.stub(context, 'sendActivity');

            const meAuth = new MessagingExtensionAuthentication();
            const isTokenExchangableStub = sinon.stub(meAuth, 'isTokenExchangeable').returns(Promise.resolve(false));

            await meAuth.authenticate(context, settings);

            assert(isTokenExchangableStub.calledOnce);

            assert(
                contextStub.calledOnceWith({
                    value: { status: 412 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                })
            );
        });

        it('should return `undefined` if token is not exchangeable', async () => {
            const [context, _] = createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const meAuth = new MessagingExtensionAuthentication();
            const isTokenExchangableStub = sinon.stub(meAuth, 'isTokenExchangeable').returns(Promise.resolve(false));

            const result = await meAuth.authenticate(context, settings);

            assert(isTokenExchangableStub.calledOnce);

            assert(result === undefined);
        });

        it('should return token if token is exchangeable', async () => {
            const [context, _] = createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const meAuth = new MessagingExtensionAuthentication();
            const isTokenExchangableStub = sinon.stub(meAuth, 'isTokenExchangeable').returns(Promise.resolve(true));
            const exchangeTokenStub = sinon.stub(meAuth, 'exchangeToken').returns(
                Promise.resolve({
                    token: 'token',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );
            const result = await meAuth.authenticate(context, settings);

            assert(isTokenExchangableStub.calledOnce);
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
                const magicCode = 'OAuth flow magic code';
                const [context, _] = createTurnContextAndState({
                    value: {
                        state: magicCode
                    }
                });

                const meAuth = new MessagingExtensionAuthentication();

                const getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                    Promise.resolve({
                        token: 'token',
                        expiration: 'expiration',
                        connectionName: 'connectionName'
                    })
                );
                const result = await meAuth.authenticate(context, settings);

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
                    const [context, _] = createTurnContextAndState({
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

                    const meAuth = new MessagingExtensionAuthentication();

                    const signInResourceStub = sinon.stub(UserTokenAccess, 'getSignInResource').returns(
                        Promise.resolve({
                            signInLink: 'signInLink'
                        })
                    );
                    const result = await meAuth.authenticate(context, settings);
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
            it(`should return true if activity is of type Invoke and name is ${name}`, () => {
                const [context, _] = createTurnContextAndState({
                    type: ActivityTypes.Invoke,
                    name: name
                });

                const meAuth = new MessagingExtensionAuthentication();

                const result = meAuth.isValidActivity(context);

                assert(result);
            });
        });

        it('should return false if activity is not of type Invoke', () => {
            const [context, _] = createTurnContextAndState({
                type: ActivityTypes.Message,
                name: 'composeExtension/query'
            });

            const meAuth = new MessagingExtensionAuthentication();

            const result = meAuth.isValidActivity(context);

            assert(!result);
        });
    });

    describe('isTokenExchangeable()', () => {
        let context: TurnContext;
        let meAuth: MessagingExtensionAuthentication;

        beforeEach(() => {
            sinon.restore();
            meAuth = new MessagingExtensionAuthentication();
            context = createTurnContextAndState({})[0];
        });

        it('should return false if token exchange returns an empty token', async () => {
            sinon.stub(meAuth, 'exchangeToken').returns(
                Promise.resolve({
                    token: '',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );

            const result = await meAuth.isTokenExchangeable(context, settings);

            assert(result === false);
        });

        it('should return false if token exchange throws an error', async () => {
            sinon.stub(meAuth, 'exchangeToken').throws('error');

            const result = await meAuth.isTokenExchangeable(context, settings);

            assert(result === false);
        });

        it('should return true if token exchange succeeded', async () => {
            sinon.stub(meAuth, 'exchangeToken').returns(
                Promise.resolve({
                    token: 'non-empty token property',
                    expiration: 'expiration',
                    connectionName: 'connectionName'
                })
            );

            const result = await meAuth.isTokenExchangeable(context, settings);

            assert(result == true);
        });
    });

    describe('exchangeToken()', () => {
        let meAuth: MessagingExtensionAuthentication;

        beforeEach(() => {
            sinon.restore();
            meAuth = new MessagingExtensionAuthentication();
        });

        it('should return undefined if `context.activity.value.authentication` does not have a token.', async () => {
            const [context, _] = createTurnContextAndState({
                value: {
                    authentication: {}
                }
            });

            const result = await meAuth.exchangeToken(context, settings);

            assert(result === undefined);
        });

        it('should return undefined if `context.activity.value.authentication` is undefined.', async () => {
            const [context, _] = createTurnContextAndState({
                value: {}
            });

            const result = await meAuth.exchangeToken(context, settings);

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

            const [context, _] = createTurnContextAndState({
                value: {
                    authentication: {
                        token: 'token'
                    }
                }
            });

            const result = await meAuth.exchangeToken(context, settings);

            assert(result == tokenResponse);
            assert(exchangeTokenStub.calledOnce);
            assert(exchangeTokenStub.calledWith(context, settings, { token: 'token' }));
        });
    });
});
