const assert = require('assert');
const { ActivityTypes, BotAdapter, DeliveryModes, MessageFactory, TurnContext } = require('../');

const activityId = 'activity ID';

const testMessage = {
    type: 'message',
    id: '1234',
    text: 'test',
    from: { id: 'user', name: 'User Name' },
    recipient: { id: 'bot', name: 'Bot Name' },
    conversation: { id: 'convo', name: 'Convo Name' },
    channelId: 'UnitTest',
    serviceUrl: 'https://example.org',
};

const testTraceMessage = {
    type: 'trace',
    name: 'TestTrace',
    valueType: 'https://example.org/test/trace',
    label: 'Test Trace',
};

class SimpleAdapter extends BotAdapter {
    sendActivities(context, activities) {
        const responses = [];
        assert(context, 'SimpleAdapter.sendActivities: missing context.');
        assert(activities, 'SimpleAdapter.sendActivities: missing activities.');
        assert(Array.isArray(activities), 'SimpleAdapter.sendActivities: activities not array.');
        assert(activities.length > 0, 'SimpleAdapter.sendActivities: empty activities array.');
        activities.forEach((a, i) => {
            assert(typeof a === 'object', `SimpleAdapter.sendActivities: activity[${i}] not an object.`);
            assert(typeof a.type === 'string', `SimpleAdapter.sendActivities: activity[${i}].type missing or invalid.`);
            responses.push({ id: '5678' });
        });
        return Promise.resolve(responses);
    }

    updateActivity(context, activity) {
        assert(context, 'SimpleAdapter.updateActivity: missing context.');
        assert(activity, 'SimpleAdapter.updateActivity: missing activity.');
        return Promise.resolve();
    }

    deleteActivity(context, reference) {
        assert(context, 'SimpleAdapter.deleteActivity: missing context.');
        assert(reference, 'SimpleAdapter.deleteActivity: missing reference.');
        assert(
            reference.activityId === '1234',
            `SimpleAdapter.deleteActivity: invalid activityId of "${reference.activityId}".`
        );
        return Promise.resolve();
    }
}

class SendAdapter extends BotAdapter {
    sendActivities(context, activities) {
        assert(context, 'SendAdapter.sendActivities: missing context.');
        assert(activities, 'SendAdapter.sendActivities: missing activities.');
        assert(Array.isArray(activities), 'SendAdapter.sendActivities: activities not array.');
        assert(activities.length > 0, 'SendAdapter.sendActivities: empty activities array.');
        return Promise.resolve(activities);
    }

    updateActivity(context, activity) {
        assert(context, 'SendAdapter.updateActivity: missing context.');
        assert(activity, 'SendAdapter.updateActivity: missing activity.');
        return Promise.resolve();
    }

    deleteActivity(context, reference) {
        assert(context, 'SendAdapter.deleteActivity: missing context.');
        assert(reference, 'SendAdapter.deleteActivity: missing reference.');
        return Promise.resolve();
    }
}

describe('TurnContext', function () {
    this.timeout(5000);

    it('should have adapter.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(context.adapter, 'missing property.');
        assert(context.adapter.deleteActivity, 'invalid property.');
    });

    it('should have activity.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(context.activity, 'missing property.');
        assert(context.activity.type === 'message', 'invalid property.');
    });

    it('should clone a passed in context.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        const ctx = new TurnContext(context);
        assert(ctx._adapter === context._adapter, '_adapter not cloned.');
        assert(ctx._activity === context._activity, '_activity not cloned.');
        assert(ctx._services === context._services, '_services not cloned.');
        assert(ctx._onDeleteActivity === context._onDeleteActivity, '_onDeleteActivity not cloned.');
        assert(ctx._onSendActivities === context._onSendActivities, '_onSendActivities not cloned.');
        assert(ctx._onUpdateActivity === context._onUpdateActivity, '_onUpdateActivity not cloned.');
        assert(ctx._respondedRef === context._respondedRef, '_respondedRef not cloned.');
    });

    it("responded should start as 'false'.", function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(context.responded === false, 'invalid value.');
    });

    it('should set responded.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.responded = true;
        assert(context.responded === true, 'responded not set.');
    });

    it('should throw if you set responded to false.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.responded = true;
        assert.throws(() => (context.responded = false), {
            message: "TurnContext: cannot set 'responded' to a value of 'false'.",
        });
    });

    it('should cache a value using turnState.set() and services.get().', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(context.turnState.get('foo') === undefined, 'invalid initial state.');
        context.turnState.set('foo', 'bar');
        assert(
            context.turnState.get('foo') === 'bar',
            `invalid value of "${context.turnState.get('foo')}" after set().`
        );
    });

    it('should inspect a value using has().', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(!context.turnState.has('bar'), 'invalid initial state for has().');
        context.turnState.set('bar', 'foo');
        assert(context.turnState.has('bar'), 'invalid initial state for has() after set().');
        context.turnState.set('bar', undefined);
        assert(context.turnState.has('bar'), 'invalid initial state for has() after set(undefined).');
    });

    it('should be able to use a Symbol with set(), get(), and has().', function () {
        const key = Symbol('foo');
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        assert(!context.turnState.has(key), 'invalid initial state for has().');
        context.turnState.set(key, 'bar');
        assert(context.turnState.get(key) === 'bar', `invalid value of "${context.turnState.get(key)}" after set().`);
        context.turnState.set(key, undefined);
        assert(context.turnState.has(key), 'invalid initial state for has() after set(undefined).');
    });

    it('should push() and pop() a new turn state.', function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.turnState.set('foo', 'a');
        context.turnState.push('foo', 'b');
        assert(
            context.turnState.get('foo') === 'b',
            `invalid value of "${context.turnState.get('foo')}" after push().`
        );
        const old = context.turnState.pop('foo');
        assert(old == 'b', 'popped value not returned.');
        assert(context.turnState.get('foo') === 'a', `invalid value of "${context.turnState.get('foo')}" after pop().`);
    });

    it('should sendActivity() and set responded.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        const response = await context.sendActivity(testMessage);
        assert(response, 'response is missing.');
        assert(response.id === '5678', `invalid response id of "${response.id}" sent back.`);
        assert(context.responded === true, 'context.responded not set after send.');
    });

    it('should send a text message via sendActivity().', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        const response = await context.sendActivity('test');
        assert(response, 'response is missing.');
        assert(response.id === '5678', `invalid response id of "${response.id}" sent back.`);
    });

    it('should send a text message with speak and inputHint added.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onSendActivities((ctx, activities, _next) => {
            assert(Array.isArray(activities), 'activities not array.');
            assert(activities.length === 1, 'invalid count of activities.');
            assert(activities[0].text === 'test', 'text wrong.');
            assert(activities[0].speak === 'say test', 'speak worng.');
            assert(activities[0].inputHint === 'ignoringInput', 'inputHint wrong.');
            return [];
        });
        await context.sendActivity('test', 'say test', 'ignoringInput');
    });

    it('should send a trace activity.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onSendActivities((ctx, activities, _next) => {
            assert(Array.isArray(activities), 'activities not array.');
            assert(activities.length === 1, 'invalid count of activities.');
            assert(activities[0].type === ActivityTypes.Trace, 'type wrong.');
            assert(activities[0].name === 'name-text', 'name wrong.');
            assert(activities[0].value === 'value-text', 'value worng.');
            assert(activities[0].valueType === 'valueType-text', 'valeuType wrong.');
            assert(activities[0].label === 'label-text', 'label wrong.');
            return [];
        });
        await context.sendTraceActivity('name-text', 'value-text', 'valueType-text', 'label-text');
    });

    it('should send multiple activities via sendActivities().', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        const responses = await context.sendActivities([testMessage, testMessage, testMessage]);
        assert(Array.isArray(responses), "responses isn't an array.");
        assert(responses.length > 0, 'empty responses array returned.');
        assert(responses.length === 3, `invalid responses array length of "${responses.length}" returned.`);
        assert(responses[0].id === '5678', `invalid response id of "${responses[0].id}" sent back.`);
    });

    it('should call onSendActivity() hook before delivery.', async function () {
        let count = 0;
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onSendActivities((ctx, activities, next) => {
            assert(ctx, 'context not passed to hook');
            assert(activities, 'activity not passed to hook');
            count = activities.length;
            return next();
        });
        await context.sendActivity(testMessage);
        assert(count === 1, 'send hook not called.');
    });

    it('should allow interception of delivery in onSendActivity() hook.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onSendActivities((_ctx, _activities, _next) => {
            return [];
        });
        const response = await context.sendActivity(testMessage);
        assert(response === undefined, 'call not intercepted.');
    });

    it('should call onUpdateActivity() hook before update.', async function () {
        let called = false;
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onUpdateActivity((ctx, activity, next) => {
            assert(ctx, 'context not passed to hook');
            assert(activity, 'activity not passed to hook');
            called = true;
            return next();
        });
        await context.updateActivity(testMessage);
        assert(called, 'update hook not called.');
    });

    it('should be able to update an activity with MessageFactory', async function () {
        let called = false;
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onUpdateActivity((ctx, activity, next) => {
            assert(ctx, 'context not passed to hook');
            assert(activity, 'activity not passed to hook');
            assert(activity.id === activityId, 'wrong activity passed to hook');
            assert(activity.conversation.id === testMessage.conversation.id, 'conversation ID not applied to activity');
            assert(activity.serviceUrl === testMessage.serviceUrl, 'service URL not applied to activity');
            called = true;
            return next();
        });
        const message = MessageFactory.text('test text');
        message.id = activityId;
        await context.updateActivity(message);
        assert(called, 'update hook not called.');
    });

    it('should call onDeleteActivity() hook before delete by "id".', async function () {
        let called = false;
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onDeleteActivity((ctx, reference, next) => {
            assert(ctx, 'context not passed to hook');
            assert(reference, 'missing reference');
            assert(reference.activityId === '1234', 'invalid activityId passed to hook');
            called = true;
            return next();
        });
        await context.deleteActivity('1234');
        assert(called, 'delete hook not called.');
    });

    it('should call onDeleteActivity() hook before delete by "reference".', async function () {
        let called = false;
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onDeleteActivity((ctx, reference, next) => {
            assert(reference, 'missing reference');
            assert(reference.activityId === '1234', 'invalid activityId passed to hook');
            called = true;
            return next();
        });
        await context.deleteActivity({ activityId: '1234' });
        assert(called, 'delete hook not called.');
    });

    it('should map an exception raised by a hook to a rejection.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        context.onDeleteActivity((_ctx, _reference, _next) => {
            throw new Error('failed');
        });
        await assert.rejects(async () => await context.deleteActivity('1234'), {
            message: 'failed',
        });
    });

    it('should round trip a conversation reference using getConversationReference() and applyConversationRefernce().', function () {
        // Convert to reference
        const testMessageWithLocale = JSON.parse(JSON.stringify(testMessage));
        testMessageWithLocale.locale = 'en_uS'; // Intentionally oddly-cased to check that it isn't defaulted somewhere, but tests stay in English
        const reference = TurnContext.getConversationReference(testMessageWithLocale);
        assert(reference.activityId, 'reference missing activityId.');
        assert(reference.bot, 'reference missing bot.');
        assert(reference.bot.id === testMessage.recipient.id, "reference bot.id doesn't match recipient.id.");
        assert(reference.channelId, 'reference missing channelId.');
        assert(reference.conversation, 'reference missing conversation.');
        assert(reference.locale, 'reference missing locale.');
        assert(reference.locale === testMessageWithLocale.locale, "reference locale doesn't match locale");
        assert(reference.serviceUrl, 'reference missing serviceUrl.');
        assert(reference.user, 'reference missing user.');
        assert(reference.user.id === testMessage.from.id, "reference user.id doesn't match from.id.");

        // Round trip back to outgoing activity
        const activity = TurnContext.applyConversationReference({ text: 'foo', type: 'message' }, reference);
        assert(activity.text, 'activity missing text');
        assert(activity.type, 'activity missing type');
        assert(activity.replyToId, 'activity missing replyToId');
        assert(activity.from, 'activity missing from');
        assert(activity.from.id === reference.bot.id, "activity from.id doesn't match bot.id");
        assert(activity.channelId, 'activity missing channelId');
        assert(activity.conversation, 'activity missing conversation');
        assert(activity.locale, 'activity missing locale.');
        assert(activity.locale === testMessageWithLocale.locale, "activity locale doesn't match locale");
        assert(activity.serviceUrl, 'activity missing serviceUrl');
        assert(activity.recipient, 'activity missing recipient');
        assert(activity.recipient.id === reference.user.id, "activity recipient.id doesn't match user.id");

        // Round trip back to incoming activity
        const activity2 = TurnContext.applyConversationReference({ text: 'foo', type: 'message' }, reference, true);
        assert(activity2.id, 'activity2 missing id');
        assert(activity2.from, 'activity2 missing from');
        assert(activity2.from.id === reference.user.id, "activity2 from.id doesn't match user.id");
        assert(activity2.recipient, 'activity2 missing recipient');
        assert(activity2.recipient.id === reference.bot.id, "activity2 recipient.id doesn't match bot.id");
        assert(activity2.locale, 'activity2 missing locale.');
        assert(activity2.locale === testMessageWithLocale.locale, "activity2 locale doesn't match locale");

        // Round trip outgoing activity without a replyToId
        delete reference.activityId;
        const activity3 = TurnContext.applyConversationReference({ text: 'foo', type: 'message' }, reference);
        assert(!Object.prototype.hasOwnProperty.call(activity3, 'replyToId'), 'activity3 has replyToId');

        // Round trip incoming activity without an id
        delete reference.activityId;
        const activity4 = TurnContext.applyConversationReference({ text: 'foo', type: 'message' }, reference, true);
        assert(!Object.prototype.hasOwnProperty.call(activity4, 'id'), 'activity4 has id');
    });

    it('should not set TurnContext.responded to true if Trace activity is sent.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        await context.sendActivities([testTraceMessage]);
        assert(context.responded === false, 'responded was set to true.');
    });

    it('should not set TurnContext.responded to true if multiple Trace activities are sent.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);
        await context.sendActivities([testTraceMessage, testTraceMessage]);
        assert(context.responded === false, 'responded was set to true.');
    });

    it('should set TurnContext.responded to true if Trace and message activities are sent.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);

        await context.sendActivities([testTraceMessage, testTraceMessage]);
        assert(context.responded === false, 'responded was set to true.');

        await context.sendActivities([testMessage]);
        assert(context.responded, 'responded was not set to true.');
    });

    it('should get a conversation reference from a sent activity using getReplyConversationReference.', async function () {
        const context = new TurnContext(new SimpleAdapter(), testMessage);

        const reply = await context.sendActivity({ text: 'test' });
        assert(reply.id, 'reply has an id');

        const reference = TurnContext.getReplyConversationReference(context.activity, reply);

        assert(reference.activityId, 'reference has an activity id');
        assert(reference.activityId === reply.id, 'reference id matches outgoing reply id');
    });

    it('should remove at mention from activity', function () {
        const activity = {
            type: 'message',
            text: '<at>TestOAuth619</at> test activity',
            recipient: { id: 'TestOAuth619' },
            entities: [
                {
                    type: 'mention',
                    text: '<at>TestOAuth619</at>',
                    mentioned: {
                        name: 'Bot',
                        id: 'TestOAuth619',
                    },
                },
            ],
        };

        const text = TurnContext.removeRecipientMention(activity);

        assert(text, ' test activity');
        assert(activity.text, ' test activity');
    });

    it('should clear existing activity.id in context.sendActivity().', async function () {
        const context = new TurnContext(new SendAdapter(), testMessage);
        const response = await context.sendActivity(testMessage);
        assert(response, 'response is missing.');
        assert(response.id === undefined, `invalid response id of "${response.id}" sent back. Should be 'undefined'`);
    });

    it('should add to bufferedReplyActivities if TurnContext.activity.deliveryMode === DeliveryModes.ExpectReplies', async function () {
        const activity = JSON.parse(JSON.stringify(testMessage));
        activity.deliveryMode = DeliveryModes.ExpectReplies;
        const context = new TurnContext(new SimpleAdapter(), activity);

        const activities = [MessageFactory.text('test'), MessageFactory.text('second test')];
        const responses = await context.sendActivities(activities);

        assert.strictEqual(responses.length, 2);

        // For expectReplies all ResourceResponses should have no id.
        assert(responses.every((response) => response.id === undefined));

        const replies = context.bufferedReplyActivities;
        assert.strictEqual(replies.length, 2);
        assert.strictEqual(replies[0].text, 'test');
        assert.strictEqual(replies[1].text, 'second test');
    });
});
