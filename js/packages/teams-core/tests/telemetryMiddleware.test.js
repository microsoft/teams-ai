// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

const sinon = require('sinon');
const { ActivityTypes, Channels, TestAdapter, TelemetryLoggerMiddleware, NullTelemetryClient } = require('../');
const { strictEqual } = require('assert');

const createReply = (activity, text, locale = null) => ({
    type: ActivityTypes.Message,
    from: { id: activity.recipient.id, name: activity.recipient.name },
    recipient: { id: activity.from.id, name: activity.from.name },
    replyToId: activity.id,
    serviceUrl: activity.serviceUrl,
    channelId: activity.channelId,
    conversation: {
        isGroup: activity.conversation.isGroup,
        id: activity.conversation.id,
        name: activity.conversation.name,
    },
    text: text || '',
    locale: locale || activity.locale,
});

describe('TelemetryMiddleware', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    // Construct a mocked null telemetry client and return some helper methods for expression
    // expectations.
    const makeTelemetryClient = () => {
        const client = new NullTelemetryClient();
        const mock = sandbox.mock(client);

        const expectExactEvent = (name, properties = {}) => {
            mock.expects('trackEvent').withArgs(sinon.match({ name, properties })).once();
        };

        const expectTrackEvent = (name, properties = {}) => {
            expectExactEvent(name, {
                conversationName: sinon.match.string,
                recipientId: sinon.match.string,
                type: sinon.match.string,
                ...properties,
            });
        };

        const expectReceiveEvent = (properties = {}) => {
            expectTrackEvent(TelemetryLoggerMiddleware.botMsgReceiveEvent, {
                fromId: sinon.match.string,
                locale: sinon.match.string,
                ...properties,
            });
        };

        const expectSendEvent = (properties = {}) => {
            expectTrackEvent(TelemetryLoggerMiddleware.botMsgSendEvent, {
                replyActivityId: sinon.match.string,
                locale: sinon.match.string,
                ...properties,
            });
        };

        return {
            client,
            expectExactEvent,
            expectReceiveEvent,
            expectSendEvent,
            expectTrackEvent,
        };
    };

    // Make an adapter with the supplied logic and telemetry logger
    const makeAdapter = ({
        adapterLogic = async (context) => {
            await context.sendActivity({
                type: ActivityTypes.Typing,
                relatesTo: context.activity.relatesTo,
            });

            await context.sendActivity(`echo:${context.activity.text}`);
        },
        makeLogger = (telemetryClient, logPersonalInformation) =>
            new TelemetryLoggerMiddleware(telemetryClient, logPersonalInformation),
    }) => new TestAdapter(adapterLogic).use(makeLogger());

    it('should log send and receive activities', async function () {
        const { client, expectReceiveEvent, expectSendEvent } = makeTelemetryClient();

        expectReceiveEvent({
            conversationId: sinon.match.string,
            fromName: sinon.match.string,
            recipientName: sinon.match.string,
            text: 'foo',
            type: ActivityTypes.Message,
        });

        expectSendEvent({ conversationId: sinon.match.string, type: ActivityTypes.Typing });
        expectSendEvent({ conversationId: sinon.match.string, text: 'echo:foo' });

        expectReceiveEvent({
            conversationId: sinon.match.string,
            fromName: sinon.match.string,
            recipientName: sinon.match.string,
            text: 'bar',
            type: ActivityTypes.Message,
        });

        expectSendEvent({ conversationId: sinon.match.string, type: ActivityTypes.Typing });
        expectSendEvent({ conversationId: sinon.match.string, text: 'echo:bar' });

        const adapter = makeAdapter({
            makeLogger: () => new TelemetryLoggerMiddleware(client, true),
        });

        await adapter
            .send('foo')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();

        sandbox.verify();
    });

    it('should work with null telemetryClient', async function () {
        const adapter = makeAdapter({
            makeLogger: () => new TelemetryLoggerMiddleware(null, true),
        });

        await adapter
            .send('foo')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();

        sandbox.verify();
    });

    it('should not log PII properties for send and receive activities', async function () {
        const { client, expectReceiveEvent, expectSendEvent } = makeTelemetryClient();

        expectReceiveEvent({ fromName: undefined, text: undefined });
        expectSendEvent({ recipientName: undefined });
        expectSendEvent({ recipientName: undefined, text: undefined });

        const adapter = makeAdapter({
            makeLogger: () => new TelemetryLoggerMiddleware(client, false),
        });

        await adapter
            .send('foo')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .startTest();

        sandbox.verify();
    });

    it('telemetry should log update activities', async function () {
        const { client, expectReceiveEvent, expectSendEvent, expectTrackEvent } = makeTelemetryClient();

        expectReceiveEvent({ text: 'foo', type: ActivityTypes.Message });
        expectSendEvent();

        expectReceiveEvent({ text: 'update' });
        expectTrackEvent(TelemetryLoggerMiddleware.botMsgUpdateEvent, {
            conversationId: sinon.match.string,
            text: 'new response',
            type: ActivityTypes.Message,
        });

        const adapter = makeAdapter({
            adapterLogic: async (context) => {
                if (context.activity.text === 'update') {
                    await context.updateActivity({ ...context.activity, text: 'new response' });
                } else {
                    const activity = createReply(context.activity, 'response');
                    await context.sendActivity(activity);
                }
            },
            makeLogger: () => new TelemetryLoggerMiddleware(client, true),
        });

        await adapter.send('foo').delay(100).send('update').delay(100).startTest();

        sandbox.verify();
    });

    it('telemetry should log delete activities', async function () {
        const { client, expectReceiveEvent, expectSendEvent, expectTrackEvent } = makeTelemetryClient();

        expectReceiveEvent({ text: 'foo', type: ActivityTypes.Message });
        expectSendEvent({ text: 'response' });

        expectReceiveEvent({ text: 'delete' });
        expectTrackEvent(TelemetryLoggerMiddleware.botMsgDeleteEvent, { type: ActivityTypes.MessageDelete });

        let response;
        const adapter = makeAdapter({
            adapterLogic: async (context) => {
                if (context.activity.text === 'delete') {
                    await context.deleteActivity(response.id);
                } else {
                    const activity = createReply(context.activity, 'response');
                    response = await context.sendActivity(activity);
                }
            },
            makeLogger: () => new TelemetryLoggerMiddleware(client, true),
        });

        await adapter.send('foo').assertReply('response').send('delete').delay(200).startTest();

        sandbox.verify();
    });

    it('telemetry override RECEIVE with custom derived logger class', async function () {
        class OverrideLogger extends TelemetryLoggerMiddleware {
            async onReceiveActivity(activity) {
                this.telemetryClient.trackEvent({
                    name: TelemetryLoggerMiddleware.botMsgReceiveEvent,
                    properties: {
                        foo: 'bar',
                        ImportantProperty: 'ImportantValue',
                    },
                });

                this.telemetryClient.trackEvent({
                    name: 'MyReceive',
                    properties: await this.fillReceiveEventProperties(activity, { conversationName: 'OVERRIDE' }),
                });
            }
        }

        const { client, expectExactEvent, expectSendEvent } = makeTelemetryClient();

        expectExactEvent(TelemetryLoggerMiddleware.botMsgReceiveEvent, {
            foo: 'bar',
            ImportantProperty: 'ImportantValue',
        });
        expectExactEvent('MyReceive', { conversationName: 'OVERRIDE' });

        expectSendEvent();
        expectSendEvent();

        const adapter = makeAdapter({
            makeLogger: () => new OverrideLogger(client, true),
        });

        await adapter
            .send('foo')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .startTest();

        sandbox.verify();
    });

    it('telemetry override SEND with custom derived logger class', async function () {
        class OverrideLogger extends TelemetryLoggerMiddleware {
            async onSendActivity(activity) {
                this.telemetryClient.trackEvent({
                    name: TelemetryLoggerMiddleware.botMsgSendEvent,
                    properties: {
                        foo: 'bar',
                        ImportantProperty: 'ImportantValue',
                    },
                });

                this.telemetryClient.trackEvent({
                    name: 'MySend',
                    properties: await this.fillSendEventProperties(activity),
                });
            }
        }

        const { client, expectExactEvent, expectReceiveEvent } = makeTelemetryClient();

        expectReceiveEvent();

        expectExactEvent(TelemetryLoggerMiddleware.botMsgSendEvent, {
            foo: 'bar',
            ImportantProperty: 'ImportantValue',
        });
        expectExactEvent('MySend');

        expectExactEvent(TelemetryLoggerMiddleware.botMsgSendEvent, {
            foo: 'bar',
            ImportantProperty: 'ImportantValue',
        });
        expectExactEvent('MySend');

        const adapter = makeAdapter({
            makeLogger: () => new OverrideLogger(client, true),
        });

        await adapter
            .send('foo')
            .assertReply((activity) => strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .startTest();

        sandbox.verify();
    });

    it('telemetry override UPDATE with custom derived logger class', async function () {
        class OverrideLogger extends TelemetryLoggerMiddleware {
            async onUpdateActivity() {
                this.telemetryClient.trackEvent({
                    name: TelemetryLoggerMiddleware.botMsgUpdateEvent,
                    properties: {
                        foo: 'bar',
                        ImportantProperty: 'ImportantValue',
                    },
                });
            }
        }

        const { client, expectExactEvent, expectReceiveEvent, expectSendEvent } = makeTelemetryClient();

        expectReceiveEvent({ text: 'foo' });
        expectSendEvent();

        expectReceiveEvent({ text: 'update' });
        expectExactEvent(TelemetryLoggerMiddleware.botMsgUpdateEvent, {
            foo: 'bar',
            ImportantProperty: 'ImportantValue',
        });

        const adapter = makeAdapter({
            adapterLogic: async (context) => {
                if (context.activity.text === 'update') {
                    await context.updateActivity({ ...context.activity, text: 'new response' });
                } else {
                    const activity = createReply(context.activity, 'response');
                    await context.sendActivity(activity);
                }
            },
            makeLogger: () => new OverrideLogger(client, true),
        });

        await adapter.send('foo').delay(100).send('update').delay(100).startTest();

        sandbox.verify();
    });

    it('telemetry should log channel specific properties', async function () {
        const { client, expectReceiveEvent } = makeTelemetryClient();

        expectReceiveEvent({
            TeamsTeamInfo: '{"id":"teamid"}',
            TeamsTenantId: 'tenantid',
            TeamsUserAadObjectId: 'aadObjectId',
        });

        expectReceiveEvent({
            TeamsUserAadObjectId: 'aadObjectId',
        });

        const adapter = makeAdapter({
            adapterLogic: () => Promise.resolve(),
            makeLogger: () => new TelemetryLoggerMiddleware(client, true),
        });

        const teamsChannelData = {
            teamsChannelId: 'teamsChannelId',
            teamsTeamId: 'teamid',
            channel: { id: 'channelid' },
            team: { id: 'teamid' },
            tenant: { id: 'tenantid' },
        };

        const activity = {
            type: ActivityTypes.Message,
            channelId: Channels.Msteams,
            text: 'test',
            channelData: teamsChannelData,
            from: { id: 'fromId', name: 'fromName', aadObjectId: 'aadObjectId' },
        };

        // Unit test for https://github.com/microsoft/botbuilder-js/issues/2781
        const noChannelData = Object.assign({}, activity, { channelData: undefined });

        await adapter.send(activity).send(noChannelData).startTest();

        sandbox.verify();
    });
});
