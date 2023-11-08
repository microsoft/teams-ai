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
            it('should return token if successfully got token from user token from token store', async () => {
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
        });
    });
});
