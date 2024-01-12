// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, ActivityTypes, TestAdapter, TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { TeamsSsoMessageExtensionAuthentication } from './TeamsSsoMessageExtensionAuthentication';
import { ConfidentialClientApplication } from '@azure/msal-node';
import assert from 'assert';
import * as sinon from 'sinon';

describe('TeamsSsoMessageExtensionAuthentication', () => {
    const adapter = new TestAdapter();

    const settings = {
        scopes: ['User.Read'],
        msalConfig: {
            auth: {
                clientId: 'test',
                clientSecret: 'test',
                authority: 'https://login.microsoftonline.com/common'
            }
        },
        signInLink: 'https://localhost/auth-start.html'
    };

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

    describe('isValidActivity()', async () => {
        it('only support composeExtension/query activity', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            assert.equal(auth.isValidActivity(context), true);
        });

        const unsupportedActivities = [
            'composeExtension/queryLink',
            'composeExtension/fetchTask',
            'composeExtension/anonymousQueryLink'
        ];

        unsupportedActivities.forEach((name) => {
            it(`should not support ${name}`, async () => {
                const [context, _] = await createTurnContextAndState({
                    type: ActivityTypes.Invoke,
                    name: name
                });

                const msal = new ConfidentialClientApplication(settings.msalConfig);
                const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

                assert.equal(auth.isValidActivity(context), false);
            });
        });
    });

    describe('handleSsoTokenExchange()', async () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return undefined if value does not contain authentication property', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query',
                value: {}
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.handleSsoTokenExchange(context);
            assert.equal(result, undefined);
        });

        it('should return undefined if authentication property does not contain token', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query',
                value: {
                    authentication: {}
                }
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.handleSsoTokenExchange(context);
            assert.equal(result, undefined);
        });

        it('should return undefined if token is empty', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query',
                value: {
                    authentication: {
                        token: ''
                    }
                }
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.handleSsoTokenExchange(context);
            assert.equal(result, undefined);
        });

        it('should return undefined if MSAL returns null', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query',
                value: {
                    authentication: {
                        token: 'test'
                    }
                }
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            sinon.stub(msal, 'acquireTokenOnBehalfOf').resolves(null);

            const result = await auth.handleSsoTokenExchange(context);
            assert.equal(result, undefined);
        });

        it('should return token response if MSAL returns token', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query',
                value: {
                    authentication: {
                        token: 'test'
                    }
                }
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const date = new Date();
            sinon.stub(msal, 'acquireTokenOnBehalfOf').resolves({
                accessToken: 'test',
                expiresOn: date,
                authority: '',
                uniqueId: '',
                tenantId: '',
                scopes: [],
                account: null,
                idToken: '',
                idTokenClaims: {},
                fromCache: false,
                tokenType: '',
                correlationId: ''
            });

            const result = await auth.handleSsoTokenExchange(context);
            assert.equal(result?.token, 'test');
            assert.equal(result?.expiration, date.toISOString());
            assert.equal(result?.connectionName, '');
        });
    });

    describe('handleUserSignIn()', async () => {
        it('should return undefined', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.handleUserSignIn(context, '');
            assert.equal(result, undefined);
        });
    });

    describe('getSignInLink()', async () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return sign in link', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.getSignInLink(context);
            assert.equal(result, 'https://localhost/auth-start.html?scope=User.Read&clientId=test&tenantId=common');
        });

        it('should concat scope with space', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            const settings = {
                scopes: ['User.Read', 'User.Write'],
                msalConfig: {
                    auth: {
                        clientId: 'test',
                        clientSecret: 'test',
                        authority: 'https://login.microsoftonline.com/common'
                    }
                },
                signInLink: 'https://localhost/auth-start.html'
            };

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.getSignInLink(context);
            assert.equal(
                result,
                'https://localhost/auth-start.html?scope=User.Read%20User.Write&clientId=test&tenantId=common'
            );
        });

        it('should use default authority if not specified', async () => {
            const [context, _] = await createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            const settings = {
                scopes: ['User.Read', 'User.Write'],
                msalConfig: {
                    auth: {
                        clientId: 'test',
                        clientSecret: 'test'
                    }
                },
                signInLink: 'https://localhost/auth-start.html'
            };

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoMessageExtensionAuthentication(settings, msal);

            const result = await auth.getSignInLink(context);
            assert.equal(
                result,
                'https://localhost/auth-start.html?scope=User.Read%20User.Write&clientId=test&tenantId=common'
            );
        });
    });
});
