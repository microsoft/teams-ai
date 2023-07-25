// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const sinon = require('sinon');
const { CloudAdapterBase, TurnContext, ActivityTypes, INVOKE_RESPONSE_KEY } = require('..');

const {
    BotFrameworkAuthenticationFactory,
    ClaimsIdentity,
    AuthenticationConstants,
} = require('botframework-connector');

class TestAdapter extends CloudAdapterBase {}

const noop = () => null;

describe('CloudAdapterBase', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = sinon.createSandbox({ useFakeTimers: true });
    });

    afterEach(function () {
        if (sandbox) {
            sandbox.restore();
        }
    });

    const authentication = BotFrameworkAuthenticationFactory.create();
    const adapter = new TestAdapter(authentication);

    const mockConnectorClient = (context) => {
        const connectorClient = {
            conversations: {
                createConversation: noop,
                deleteActivity: noop,
                replyToActivity: noop,
                sendToConversation: noop,
                updateActivity: noop,
            },
        };

        if (context) {
            context.turnState.set(context.adapter.ConnectorClientKey, connectorClient);
        }

        const mock = sandbox.mock(connectorClient.conversations);

        return { connectorClient, mock };
    };

    describe('constructor', function () {
        it('throws for bad args', function () {
            assert.throws(() => new TestAdapter(), {
                name: 'TypeError',
                message: '`botFrameworkAuthentication` parameter required',
            });
        });

        it('succeeds', function () {
            new TestAdapter(BotFrameworkAuthenticationFactory.create());
        });
    });

    describe('sendActivities', function () {
        it('throws for bad args', async function () {
            await assert.rejects(adapter.sendActivities(undefined, []), {
                name: 'TypeError',
                message: '`context` parameter required',
            });

            await assert.rejects(adapter.sendActivities(new TurnContext(adapter), undefined), {
                name: 'TypeError',
                message: '`activities` parameter required',
            });

            await assert.rejects(adapter.sendActivities(new TurnContext(adapter), []), {
                name: 'Error',
                message: 'Expecting one or more activities, but the array was empty.',
            });
        });

        it('delays activities', async function () {
            const resolved = sinon.fake();

            const promise = adapter
                .sendActivities(new TurnContext(adapter), [
                    {
                        type: 'delay',
                        value: 2000,
                    },
                ])
                .then(resolved);

            sandbox.clock.tick(1000);
            sinon.assert.notCalled(resolved);

            sandbox.clock.tick(1000);
            await promise;

            sinon.assert.called(resolved);
        });

        it('sets invoke response', async function () {
            const context = new TurnContext(adapter);
            const invokeResponse = {
                type: ActivityTypes.InvokeResponse,
                value: 'value',
            };

            await adapter.sendActivities(context, [invokeResponse]);

            assert.deepStrictEqual(context.turnState.get(INVOKE_RESPONSE_KEY), invokeResponse);
        });

        it('replies to an activity', async function () {
            const context = new TurnContext(adapter);

            const { mock } = mockConnectorClient(context);

            const activity = {
                conversation: {
                    id: 'conversationId',
                },
                replyToId: 'replyToId',
            };

            mock.expects('replyToActivity')
                .withArgs(activity.conversation.id, activity.replyToId, activity)
                .once()
                .resolves({ id: 'id' });

            assert.deepStrictEqual(await adapter.sendActivities(context, [activity]), [{ id: 'id' }]);

            sandbox.verify();
        });

        it('sends an activity to a conversation', async function () {
            const context = new TurnContext(adapter);
            const { mock } = mockConnectorClient(context);

            const activity = {
                conversation: {
                    id: 'conversationId',
                },
            };

            mock.expects('sendToConversation')
                .withArgs(activity.conversation.id, activity)
                .once()
                .resolves({ id: 'id' });

            assert.deepStrictEqual(await adapter.sendActivities(context, [activity]), [{ id: 'id' }]);

            sandbox.verify();
        });

        it('propagates errors', async function () {
            const context = new TurnContext(adapter);

            await assert.rejects(adapter.sendActivities(context, [{ type: ActivityTypes.Message, text: 'message' }]), {
                message: 'Unable to extract ConnectorClient from turn context.',
            });
        });
    });

    describe('updateActivity', function () {
        it('throws for bad args', async function () {
            await assert.rejects(adapter.updateActivity(undefined, {}), {
                name: 'TypeError',
                message: '`context` parameter required',
            });

            await assert.rejects(adapter.updateActivity(new TurnContext(adapter), undefined), {
                name: 'TypeError',
                message: '`activity` parameter required',
            });
        });

        it('works', async function () {
            const context = new TurnContext(adapter);
            const { mock } = mockConnectorClient(context);

            const activity = {
                conversation: {
                    id: 'conversationId',
                },
                activity: {
                    id: 'activityId',
                },
            };

            mock.expects('updateActivity')
                .withArgs(activity.conversation.id, activity.id, activity)
                .once()
                .resolves({ id: 'id' });

            assert.deepStrictEqual(await adapter.updateActivity(context, activity), { id: 'id' });

            sandbox.verify();
        });
    });

    describe('deleteActivity', function () {
        it('throws for bad args', async function () {
            await assert.rejects(adapter.deleteActivity(undefined, {}), {
                name: 'TypeError',
                message: '`context` parameter required',
            });

            await assert.rejects(adapter.deleteActivity(new TurnContext(adapter), undefined), {
                name: 'TypeError',
                message: '`reference` parameter required',
            });
        });

        it('works', async function () {
            const context = new TurnContext(adapter);
            const { mock } = mockConnectorClient(context);

            const reference = {
                conversation: {
                    id: 'conversationId',
                },
                activityId: 'activityId',
            };

            mock.expects('deleteActivity').withArgs(reference.conversation.id, reference.activityId).once().resolves();

            await adapter.deleteActivity(context, reference);

            sandbox.verify();
        });
    });

    describe('continueConversation', function () {
        it('rejects with deprecation notice', async function () {
            await assert.rejects(adapter.continueConversation(), {
                message:
                    '`CloudAdapterBase.continueConversation` is deprecated, please use `CloudAdapterBase.continueConversationAsync`',
            });
        });
    });

    describe('continueConversationAsync', function () {
        const bootstrap = (claimsMatcher) => {
            const serviceClientCredentials = { signRequest: (webResource) => Promise.resolve(webResource) };

            const serviceClientCredentialsFactory = {
                createCredentials: () => Promise.resolve(serviceClientCredentials),
            };

            authentication.credentialsFactory = serviceClientCredentialsFactory;

            const { connectorClient } = mockConnectorClient();
            const connectorFactory = { create: () => connectorClient };

            sandbox
                .mock(authentication)
                .expects('createConnectorFactory')
                .withArgs(claimsMatcher)
                .once()
                .returns(connectorFactory);

            const logic = sinon.fake((context) => {
                sinon.assert.match(
                    context,
                    sinon.match({
                        activity: {
                            name: 'ContinueConversation',
                        },
                    })
                );
            });

            return {
                logic,
                verify: () => {
                    sandbox.verify();
                    sinon.assert.called(logic);
                },
            };
        };

        it('works with a botId', async function () {
            const appId = 'appId';

            const { logic, verify } = bootstrap(
                sinon.match({
                    claims: sinon.match.some(sinon.match({ type: AuthenticationConstants.AppIdClaim, value: appId })),
                })
            );

            await adapter.continueConversationAsync(appId, {}, undefined, logic);

            verify();
        });

        it('works with claims', async function () {
            const appId = 'appId';

            const { logic, verify } = bootstrap(
                sinon.match({
                    claims: sinon.match.some(sinon.match({ type: AuthenticationConstants.AppIdClaim, value: appId })),
                })
            );

            await adapter.continueConversationAsync(
                new ClaimsIdentity([{ type: AuthenticationConstants.AppIdClaim, value: appId }]),
                {},
                logic
            );

            verify();
        });

        it('propagates errors', async function () {
            const appId = 'appId';

            const { logic } = bootstrap(
                sinon.match({
                    claims: sinon.match.some(sinon.match({ type: AuthenticationConstants.AppIdClaim, value: appId })),
                })
            );

            const error = new Error('oh no');

            await assert.rejects(
                adapter.continueConversationAsync(appId, {}, undefined, (context) => {
                    logic(context);

                    throw error;
                }),
                error
            );
        });
    });

    describe('createConversationAsync', function () {
        const bootstrap = (createMatchers, claimsMatcher) => {
            const serviceClientCredentials = { signRequest: (webResource) => Promise.resolve(webResource) };

            const serviceClientCredentialsFactory = {
                createCredentials: () => Promise.resolve(serviceClientCredentials),
            };

            authentication.credentialsFactory = serviceClientCredentialsFactory;

            const { connectorClient, mock: mockedConnectorClient } = mockConnectorClient();

            const connectorFactory = { create: noop };

            sandbox
                .mock(connectorFactory)
                .expects('create')
                .withArgs(...createMatchers)
                .once()
                .resolves(connectorClient);

            sandbox
                .mock(authentication)
                .expects('createConnectorFactory')
                .withArgs(claimsMatcher)
                .once()
                .returns(connectorFactory);

            const logic = sinon.fake((context) => {
                sinon.assert.match(
                    context,
                    sinon.match({
                        activity: {
                            name: 'CreateConversation',
                        },
                    })
                );
            });

            return {
                mockedConnectorClient,
                logic,
                verify: () => {
                    sandbox.verify();
                    sinon.assert.called(logic);
                },
            };
        };

        it('throws for bad args', async function () {
            await assert.rejects(
                adapter.createConversationAsync('botAppId', 'channelId', undefined, 'audience', {}, () => null),
                { name: 'TypeError' }
            );

            await assert.rejects(
                adapter.createConversationAsync('botAppId', 'channelId', '', 'audience', {}, () => null),
                { name: 'TypeError' }
            );

            await assert.rejects(
                adapter.createConversationAsync(
                    'botAppId',
                    'channelId',
                    'serviceUrl',
                    'audience',
                    undefined,
                    () => null
                ),
                { name: 'TypeError' }
            );

            await assert.rejects(
                adapter.createConversationAsync('botAppId', 'channelId', 'serviceUrl', 'audience', {}, undefined),
                { name: 'TypeError' }
            );
        });

        it('succeeds', async function () {
            const appId = 'appId';
            const serviceUrl = 'serviceUrl';
            const audience = 'audience';
            const parameters = { isGroup: false, bot: { id: 'botId' } };

            const { mockedConnectorClient, logic, verify } = bootstrap(
                [serviceUrl, audience],
                sinon.match({
                    claims: sinon.match.some(sinon.match({ type: AuthenticationConstants.AppIdClaim, value: appId })),
                })
            );

            mockedConnectorClient.expects('createConversation').withArgs(parameters).once().resolves({ id: 'id' });

            await adapter.createConversationAsync(appId, 'channelId', serviceUrl, audience, parameters, logic);

            verify();
        });

        it('propagates errors', async function () {
            const appId = 'appId';
            const serviceUrl = 'serviceUrl';
            const audience = 'audience';
            const parameters = { isGroup: false, bot: { id: 'botId' } };

            const { mockedConnectorClient, logic } = bootstrap(
                [serviceUrl, audience],
                sinon.match({
                    claims: sinon.match.some(sinon.match({ type: AuthenticationConstants.AppIdClaim, value: appId })),
                })
            );

            const error = new Error('oh no');

            mockedConnectorClient.expects('createConversation').withArgs(parameters).once().rejects(error);

            await assert.rejects(
                adapter.createConversationAsync(appId, 'channelId', serviceUrl, audience, parameters, logic),
                error
            );
        });
    });
});
